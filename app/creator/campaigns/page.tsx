"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import ShareLinkButton from "@/components/share/ShareLinkButton";
import { fetchMe } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import {
  fetchCreatorCampaigns,
  fetchTrackLink,
  submitPostPromote,
  recordJobActivity,
  type CreatorCampaignRow,
} from "@/lib/api/creator";
import type { SyndicatedJob } from "@/lib/api/syndication";
import { rememberPublicCode } from "@/lib/auth/session";
import { companyName } from "@/lib/jobs/companyName";
import {
  mapOpportunityCategory,
  postedAgo,
} from "@/lib/home/opportunityCards";
import { formatMoney } from "@/lib/money";
import { syndicatedJobPath } from "@/lib/staticExport";
import { fetchPublicXmlJobs } from "@/lib/syndication/publicXmlFeed";
import { shareJobUrl } from "@/lib/tracking/subid";

type TabId = "all" | "ppc" | "ppr" | "course" | "ppa" | "ppe" | "branding";
type ActionId = "like" | "comment" | "repost";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "all", label: "All" },
  { id: "ppc", label: "PPC" },
  { id: "ppr", label: "PPR" },
  { id: "course", label: "Courses" },
  { id: "ppa", label: "PPA" },
  { id: "ppe", label: "PPE" },
  { id: "branding", label: "Branding" },
];

function campaignTabs(row: CreatorCampaignRow): TabId[] {
  const p = row.program;
  const pricing = String(p.pricing_model ?? "").toLowerCase();
  const promo = String(p.promotion_type ?? "").toLowerCase();
  const tabs: TabId[] = ["all"];
  if (pricing === "ppc" || pricing === "ppr" || pricing === "ppa" || pricing === "ppe") {
    tabs.push(pricing);
  }
  if (promo === "course") tabs.push("course");
  if (promo === "branding") tabs.push("branding");
  if (promo === "post_promote") tabs.push("ppe");
  return [...new Set(tabs)];
}

function rateLabel(model: string) {
  if (model === "ppc") return "click";
  if (model === "ppr") return "registration";
  if (model === "ppe") return "engagement";
  return "application";
}

function campaignListingId(program: CreatorCampaignRow["program"]): number {
  const nested = Number(program.listing?.id ?? 0);
  if (nested > 0) return nested;
  return Number((program as { listing_id?: number }).listing_id ?? 0);
}

