"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  List,
  Map as MapIcon,
  RefreshCw,
  Search,
} from "lucide-react";
import GoogleMapPanel from "@/components/maps/GoogleMapPanel";
import { fetchListingMapPoints } from "@/lib/api/maps";
import type { MapMarker } from "@/lib/maps/googleMaps";
import { fetchListings } from "@/lib/api/listings";
import type { Listing } from "@/lib/api/types";
import { API_BASE_URL } from "@/lib/config";
import { postedAgo } from "@/lib/home/opportunityCards";
import { companyName } from "@/lib/jobs/companyName";
import {
  fetchSyndicatedJobs,
  refreshSyndicationCache,
  type SyndicatedJob,
} from "@/lib/api/syndication";
import { fetchPublicXmlJobs } from "@/lib/syndication/publicXmlFeed";
import ApplySyndicatedJobButton from "@/components/jobs/ApplySyndicatedJobButton";
import ViewJobLink from "@/components/jobs/ViewJobLink";
import { listingJobPath, syndicatedJobPath } from "@/lib/staticExport";

function JobCard({ job }: { job: SyndicatedJob }) {
  const detailPath = syndicatedJobPath(job.reference_id);
  return (
    <article className="group rounded-2xl border border-[#E9EEF6] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
          <Briefcase size={22} />
        </div>
        {job.category ? (
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
            {job.category}
          </span>
        ) : null}
        {job.is_sample ? (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
            Demo sample
          </span>
        ) : job.reference_id.startsWith("public:") ? (
          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
            Local XML
          </span>
        ) : null}
      </div>
      <h2 className="mt-4 text-lg font-bold leading-snug">
        <ViewJobLink href={detailPath} className="hover:text-purple-600">
          {job.title}
        </ViewJobLink>
      </h2>
      <p className="mt-2 text-xs font-semibold text-emerald-600">{postedAgo(job.publishdate)}</p>
      <p className="mt-1 text-sm text-slate-500">
        {companyName(job.company, "Company")} · {job.location_label || job.country}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
        {job.jobtype ? (
          <span className="rounded-md bg-slate-100 px-2 py-0.5">{job.jobtype}</span>
        ) : null}
        {job.experience ? (
          <span className="rounded-md bg-slate-100 px-2 py-0.5">{job.experience}</span>
        ) : null}
        {job.salary ? (
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-700">
            {job.salary}
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ViewJobLink
          href={detailPath}
          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 group-hover:text-purple-600"
        >
          Details
          <ArrowRight size={14} />
        </ViewJobLink>
        <ApplySyndicatedJobButton
          applyUrl={job.url}
          returnPath={detailPath}
          referenceId={job.reference_id}
          title={job.title}
          company={companyName(job.company)}
          className="text-xs font-semibold text-purple-600 hover:text-purple-800"
        >
          Apply →
        </ApplySyndicatedJobButton>
      </div>
    </article>
  );
}

function MarketplaceCard({ job }: { job: Listing }) {
  return (
    <article className="rounded-2xl border border-[#E9EEF6] bg-white p-5 shadow-sm">
      <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
        Marketplace
      </span>
      <h2 className="mt-3 text-lg font-bold">{job.title}</h2>
      <p className="mt-2 text-sm text-slate-500">
        {job.company_name ?? "Company"} ·{" "}
        {job.location_label ?? (job.is_remote ? "Remote" : job.country_code)}
      </p>
      <ViewJobLink
        href={listingJobPath(job.id)}
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-purple-600"
      >
        Details <ArrowRight size={14} />
      </ViewJobLink>
    </article>
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<SyndicatedJob[]>([]);
  const [sourceMeta, setSourceMeta] = useState<{
    publisher?: string;
    lastbuilddate?: string;
    error?: string;
    feed_note?: string;
    sample_fallback?: boolean;
  }>({});
  const [marketplace, setMarketplace] = useState<Listing[]>([]);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [marketView, setMarketView] = useState<"list" | "map">("list");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const publicRes = await fetchPublicXmlJobs({
        page,
        per_page: 100,
        search: search || undefined,
      });
      if (publicRes.success && publicRes.jobs.length > 0) {
        setJobs(publicRes.jobs);
        setSourceMeta(publicRes.meta.source ?? {});
        setTotal(
          publicRes.meta.has_more
            ? page * publicRes.meta.per_page + 1
            : (page - 1) * publicRes.meta.per_page + publicRes.jobs.length,
        );
        setLastPage(publicRes.meta.has_more ? page + 1 : page);
      } else {
        const json = await fetchSyndicatedJobs({
          search: search || undefined,
          page,
          per_page: 100,
        });
        if (!json.success) {
          setJobs([]);
          setError("Could not load jobs.");
        } else {
          setJobs(json.data.jobs ?? []);
          setSourceMeta(json.data.source ?? {});
          setTotal(json.meta?.total ?? json.data.jobs?.length ?? 0);
          setLastPage(json.meta?.last_page ?? 1);
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not load jobs.";
      setError(message);
      setJobs([]);
    }

    try {
      const { data } = await fetchListings({ per_page: 30, search: search || undefined });
      setMarketplace(data);
    } catch {
      setMarketplace([]);
    }

    try {
      const points = await fetchListingMapPoints({ limit: 80 });
      setMapMarkers(
        points.map((p) => ({
          id: p.id,
          lat: Number(p.latitude),
          lng: Number(p.longitude),
          title: p.title,
          subtitle: `${p.company_name ?? "Company"} · ${p.location_label ?? p.country_code ?? ""}`,
        })),
      );
    } catch {
      setMapMarkers([]);
    }

    setLoading(false);
  }, [search, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <main className="min-h-screen bg-[#fff9fd] pb-20 text-[#172b63]">
      <section className="border-b border-purple-100 bg-gradient-to-br from-[#081638] via-[#172b63] to-purple-900 pb-16 pt-32 text-white">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <h1 className="text-page-hero">Jobs in India</h1>
          {sourceMeta.lastbuilddate || sourceMeta.publisher ? (
            <p className="mt-4 text-xs text-white/40">
              {sourceMeta.lastbuilddate
                ? `Updated ${String(sourceMeta.lastbuilddate)}`
                : null}
              {sourceMeta.publisher ? ` · ${String(sourceMeta.publisher)}` : ""}
            </p>
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, company, location…"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm shadow-sm outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                await refreshSyndicationCache();
                load();
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {sourceMeta.feed_note ? (
          <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {sourceMeta.feed_note}
            {sourceMeta.error ? ` (live fetch: ${sourceMeta.error})` : ""}
          </p>
        ) : null}

        {error ? (
          <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-10 text-sm text-slate-500">Loading jobs from XML feed…</p>
        ) : error && marketplace.length === 0 ? (
          null
        ) : total === 0 && marketplace.length === 0 ? (
          <p className="mt-10 text-sm text-slate-500">
            No jobs match your filters. Ensure Laravel is running at{" "}
            <code className="text-xs">{API_BASE_URL}</code> and click Refresh.
          </p>
        ) : (
          <>
            <p className="mt-8 flex items-center gap-2 text-sm text-slate-500">
              <List size={16} className="text-purple-600" />
              Showing {jobs.length} jobs
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <JobCard key={job.reference_id} job={job} />
              ))}
            </div>
            {lastPage > 1 ? (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  Page {page} of {lastPage}
                </span>
                <button
                  type="button"
                  disabled={page >= lastPage}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        )}

        {marketplace.length > 0 || mapMarkers.length > 0 ? (
          <section className="mt-14">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-indigo-950">
                  Creator marketplace listings
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tracked opportunities from your JobOrio database (separate from Jobrapido XML).
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMarketView("list")}
                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold ${
                    marketView === "list"
                      ? "bg-purple-600 text-white"
                      : "border border-slate-200 bg-white"
                  }`}
                >
                  <List size={14} /> List
                </button>
                <button
                  type="button"
                  onClick={() => setMarketView("map")}
                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold ${
                    marketView === "map"
                      ? "bg-purple-600 text-white"
                      : "border border-slate-200 bg-white"
                  }`}
                >
                  <MapIcon size={14} /> Map
                </button>
              </div>
            </div>
            {marketView === "map" ? (
              <div className="mt-5">
                <GoogleMapPanel
                  markers={mapMarkers}
                  height={420}
                  emptyMessage="No geocoded listings yet. Set GOOGLE_MAPS_API_KEY and run php artisan listings:geocode."
                />
              </div>
            ) : (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {marketplace.map((job) => (
                  <MarketplaceCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </section>
        ) : null}

        <p className="mt-12 text-center text-sm text-slate-500">
          <Link href="/signup" className="font-bold text-purple-600">
            Sign up
          </Link>{" "}
          to share tracked links when marketplace listings are enabled.
        </p>
      </div>
    </main>
  );
}
