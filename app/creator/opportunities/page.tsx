"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Copy, Check, Pin, EyeOff } from "lucide-react";
import {
  fetchCreatorListings,
  patchCreatorListing,
  recordJobActivity,
  type CreatorListingRow,
} from "@/lib/api/creator";
import { fetchMe } from "@/lib/api/auth";
import type { SyndicatedJob } from "@/lib/api/syndication";
import { fetchPublicXmlJobs } from "@/lib/syndication/publicXmlFeed";
import { shareJobUrl } from "@/lib/tracking/subid";
import { rememberPublicCode } from "@/lib/auth/session";
import {
  mapOpportunityCategory,
  postedAgo,
  type OpportunityCategory,
} from "@/lib/home/opportunityCards";
import { companyName } from "@/lib/jobs/companyName";
import { jobMatchesPromoteTypes, PROMOTE_JOB_TYPES } from "@/lib/jobs/promoteTypes";
import ShareLinkButton from "@/components/share/ShareLinkButton";
import { syndicatedJobPath } from "@/lib/staticExport";

type CategoryFilter = "all" | OpportunityCategory;
type JobTypeFilter = "all" | string;

const CATEGORY_TABS: Array<{ id: CategoryFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "hiring", label: "Jobs" },
  { id: "course", label: "Courses" },
  { id: "tools", label: "Tools" },
];