export default function CreatorCampaignsPage() {
  const [rows, setRows] = useState<CreatorCampaignRow[]>([]);
  const [tab, setTab] = useState<TabId>("all");
  const [error, setError] = useState<string | null>(null);
  const [submitFor, setSubmitFor] = useState<number | null>(null);
  const [actionsDone, setActionsDone] = useState<ActionId[]>([]);
  const [proofUrl, setProofUrl] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [xmlJobs, setXmlJobs] = useState<SyndicatedJob[]>([]);
  const [xmlError, setXmlError] = useState<string | null>(null);
  const [publicCode, setPublicCode] = useState<string | null>(null);
  const [copiedXml, setCopiedXml] = useState<string | null>(null);
  const [trackUrls, setTrackUrls] = useState<Record<number, string>>({});
  const [copiedCampaign, setCopiedCampaign] = useState<number | null>(null);

  const loadCampaigns = () => {
    fetchCreatorCampaigns()
      .then(setRows)
      .catch(() => setError("Sign in as a creator with completed onboarding."));
  };

  useEffect(() => {
    loadCampaigns();
    fetchMe()
      .then((user) => setPublicCode(rememberPublicCode(user)))
      .catch(() => setPublicCode(null));
    fetchPublicXmlJobs({ per_page: 36, page: 1, auth: true, for_creator: true })
      .then((res) => {
        setXmlJobs(res.jobs);
        setXmlError(
          res.jobs.length ? null : "No XML jobs match your preferences yet.",
        );
      })
      .catch(() => {
        setXmlJobs([]);
        setXmlError("Live jobs could not be loaded.");
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const pairs = rows
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
  }, [rows]);

  const filtered = useMemo(
    () => rows.filter((row) => campaignTabs(row).includes(tab)),
    [rows, tab],
  );

  const openSubmit = (row: CreatorCampaignRow) => {
    const required = (row.program.engagement_actions ?? [
      "like",
      "comment",
      "repost",
    ]) as ActionId[];
    setSubmitFor(row.program.id);
    setActionsDone(required);
    setProofUrl("");
    setProofNote("");
    setSubmitMsg(null);
    setSubmitError(null);
  };

  const sendProof = async (programId: number) => {
    setSubmitError(null);
    setSubmitMsg(null);
    if (actionsDone.length === 0) {
      setSubmitError("Select the actions you completed.");
      return;
    }
    try {
      await submitPostPromote(programId, {
        actions_done: actionsDone,
        proof_url: proofUrl.trim() || undefined,
        proof_note: proofNote.trim() || undefined,
      });
      setSubmitMsg("Proof submitted. Waiting for employer review.");
      setSubmitFor(null);
    } catch (err) {
      setSubmitError(
        err instanceof ApiClientError
          ? err.message
          : "Could not submit engagement proof.",
      );
    }
  };

  const trackXml = (job: SyndicatedJob) => {
    void recordJobActivity({
      reference_id: job.reference_id,
      action: "view",
      title: job.title,
      company: job.company,
    }).catch(() => undefined);
  };

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
          Campaigns & matching
        </p>
        <h1 className="mt-1 text-3xl font-bold">Campaigns</h1>
        <p className="mt-2 max-w-2xl text-slate-500">
          Browse all campaign types with category filters. Set job preferences to
          improve matching. Live XML jobs appear below.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((item) => {
            const count =
              item.id === "all"
                ? rows.length
                : rows.filter((row) => campaignTabs(row).includes(item.id)).length;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  active
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-purple-200"
                }`}
              >
                {item.label}
                <span className={`ml-1.5 ${active ? "text-white/80" : "text-slate-400"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <Link
          href="/creator/job-preferences"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Job preferences (Settings)
        </Link>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </p>
      ) : null}
      {submitMsg ? (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {submitMsg}
        </p>
      ) : null}

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-bold">Live campaigns</h2>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <p className="font-semibold text-slate-800">No campaigns in this category</p>
            <p className="mt-2 text-sm text-slate-500">
              Try another tab, or update job preferences to match more programs.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((row) => {
              const p = row.program;
              const model = String(p.pricing_model).toUpperCase();
              const isPostPromote =
                p.pricing_model === "ppe" || p.promotion_type === "post_promote";
              const required = (p.engagement_actions ?? [
                "like",
                "comment",
                "repost",
              ]) as ActionId[];
              const shareUrl = trackUrls[p.id] ?? "";
              return (
                <li key={p.id} className="h-full">
                  <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="line-clamp-2 font-bold text-[#172b63]">
                      {p.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {model} {formatMoney(Number(p.rate_usd), "USD")} /{" "}
                      {rateLabel(String(p.pricing_model))}
                    </p>
                    {isPostPromote && p.post_url ? (
                      <a
                        href={String(p.post_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 text-sm font-semibold text-purple-700 underline"
                      >
                        Open post to engage
                      </a>
                    ) : null}
                    <div className="mt-auto flex flex-wrap gap-2 pt-4">
                      <Link
                        href={`/creator/campaigns#campaign-${p.id}`}
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
                      >
                        View more
                      </Link>
                      {shareUrl ? (
                        <ShareLinkButton url={shareUrl} title={p.title} />
                      ) : null}
                      <button
                        type="button"
                        disabled={!shareUrl}
                        onClick={() => {
                          void navigator.clipboard.writeText(shareUrl);
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
                      {isPostPromote && row.joined ? (
                        <button
                          type="button"
                          onClick={() => openSubmit(row)}
                          className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-800"
                        >
                          Submit proof
                        </button>
                      ) : null}
                    </div>

                    {submitFor === p.id ? (
                      <div className="mt-4 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-slate-800">
                          Confirm actions: {required.join(", ")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {required.map((id) => (
                            <label
                              key={id}
                              className="flex items-center gap-1.5 text-xs font-medium capitalize"
                            >
                              <input
                                type="checkbox"
                                checked={actionsDone.includes(id)}
                                onChange={() =>
                                  setActionsDone((prev) =>
                                    prev.includes(id)
                                      ? prev.filter((a) => a !== id)
                                      : [...prev, id],
                                  )
                                }
                              />
                              {id}
                            </label>
                          ))}
                        </div>
                        <input
                          type="url"
                          value={proofUrl}
                          onChange={(e) => setProofUrl(e.target.value)}
                          placeholder="Proof URL (optional)"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                        />
                        {submitError ? (
                          <p className="text-xs text-red-600">{submitError}</p>
                        ) : null}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => sendProof(p.id)}
                            className="rounded-full bg-[#172b63] px-3 py-1.5 text-xs font-bold text-white"
                          >
                            Submit
                          </button>
                          <button
                            type="button"
                            onClick={() => setSubmitFor(null)}
                            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">XML jobs for you</h2>
            <p className="mt-1 text-xs text-slate-500">
              Live feed jobs matched to your preferences — shown below campaigns.
            </p>
          </div>
          <p className="text-xs font-semibold text-slate-400">{xmlJobs.length} jobs</p>
        </div>

        {xmlJobs.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {xmlJobs.map((job) => {
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
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            {xmlError ?? "No XML jobs yet."}{" "}
            <Link
              href="/creator/job-preferences"
              className="font-semibold text-purple-600 underline"
            >
              Update preferences
            </Link>
          </p>
        )}
      </section>
    </>
  );
}
