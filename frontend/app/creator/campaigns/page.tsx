"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Check, Pin, EyeOff } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import {
  fetchCreatorCampaigns,
  fetchCreatorListings,
  fetchTrackLink,
  optInCampaign,
  patchCreatorListing,
  recordJobActivity,
  type CreatorCampaignRow,
  type CreatorListingRow,
} from "@/lib/api/creator";
import { fetchMe } from "@/lib/api/auth";
import type { SyndicatedJob } from "@/lib/api/syndication";
import { fetchAllPublicXmlJobs } from "@/lib/syndication/publicXmlFeed";
import { shareJobUrl } from "@/lib/tracking/subid";
import { rememberPublicCode } from "@/lib/auth/session";
import {
  mapOpportunityCategory,
  postedAgo,
} from "@/lib/home/opportunityCards";
import { companyName } from "@/lib/jobs/companyName";
import { formatMoney } from "@/lib/money";
import { jobMatchesPromoteTypes, PROMOTE_JOB_TYPES } from "@/lib/jobs/promoteTypes";
import ShareLinkButton from "@/components/share/ShareLinkButton";
import { syndicatedJobPath } from "@/lib/staticExport";
import PageHeader from "@/components/layout/PageHeader";

type TabId =
  | "all"
  | "ppc"
  | "ppr"
  | "course"
  | "hiring"
  | "tools"
  | "ppa"
  | "ppe";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "all", label: "Recent" },
  { id: "ppc", label: "PPC" },
  { id: "ppr", label: "PPR" },
  { id: "course", label: "Courses" },
  { id: "hiring", label: "Jobs" },
  { id: "tools", label: "Tools" },
  { id: "ppa", label: "PPA" },
  { id: "ppe", label: "PPE" },
];

const DEFAULT_PPC_RATE = 0.01;

function sectionTitle(tab: TabId): string {
  if (tab === "course") return "Courses for you";
  if (tab === "tools") return "Tools for you";
  if (tab === "hiring") return "Jobs for you";
  if (tab === "ppc" || tab === "ppr" || tab === "ppa" || tab === "ppe") {
    return "Campaigns for you";
  }
  return "Picked for you";
}

function campaignSortTs(row: CreatorCampaignRow): number {
  const p = row.program as Record<string, unknown>;
  const raw =
    p.starts_at ?? p.updated_at ?? p.created_at ?? p.published_at ?? null;
  const ts = raw ? Date.parse(String(raw)) : NaN;
  return Number.isFinite(ts) ? ts : 0;
}

function xmlSortTs(job: SyndicatedJob): number {
  const ts = job.publishdate ? Date.parse(job.publishdate) : NaN;
  return Number.isFinite(ts) ? ts : 0;
}

function campaignMatchesTab(row: CreatorCampaignRow, tab: TabId): boolean {
  if (tab === "all") return true;
  const pricing = String(row.program.pricing_model ?? "").toLowerCase();
  const promo = String(row.program.promotion_type ?? "").toLowerCase();
  if (tab === "ppc" || tab === "ppr" || tab === "ppa" || tab === "ppe") {
    return pricing === tab || (tab === "ppe" && promo === "post_promote");
  }
  if (tab === "course") return promo === "course";
  if (tab === "tools") return promo === "tool";
  if (tab === "hiring") return promo === "job" || (!promo && pricing === "ppc");
  return true;
}

function listingMatchesTab(listing: CreatorListingRow["listing"], tab: TabId): boolean {
  if (tab === "all") return true;
  const type = String(listing.type ?? "").toLowerCase();
  const cat = mapOpportunityCategory(listing.type, listing.category, listing.title);
  if (tab === "course") return type === "course" || cat === "course";
  if (tab === "tools") return type === "tool" || type === "tools" || cat === "tools";
  if (tab === "hiring") return cat === "hiring" && type !== "course" && type !== "tool";
  // PPC/PPR/PPA/PPE are campaign pricing — listings with rates still show under all/hiring
  if (tab === "ppc") return Number(listing.ppc_rate_usd ?? 0) > 0;
  if (tab === "ppr") return Number(listing.ppr_rate_usd ?? 0) > 0;
  if (tab === "ppa") return Number(listing.ppa_rate_usd ?? 0) > 0;
  return false;
}

