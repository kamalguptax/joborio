"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { ApiClientError } from "@/lib/api/client";
import {
  fetchNetworkOpportunities,
  type NetworkOpportunityCampaign,
} from "@/lib/api/network";
import type { SyndicatedJob } from "@/lib/api/syndication";
import { fetchPublicXmlJobs } from "@/lib/syndication/publicXmlFeed";
import { shareDestinationUrl, shareJobUrl } from "@/lib/tracking/subid";
import { companyName } from "@/lib/jobs/companyName";
import ShareLinkButton from "@/components/share/ShareLinkButton";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { syndicatedJobPath } from "@/lib/staticExport";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";

type TabId = "all" | "ppc" | "jobs";

function refKeys(referenceId: string): string[] {
  const keys = [referenceId];
  const colon = referenceId.lastIndexOf(":");
  if (colon >= 0) {
    const raw = referenceId.slice(colon + 1);
    if (raw && raw !== referenceId) keys.push(raw);
  }
  return keys;
}

function matchesRef(job: SyndicatedJob, allowed: Set<string>): boolean {
  return refKeys(job.reference_id).some((k) => allowed.has(k));
}

export default function NetworkOpportunitiesPage() {
  const [campaigns, setCampaigns] = useState<NetworkOpportunityCampaign[]>([]);
  const [xmlJobs, setXmlJobs] = useState<SyndicatedJob[]>([]);
  const [publicCode, setPublicCode] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [xmlError, setXmlError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchNetworkOpportunities()
      .then(async (data) => {
        if (cancelled) return;
        setCampaigns(data.campaigns ?? []);
        setPublicCode(data.member.public_code || "");
        const allowed = new Set(
          (data.xml_job_refs ?? []).flatMap((r) => refKeys(String(r))),
        );
        if (allowed.size === 0) {
          setXmlJobs([]);
          setXmlError(
            data.campaigns?.length
              ? null
              : "No XML jobs assigned to your communities yet.",
          );
          return;
        }
        try {
          const res = await fetchPublicXmlJobs({ per_page: 100, page: 1 });
          if (cancelled) return;
          const matched = (res.jobs ?? []).filter((j) => matchesRef(j, allowed));
          setXmlJobs(matched);
          setXmlError(
            matched.length
              ? null
              : "Assigned XML jobs are not in the live feed right now.",
          );
        } catch {
          if (!cancelled) {
            setXmlJobs([]);
            setXmlError("Live jobs could not be loaded. Refresh and try again.");
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiClientError
              ? err.message
              : "Could not load opportunities.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCampaigns = useMemo(() => {
    if (tab === "jobs") return [];
    if (tab === "ppc") {
      return campaigns.filter((c) => {
        const model = String(c.pricing_model ?? "").toLowerCase();
        return model === "ppc" || model === "" || !model;
      });
    }
    return campaigns;
  }, [campaigns, tab]);

  const filteredJobs = useMemo(() => {
    if (tab === "ppc") return [];
    return xmlJobs;
  }, [xmlJobs, tab]);

  const copy = async (key: string, url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {error}
      </p>
    );
  }

  return (
    <>
      <PageHeader title="Opportunities" />
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          Share & earn activity
        </p>
        <p className="mt-2 max-w-2xl text-slate-500">
          PPC campaigns and jobs assigned by your publisher. Share tracked links
          — clicks count toward your member activity and show on the publisher
          track.
        </p>
        {publicCode ? (
          <p className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-800">
            Your share reference: <span className="font-mono">{publicCode}</span>
            <span className="font-normal text-violet-600">
              — every link includes ?code={publicCode}&amp;subid={publicCode}
            </span>
          </p>
        ) : null}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["ppc", "PPC"],
            ["jobs", "Jobs"],
          ] as const
        ).map(([id, label]) => {
          const active = tab === id;
          const count =
            id === "all"
              ? campaigns.length + xmlJobs.length
              : id === "ppc"
                ? campaigns.length
                : xmlJobs.length;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                active
                  ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600"
              }`}
            >
              {label}
              <span className={`ml-1 ${active ? "text-white/80" : "text-slate-400"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {xmlError && tab !== "ppc" ? (
        <p className="mb-4 text-sm text-slate-500">{xmlError}</p>
      ) : null}

      {filteredCampaigns.length === 0 && filteredJobs.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          No opportunities yet. Ask your publisher to assign PPC campaigns or
          XML jobs to your community.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredCampaigns.map((c) => {
            const memberRef = (c.share_code || publicCode || "").trim();
            const shareUrl =
              c.can_share && c.destination_url && memberRef
                ? shareDestinationUrl(memberRef, c.destination_url, {
                    title: c.title,
                    referenceId: c.reference_id,
                  })
                : "";
            const key = `c-${c.assignment_id}`;
            return (
              <li key={key}>
                <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-700">
                      {c.pricing_model || "ppc"}
                    </span>
                    {c.promotion_type ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                        {c.promotion_type}
                      </span>
                    ) : null}
                    {memberRef ? (
                      <span className="rounded-full bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                        ref {memberRef}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 line-clamp-2 font-bold text-[#172b63]">
                    {c.title}
                  </h3>
                  {(c.company || c.location) && (
                    <p className="mt-1 text-sm text-slate-500">
                      {c.company || "Campaign"}
                      {c.location ? ` · ${c.location}` : ""}
                    </p>
                  )}
                  {shareUrl ? (
                    <p className="mt-2 break-all font-mono text-[10px] text-slate-400">
                      {shareUrl}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">
                      Rates stay with your publisher — share to earn activity
                      credit.
                    </p>
                  )}
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    {shareUrl ? (
                      <>
                        <ShareLinkButton
                          url={shareUrl}
                          title={c.title}
                          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-bold leading-none text-[#172b63]"
                        />
                        <button
                          type="button"
                          onClick={() => void copy(key, shareUrl)}
                          className="inline-flex items-center gap-1 rounded-full bg-[#172b63] px-3 py-1.5 text-xs font-bold text-white"
                        >
                          {copiedKey === key ? (
                            <>
                              <Check size={14} /> Copied
                            </>
                          ) : (
                            <>
                              <Copy size={14} /> Copy link
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-amber-700">
                        Share link unavailable (no destination URL).
                      </span>
                    )}
                  </div>
                </article>
              </li>
            );
          })}

          {filteredJobs.map((job) => {
            const memberRef = publicCode.trim();
            const shareUrl = memberRef
              ? shareJobUrl(memberRef, job.reference_id)
              : "";
            const key = `j-${job.reference_id}`;
            return (
              <li key={key}>
                <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                      Job
                    </span>
                    {job.jobtype ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {job.jobtype}
                      </span>
                    ) : null}
                    {memberRef ? (
                      <span className="rounded-full bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                        ref {memberRef}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 line-clamp-2 font-bold text-[#172b63]">
                    {job.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {companyName(job.company, "Company")} ·{" "}
                    {job.location_label || job.location || "Remote"}
                  </p>
                  {shareUrl ? (
                    <p className="mt-2 break-all font-mono text-[10px] text-slate-400">
                      {shareUrl}
                    </p>
                  ) : null}
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    <Link
                      href={syndicatedJobPath(job.reference_id)}
                      className="inline-flex h-8 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-xs font-bold leading-none text-[#172b63]"
                    >
                      View
                    </Link>
                    {shareUrl ? (
                      <>
                        <ShareLinkButton
                          url={shareUrl}
                          title={job.title}
                          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-bold leading-none text-[#172b63]"
                        />
                        <button
                          type="button"
                          onClick={() => void copy(key, shareUrl)}
                          className="inline-flex items-center gap-1 rounded-full bg-[#172b63] px-3 py-1.5 text-xs font-bold text-white"
                        >
                          {copiedKey === key ? (
                            <>
                              <Check size={14} /> Copied
                            </>
                          ) : (
                            <>
                              <Copy size={14} /> Copy link
                            </>
                          )}
                        </button>
                      </>
                    ) : null}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
