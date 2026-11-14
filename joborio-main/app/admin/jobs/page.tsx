"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  adminListListings,
  adminListSyndicationFeeds,
  adminSyndicationJobs,
  refreshSyndicationCache,
  type SyndicationFeedRow,
} from "@/lib/api/admin";
import type { Listing } from "@/lib/api/types";
import { companyName } from "@/lib/jobs/companyName";

export default function AdminJobsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [feeds, setFeeds] = useState<SyndicationFeedRow[]>([]);
  const [selectedFeed, setSelectedFeed] = useState<string>("");
  const [syndicationTotal, setSyndicationTotal] = useState(0);
  const [syndicationMeta, setSyndicationMeta] = useState<Record<string, unknown>>({});
  const [sampleSyndicated, setSampleSyndicated] = useState<Array<Record<string, unknown>>>([]);
  const [loadingXml, setLoadingXml] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const applyFeedToUrl = (slug: string) => {
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("feed", slug);
    else url.searchParams.delete("feed");
    const qs = url.searchParams.toString();
    window.history.replaceState({}, "", qs ? `${url.pathname}?${qs}` : url.pathname);
  };

  const loadXmlJobs = useCallback(async (feedSlug: string) => {
    setLoadingXml(true);
    try {
      const { data, meta } = await adminSyndicationJobs({
        per_page: 40,
        feed: feedSlug || undefined,
        group_by_category: !feedSlug,
      });
      setSyndicationTotal(
        Number(meta.total ?? meta.total_in_feed ?? data.jobs?.length ?? 0),
      );
      setSyndicationMeta(data.source ?? {});
      setSampleSyndicated(data.jobs ?? []);
    } catch {
      setSampleSyndicated([]);
      setSyndicationTotal(0);
    } finally {
      setLoadingXml(false);
    }
  }, []);

  useEffect(() => {
    adminListListings({ per_page: 50 } as { per_page?: number })
      .then(({ data }) => setListings(data))
      .catch(() => setMsg("Failed to load marketplace listings"));

    const requested = new URLSearchParams(window.location.search).get("feed") ?? "";
    adminListSyndicationFeeds()
      .then((rows) => {
        setFeeds(rows);
        const valid =
          requested && rows.some((r) => r.slug === requested) ? requested : "";
        setSelectedFeed(valid);
        void loadXmlJobs(valid);
      })
      .catch(() => {
        void loadXmlJobs(requested);
      });
  }, [loadXmlJobs]);

  const selectFeed = (slug: string) => {
    setSelectedFeed(slug);
    applyFeedToUrl(slug);
    void loadXmlJobs(slug);
  };

  const refreshFeed = async () => {
    try {
      await refreshSyndicationCache();
      await loadXmlJobs(selectedFeed);
      setMsg("Syndication cache refreshed");
    } catch {
      setMsg("Refresh failed");
    }
  };

  const activeFeedName =
    feeds.find((f) => f.slug === selectedFeed)?.name ??
    (selectedFeed ? selectedFeed : "All feeds");

  return (
    <>
      <h1 className="text-2xl font-bold">Jobs</h1>
      <p className="mt-1 text-sm text-slate-400">
        Marketplace listings (database) and XML syndication from JobRapido, WhatsJobs, and other
        configured feeds. Click a feed to see only that source.
      </p>
      {msg ? <p className="mt-2 text-sm text-amber-300">{msg}</p> : null}

      <section className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">XML syndication</h2>
            <p className="text-sm text-slate-400">
              {loadingXml ? "Loading…" : `${syndicationTotal} jobs`}
              {selectedFeed
                ? ` · ${activeFeedName}`
                : syndicationMeta.feed_count != null
                  ? ` · ${String(syndicationMeta.feed_count)} feed(s)`
                  : " · all feeds"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={
                selectedFeed
                  ? `/admin/syndication-feeds/?feed=${encodeURIComponent(selectedFeed)}`
                  : "/admin/syndication-feeds"
              }
              className="rounded-lg border border-white/20 px-3 py-2 text-sm"
            >
              Manage XML URLs
            </Link>
            <button
              type="button"
              onClick={refreshFeed}
              className="rounded-lg border border-white/20 px-3 py-2 text-sm"
            >
              Refresh XML cache
            </button>
            <Link href="/jobs" className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold">
              Public jobs page
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => selectFeed("")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              !selectedFeed
                ? "bg-emerald-500 text-zinc-950"
                : "border border-white/15 bg-white/5 text-slate-300 hover:border-emerald-400/50"
            }`}
          >
            All feeds
          </button>
          {feeds.map((feed) => (
            <button
              key={feed.id}
              type="button"
              onClick={() => selectFeed(feed.slug)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                selectedFeed === feed.slug
                  ? "bg-emerald-500 text-zinc-950"
                  : "border border-white/15 bg-white/5 text-slate-300 hover:border-emerald-400/50"
              }`}
            >
              {feed.name}
              <span className="ml-1 opacity-70">({feed.last_job_count})</span>
            </button>
          ))}
        </div>

        <ul className="mt-4 space-y-2 text-sm">
          {loadingXml ? (
            <li className="text-slate-500">Loading XML jobs…</li>
          ) : sampleSyndicated.length === 0 ? (
            <li className="text-slate-500">
              No syndicated jobs
              {selectedFeed ? ` for ${activeFeedName}` : ""} right now.
            </li>
          ) : (
            sampleSyndicated.map((j) => (
              <li
                key={String(j.reference_id)}
                className="flex flex-wrap items-start justify-between gap-2 border-t border-white/10 pt-2"
              >
                <div>
                  <span className="font-medium">{String(j.title)}</span>
                  {" · "}
                  {companyName(typeof j.company === "string" ? j.company : "", "")}
                  {" · "}
                  {String(j.category || "")}
                </div>
                <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                  {String(j.syndication_feed_name || j.syndication_feed_slug || "XML")}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Marketplace listings (DB)</h2>
          <Link href="/admin/listings" className="text-sm text-purple-300">
            Manage listings →
          </Link>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {listings.map((l) => (
            <li
              key={l.id}
              className="flex flex-wrap justify-between gap-2 rounded-lg border border-white/10 px-3 py-2"
            >
              <span>
                {l.title} · {l.company_name} · {l.status}
              </span>
              <span className="text-slate-400">{l.source ?? "—"}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
