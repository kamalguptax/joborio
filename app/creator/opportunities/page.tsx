"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import { postedAgo } from "@/lib/home/opportunityCards";
import { companyName } from "@/lib/jobs/companyName";
import ShareLinkButton from "@/components/share/ShareLinkButton";
import { syndicatedJobPath } from "@/lib/staticExport";

export default function CreatorOpportunitiesPage() {
  const [rows, setRows] = useState<CreatorListingRow[]>([]);
  const [xmlJobs, setXmlJobs] = useState<SyndicatedJob[]>([]);
  const [publicCode, setPublicCode] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedXml, setCopiedXml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [xmlError, setXmlError] = useState<string | null>(null);

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
    fetchPublicXmlJobs({ per_page: 24, page: 1, auth: true, for_creator: true })
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

      <div className="mb-10 space-y-4">
        <h2 className="text-lg font-bold">Jobs for you</h2>
        {xmlJobs.map((job) => {
          const shareUrl = publicCode ? shareJobUrl(publicCode, job.reference_id) : "";
          return (
            <article
              key={job.reference_id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h3 className="font-bold">{job.title}</h3>
                <p className="mt-1 text-xs font-semibold text-emerald-600">
                  {postedAgo(job.publishdate)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {companyName(job.company, "Company")} · {job.location_label || job.location || "Remote"}
                </p>
                {shareUrl ? (
                  <p className="mt-2 break-all text-xs text-slate-400">{shareUrl}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={syndicatedJobPath(job.reference_id)}
                  onClick={() => trackXml(job)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
                >
                  View job
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
                  className="inline-flex items-center gap-2 rounded-full bg-[#172b63] px-4 py-2 text-sm font-bold text-white"
                >
                  {copiedXml === job.reference_id ? (
                    <>
                      <Check size={16} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={16} /> Copy link
                    </>
                  )}
                </button>
              </div>
            </article>
          );
        })}
        {xmlError ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {xmlError}{" "}
            <Link href="/creator/job-preferences" className="font-semibold underline">
              Update job preferences
            </Link>
          </p>
        ) : null}
      </div>

      <h2 className="mb-4 text-lg font-bold">Your page listings</h2>

      {error ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </p>
      ) : null}

      <div className="space-y-4">
        {rows.map(({ listing, tracked_url, is_pinned, is_hidden }) => (
          <article
            key={listing.id}
            className={`flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between ${
              is_hidden ? "border-slate-100 opacity-60" : "border-slate-200"
            }`}
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
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
              </div>
              <h2 className="mt-1 font-bold">{listing.title}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {listing.company_name} ·{" "}
                {listing.location_label ??
                  (listing.is_remote ? "Remote" : listing.country_code)}
              </p>
              <p className="mt-2 text-sm font-semibold text-purple-600">
                ${Number(listing.ppc_rate_usd ?? 0.03).toFixed(2)} / click
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggle(listing.id, "is_pinned", !is_pinned)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold"
              >
                <Pin size={14} />
                {is_pinned ? "Unpin" : "Pin"}
              </button>
              <button
                type="button"
                onClick={() => toggle(listing.id, "is_hidden", !is_hidden)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold"
              >
                <EyeOff size={14} />
                {is_hidden ? "Show" : "Hide"}
              </button>
              <ShareLinkButton url={tracked_url} title={listing.title} />
              <button
                type="button"
                onClick={() => copy(tracked_url, listing.id)}
                className="inline-flex items-center gap-2 rounded-full bg-[#172b63] px-4 py-2 text-sm font-bold text-white"
              >
                {copiedId === listing.id ? (
                  <>
                    <Check size={16} /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={16} /> Copy link
                  </>
                )}
              </button>
            </div>
          </article>
        ))}
        {rows.length === 0 && !error ? (
          <p className="text-sm text-slate-500">No listings on your page yet.</p>
        ) : null}
      </div>
    </>
  );
}