function xmlMatchesTab(job: SyndicatedJob, tab: TabId): boolean {
  if (tab === "all" || tab === "hiring") {
    const cat = mapOpportunityCategory(
      job.category,
      job.jobtype,
      job.title,
      job.description_text,
    );
    if (tab === "hiring") return cat === "hiring";
    return true;
  }
  if (tab === "course" || tab === "tools") {
    return (
      mapOpportunityCategory(
        job.category,
        job.jobtype,
        job.title,
        job.description_text,
      ) === tab
    );
  }
  // PPC/PPR/PPA/PPE tabs are for paid campaigns, not raw XML jobs
  return false;
}

function rateLabel(model: string) {
  if (model === "ppc") return "click";
  if (model === "ppr") return "signup";
  if (model === "ppe") return "engagement";
  return "application";
}

function campaignListingId(program: CreatorCampaignRow["program"]): number {
  const nested = Number(program.listing?.id ?? 0);
  if (nested > 0) return nested;
  return Number((program as { listing_id?: number }).listing_id ?? 0);
}

export default function CreatorCampaignsPage() {
  const [rows, setRows] = useState<CreatorListingRow[]>([]);
  const [campaigns, setCampaigns] = useState<CreatorCampaignRow[]>([]);
  const [xmlJobs, setXmlJobs] = useState<SyndicatedJob[]>([]);
  const [publicCode, setPublicCode] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedXml, setCopiedXml] = useState<string | null>(null);
  const [copiedCampaign, setCopiedCampaign] = useState<number | null>(null);
  const [trackUrls, setTrackUrls] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [xmlError, setXmlError] = useState<string | null>(null);
  const [xmlFeedNote, setXmlFeedNote] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("all");
  const [jobType, setJobType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const load = () => {
    fetchCreatorListings()
      .then(setRows)
      .catch(() => setError("Could not load your listings. Complete onboarding."));
    fetchCreatorCampaigns()
      .then(setCampaigns)
      .catch(() => setCampaigns([]));
  };

  useEffect(() => {
    load();
    fetchMe()
      .then((user) => setPublicCode(rememberPublicCode(user)))
      .catch(() => setPublicCode(null));
    fetchAllPublicXmlJobs({
      per_page: 100,
      maxPages: 10,
      auth: true,
      for_creator: true,
    })
      .then((res) => {
        const unique = uniqueSyndicatedJobs(res.jobs);
        setXmlJobs(unique);
        const feeds = Array.isArray(res.meta.source?.feeds)
          ? (res.meta.source.feeds as Array<Record<string, unknown>>)
          : [];
        const sample = feeds.some((f) => Boolean(f.sample_fallback));
        const note = feeds
          .map((f) => String(f.feed_note ?? ""))
          .find((n) => n.trim());
        const inFeed = Number(res.meta.total_in_feed ?? res.meta.total ?? 0);
        if (sample || (note && inFeed <= 5)) {
          setXmlFeedNote(
            note ||
              "Live XML feed is empty or blocked. Showing sample jobs until WhatJobs is connected.",
          );
        } else {
          setXmlFeedNote(null);
        }
        setXmlError(
          unique.length
            ? null
            : "No jobs match your skills and job types yet.",
        );
      })
      .catch(() => {
        setXmlJobs([]);
        setXmlFeedNote(null);
        setXmlError("Live jobs could not be loaded. Refresh the page and try again.");
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const pairs = campaigns
      .map((row) => ({
        programId: row.program.id,
        listingId: campaignListingId(row.program),
      }))
      .filter((p) => p.listingId > 0);
    if (pairs.length === 0) {
      setTrackUrls({});
      return;
    }
    Promise.all(
      pairs.map(async ({ programId, listingId }) => {
        try {
          const res = await fetchTrackLink(listingId);
          return [programId, res.tracked_url] as const;
        } catch {
          return null;
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      const next: Record<number, string> = {};
      for (const item of results) {
        if (item) next[item[0]] = item[1];
      }
      setTrackUrls(next);
    });
    return () => {
      cancelled = true;
    };
  }, [campaigns]);

  const q = search.trim().toLowerCase();

  const filteredCampaigns = useMemo(() => {
    const list = campaigns.filter((row) => {
      if (!campaignMatchesTab(row, tab)) return false;
      if (!q) return true;
      const hay = `${row.program.title} ${row.program.promotion_type ?? ""} ${row.program.pricing_model}`.toLowerCase();
      return hay.includes(q);
    });
    return [...list].sort((a, b) => campaignSortTs(b) - campaignSortTs(a));
  }, [campaigns, tab, q]);

  const filteredXml = useMemo(() => {
    const list = xmlJobs.filter((job) => {
      if (!xmlMatchesTab(job, tab)) return false;
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
    return [...list].sort((a, b) => xmlSortTs(b) - xmlSortTs(a));
  }, [xmlJobs, tab, jobType, q]);

  const showCampaigns =
    tab === "all" ||
    tab === "ppc" ||
    tab === "ppr" ||
    tab === "ppa" ||
    tab === "ppe" ||
    tab === "course" ||
    tab === "tools" ||
    tab === "hiring";
  const showXml =
    tab === "all" || tab === "hiring" || tab === "course" || tab === "tools";
  const showListings =
    tab === "all" ||
    tab === "hiring" ||
    tab === "course" ||
    tab === "tools" ||
    tab === "ppc" ||
    tab === "ppr" ||
    tab === "ppa";

  type FeedItem =
    | { kind: "campaign"; row: CreatorCampaignRow; sortAt: number }
    | { kind: "xml"; job: SyndicatedJob; sortAt: number };

  const mergedFeed = useMemo(() => {
    const items: FeedItem[] = [];
    if (showCampaigns) {
      for (const row of filteredCampaigns) {
        items.push({ kind: "campaign", row, sortAt: campaignSortTs(row) });
      }
    }
    if (showXml) {
      for (const job of filteredXml) {
        items.push({ kind: "xml", job, sortAt: xmlSortTs(job) });
      }
    }
    items.sort((a, b) => b.sortAt - a.sortAt);
    return items;
  }, [filteredCampaigns, filteredXml, showCampaigns, showXml]);

  const filteredRows = useMemo(() => {
    return rows.filter(({ listing }) => {
      if (!listingMatchesTab(listing, tab)) return false;
      if (q) {
        const hay = `${listing.title} ${listing.company_name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, tab, q]);

  const ensureJoined = (programId: number, alreadyJoined: boolean) => {
    if (alreadyJoined) return;
    void optInCampaign(programId)
      .then(() => load())
      .catch(() => undefined);
  };

  const trackedRefs = useRef(new Set<string>());

  const trackXml = (job: SyndicatedJob) => {
    if (trackedRefs.current.has(job.reference_id)) return;
    trackedRefs.current.add(job.reference_id);
    void recordJobActivity({
      reference_id: job.reference_id,
      action: "view",
      title: job.title,
      company: job.company,
      category: mapOpportunityCategory(job.category, job.jobtype, job.title),
      source: "creator_campaigns",
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
    try {
      await patchCreatorListing(listingId, { [field]: value });
      toast.success(
        field === "is_pinned"
          ? value
            ? "Listing pinned to your page."
            : "Listing unpinned."
          : value
            ? "Listing hidden from your page."
            : "Listing is visible again.",
      );
      load();
    } catch {
      toast.error("Could not update the listing. Please try again.");
    }
  };

  return (
    <>
      <PageHeader title="Campaigns" />
      <div className="mb-8">
        <p className="mt-2 max-w-2xl text-slate-500">
          Browse PPC, PPR, courses, jobs, and tools that match you. Share tracked
          links so clicks count on your account.
        </p>
        {publicCode ? (
          <p className="mt-3 inline-flex rounded-full bg-purple-50 px-3 py-1 text-sm font-semibold text-purple-800">
            Your id: {publicCode}
          </p>
        ) : null}
        {xmlFeedNote ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {xmlFeedNote}
          </p>
        ) : null}
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {TABS.map((item) => {
            const active = tab === item.id;
            const count =
              item.id === "all"
                ? campaigns.length + xmlJobs.length + rows.length
                : filteredCountPreview(campaigns, xmlJobs, rows, item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  active
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-purple-200"
                }`}
              >
                {item.label}
                <span className={`ml-1 ${active ? "text-white/80" : "text-slate-400"}`}>
                  {count}
                </span>
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
              placeholder="Title, company, campaign…"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#172b63] outline-none placeholder:text-slate-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10"
            />
          </label>
        </div>
      </div>

      {showCampaigns || showXml ? (
        <div className="mb-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-lg font-bold">{sectionTitle(tab)}</h2>
            <p className="text-xs font-semibold text-slate-400">
              {mergedFeed.length} shown
            </p>
          </div>

          {mergedFeed.length > 0 ? (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {mergedFeed.map((item) => {
                if (item.kind === "campaign") {
                  const row = item.row;
                  const p = row.program;
                  const model = String(p.pricing_model ?? "ppc").toLowerCase();
                  const promo = String(p.promotion_type ?? "job");
                  const url = trackUrls[p.id] ?? "";
                  return (
                    <li key={`camp-${p.id}`} className="h-full">
                      <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-700">
                            {model}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                            {promo}
                          </span>
                        </div>
                        <h3 className="mt-3 line-clamp-2 font-bold text-[#172b63]">
                          {p.title}
                        </h3>
                        <p className="mt-2 text-sm font-semibold text-purple-600">
                          {formatMoney(
                            (() => {
                              const fromProgram = Number(p.rate_usd ?? 0);
                              if (fromProgram > 0) return fromProgram;
                              const listing = p.listing as
                                | {
                                    ppc_rate_usd?: string | number | null;
                                    ppr_rate_usd?: string | number | null;
                                    ppa_rate_usd?: string | number | null;
                                  }
                                | undefined;
                              if (!listing) return fromProgram;
                              if (model === "ppr")
                                return Number(listing.ppr_rate_usd ?? 0);
                              if (model === "ppa")
                                return Number(listing.ppa_rate_usd ?? 0);
                              return Number(
                                listing.ppc_rate_usd ??
                                  listing.ppr_rate_usd ??
                                  listing.ppa_rate_usd ??
                                  0,
                              );
                            })(),
                          )}{" "}
                          / {rateLabel(model)}
                          <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            offer rate
                          </span>
                        </p>
                        <div className="mt-auto flex flex-wrap gap-2 pt-4">
                          <Link
                            href="/creator/campaigns"
                            className="inline-flex h-8 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-xs font-bold leading-none text-[#172b63]"
                          >
                            View more
                          </Link>
                          {url ? (
                            <ShareLinkButton
                              url={url}
                              title={p.title}
                              onShare={() => ensureJoined(p.id, row.joined)}
                              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-bold leading-none text-[#172b63]"
                            />
                          ) : null}
                          <button
                            type="button"
                            disabled={!url}
                            onClick={() => {
                              ensureJoined(p.id, row.joined);
                              void navigator.clipboard.writeText(url);
                              setCopiedCampaign(p.id);
                              setTimeout(() => setCopiedCampaign(null), 2000);
                            }}
                            className="inline-flex items-center gap-1 rounded-full bg-[#172b63] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                          >
                            {copiedCampaign === p.id ? (
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
                }

                const job = item.job;
                const shareUrl = publicCode
                  ? shareJobUrl(publicCode, job.reference_id)
                  : "";
                const cat = mapOpportunityCategory(
                  job.category,
                  job.jobtype,
                  job.title,
                  job.description_text,
                );
                const xmlRate = Number(job.ppc_rate_usd ?? DEFAULT_PPC_RATE);
                return (
                  <li key={job.reference_id} className="h-full">
                    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-700">
                          {cat === "course"
                            ? "Course"
                            : cat === "tools"
                              ? "Tools"
                              : "Job"}
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
                      <p className="mt-2 text-sm font-semibold text-purple-600">
                        {formatMoney(xmlRate)} / click
                      </p>
                      <p className="mt-1 text-xs font-semibold text-emerald-600">
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
                          className="inline-flex h-8 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-xs font-bold leading-none text-[#172b63]"
                        >
                          View more
                        </Link>
                        {shareUrl ? (
                          <ShareLinkButton
                            url={shareUrl}
                            title={job.title}
                            onShare={() => trackXml(job)}
                            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-bold leading-none text-[#172b63]"
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
          ) : xmlError &&
            showXml &&
            filteredCampaigns.length === 0 &&
            (tab === "all" || tab === "hiring") ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {xmlError}{" "}
              <Link href="/creator/campaigns" className="font-semibold underline">
                Update campaigns & preferences
              </Link>
            </p>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
              No campaigns match these filters.{" "}
              <Link
                href="/creator/campaigns"
                className="font-semibold text-purple-600 underline"
              >
                View all campaigns
              </Link>
            </p>
          )}
        </div>
      ) : null}

      {showListings ? (
        <>
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
                      {Number(listing.ppc_rate_usd ?? 0) > 0 ? (
                        <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                          PPC
                        </span>
                      ) : null}
                      {Number(listing.ppr_rate_usd ?? 0) > 0 ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          PPR
                        </span>
                      ) : null}
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
                      ${Number(listing.ppc_rate_usd ?? listing.ppr_rate_usd ?? listing.ppa_rate_usd ?? DEFAULT_PPC_RATE).toFixed(2)}{" "}
                      /{" "}
                      {Number(listing.ppr_rate_usd ?? 0) > 0
                        ? "signup"
                        : Number(listing.ppa_rate_usd ?? 0) > 0
                          ? "application"
                          : "click"}
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
      ) : null}
    </>
  );
}

function filteredCountPreview(
  campaigns: CreatorCampaignRow[],
  xmlJobs: SyndicatedJob[],
  rows: CreatorListingRow[],
  tab: TabId,
): number {
  const c = campaigns.filter((row) => campaignMatchesTab(row, tab)).length;
  const x = xmlJobs.filter((job) => xmlMatchesTab(job, tab)).length;
  const r = rows.filter(({ listing }) => listingMatchesTab(listing, tab)).length;
  return c + x + r;
}

function uniqueSyndicatedJobs(jobs: SyndicatedJob[]): SyndicatedJob[] {
  const seenRef = new Set<string>();
  const seenFinger = new Set<string>();
  const out: SyndicatedJob[] = [];
  for (const job of jobs) {
    const ref = String(job.reference_id ?? "").toLowerCase().trim();
    const raw = ref.includes(":") ? ref.slice(ref.lastIndexOf(":") + 1) : ref;
    if (ref && (seenRef.has(ref) || (raw && seenRef.has(raw)))) continue;
    const finger = `${job.title ?? ""}|${job.company ?? ""}|${job.location_label || job.location || ""}`
      .toLowerCase()
      .trim();
    if (finger !== "||" && seenFinger.has(finger)) continue;
    if (ref) {
      seenRef.add(ref);
      if (raw) seenRef.add(raw);
    }
    if (finger !== "||") seenFinger.add(finger);
    out.push(job);
  }
  return out;
}