export default function CreatorOpportunitiesPage() {
  const [rows, setRows] = useState<CreatorListingRow[]>([]);
  const [xmlJobs, setXmlJobs] = useState<SyndicatedJob[]>([]);
  const [publicCode, setPublicCode] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedXml, setCopiedXml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [xmlError, setXmlError] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [jobType, setJobType] = useState<JobTypeFilter>("all");
  const [search, setSearch] = useState("");

  const load = () => {
    fetchCreatorListings()
      .then(setRows)
      .catch(() => setError("Could not load your listings. Complete onboarding."));
  };

  useEffect(() => {
    load();
    fetchMe()
      .then((user) => setPublicCode(rememberPublicCode(user)))
      .catch(() => setPublicCode(null));
    fetchPublicXmlJobs({ per_page: 48, page: 1, auth: true, for_creator: true })
      .then((res) => {
        setXmlJobs(res.jobs);
        setXmlError(
          res.jobs.length
            ? null
            : "No jobs match your skills and job types yet.",
        );
      })
      .catch(() => {
        setXmlJobs([]);
        setXmlError("Live jobs could not be loaded. Refresh the page and try again.");
      });
  }, []);

  const filteredXml = useMemo(() => {
    const q = search.trim().toLowerCase();
    return xmlJobs.filter((job) => {
      const cat = mapOpportunityCategory(
        job.category,
        job.jobtype,
        job.title,
        job.description_text,
      );
      if (category !== "all" && cat !== category) return false;
      if (jobType !== "all") {
        const hay = [job.title, job.jobtype, job.location, job.location_label, job.description_text]
          .filter(Boolean)
          .join(" ");
        if (!jobMatchesPromoteTypes(hay, [jobType])) return false;
      }
      if (q) {
        const hay = `${job.title} ${job.company} ${job.location_label || job.location || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [xmlJobs, category, jobType, search]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(({ listing }) => {
      const cat =
        listing.type === "course"
          ? "course"
          : listing.type === "tool"
            ? "tools"
            : mapOpportunityCategory(listing.type, listing.category, listing.title);
      if (category !== "all" && cat !== category) return false;
      if (q) {
        const hay = `${listing.title} ${listing.company_name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, category, search]);

  const trackXml = (job: SyndicatedJob) => {
    void recordJobActivity({
      reference_id: job.reference_id,
      action: "view",
      title: job.title,
      company: job.company,
    }).catch(() => undefined);
  };

  const copy = async (url: string, id: number) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggle = async (
    listingId: number,
    field: "is_pinned" | "is_hidden",
    value: boolean,
  ) => {
    await patchCreatorListing(listingId, { [field]: value });
    load();
  };

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
          Share & earn
        </p>
        <h1 className="mt-1 text-3xl font-bold">Your page listings</h1>
        <p className="mt-2 max-w-2xl text-slate-500">
          Only jobs that match your skills, job types, and location are listed
          here. Share the JobOrio link so the visit is counted on your account.
        </p>
        {publicCode ? (
          <p className="mt-3 inline-flex rounded-full bg-purple-50 px-3 py-1 text-sm font-semibold text-purple-800">
            Your id: {publicCode}
          </p>
        ) : null}
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {CATEGORY_TABS.map((tab) => {
            const active = category === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategory(tab.id)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  active
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-purple-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Job type
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-[#172b63] outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10"
            >
              <option value="all">All types</option>
              {PROMOTE_JOB_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Search
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title, company, location…"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#172b63] outline-none placeholder:text-slate-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10"
            />
          </label>
        </div>
      </div>

      <div className="mb-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-bold">Jobs for you</h2>
          <p className="text-xs font-semibold text-slate-400">
            {filteredXml.length} shown
          </p>
        </div>

        {filteredXml.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredXml.map((job) => {
              const shareUrl = publicCode
                ? shareJobUrl(publicCode, job.reference_id)
                : "";
              const cat = mapOpportunityCategory(
                job.category,
                job.jobtype,
                job.title,
              );
              return (
                <li key={job.reference_id} className="h-full">
                  <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-700">
                        {cat === "course" ? "Course" : cat === "tools" ? "Tools" : "Job"}
                      </span>
                      {job.jobtype ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {job.jobtype}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-3 line-clamp-2 font-bold text-[#172b63]">
                      {job.title}
                    </h3>
                    <p className="mt-2 text-xs font-semibold text-emerald-600">
                      {postedAgo(job.publishdate)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {companyName(job.company, "Company")} ·{" "}
                      {job.location_label || job.location || "Remote"}
                    </p>
                    <div className="mt-auto flex flex-wrap gap-2 pt-4">
                      <Link
                        href={syndicatedJobPath(job.reference_id)}
                        onClick={() => trackXml(job)}
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
                      >
                        View more
                      </Link>
                      {shareUrl ? (
                        <ShareLinkButton
                          url={shareUrl}
                          title={job.title}
                          onShare={() => trackXml(job)}
                        />
                      ) : null}
                      <button
                        type="button"
                        disabled={!shareUrl}
                        onClick={() => {
                          trackXml(job);
                          void navigator.clipboard.writeText(shareUrl);
                          setCopiedXml(job.reference_id);
                          setTimeout(() => setCopiedXml(null), 2000);
                        }}
                        className="inline-flex items-center gap-1 rounded-full bg-[#172b63] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                      >
                        {copiedXml === job.reference_id ? (
                          <>
                            <Check size={14} /> Copied
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> Copy link
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        ) : xmlError ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {xmlError}{" "}
            <Link href="/creator/campaigns" className="font-semibold underline">
              Update campaigns & preferences
            </Link>
          </p>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            No opportunities match these filters.
          </p>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-lg font-bold">Your page listings</h2>
        <p className="text-xs font-semibold text-slate-400">
          {filteredRows.length} shown
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </p>
      ) : null}

      {filteredRows.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredRows.map(({ listing, tracked_url, is_pinned, is_hidden }) => (
            <li key={listing.id} className="h-full">
              <article
                className={`flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm ${
                  is_hidden ? "border-slate-100 opacity-60" : "border-slate-200"
                }`}
              >
                <div className="flex flex-wrap gap-2">
                  {is_pinned ? (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                      PINNED
                    </span>
                  ) : null}
                  {is_hidden ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                      HIDDEN
                    </span>
                  ) : null}
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                    {listing.type || "job"}
                  </span>
                </div>
                <h2 className="mt-3 line-clamp-2 font-bold text-[#172b63]">
                  {listing.title}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {listing.company_name} ·{" "}
                  {listing.location_label ??
                    (listing.is_remote ? "Remote" : listing.country_code)}
                </p>
                <p className="mt-2 text-sm font-semibold text-purple-600">
                  ${Number(listing.ppc_rate_usd ?? 0.03).toFixed(2)} / click
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => toggle(listing.id, "is_pinned", !is_pinned)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold"
                  >
                    <Pin size={14} />
                    {is_pinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(listing.id, "is_hidden", !is_hidden)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold"
                  >
                    <EyeOff size={14} />
                    {is_hidden ? "Show" : "Hide"}
                  </button>
                  <ShareLinkButton url={tracked_url} title={listing.title} />
                  <button
                    type="button"
                    onClick={() => copy(tracked_url, listing.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-[#172b63] px-3 py-1.5 text-xs font-bold text-white"
                  >
                    {copiedId === listing.id ? (
                      <>
                        <Check size={14} /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copy link
                      </>
                    )}
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : !error ? (
        <p className="text-sm text-slate-500">No listings match these filters.</p>
      ) : null}
    </>
  );
}
