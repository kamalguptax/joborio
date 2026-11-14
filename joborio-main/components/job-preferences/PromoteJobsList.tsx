"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import ShareLinkButton from "@/components/share/ShareLinkButton";
import ViewJobLink from "@/components/jobs/ViewJobLink";
import { fetchMe } from "@/lib/api/auth";
import type { SyndicatedJob } from "@/lib/api/syndication";
import { rememberPublicCode } from "@/lib/auth/session";
import { postedAgo } from "@/lib/home/opportunityCards";
import { companyName } from "@/lib/jobs/companyName";
import { jobMatchesPromoteTypes } from "@/lib/jobs/promoteTypes";
import { fetchPublicXmlJobs } from "@/lib/syndication/publicXmlFeed";
import { syndicatedJobPath } from "@/lib/staticExport";
import { shareJobUrl } from "@/lib/tracking/subid";

export default function PromoteJobsList({ types }: { types: string[] }) {
  const [jobs, setJobs] = useState<SyndicatedJob[]>([]);
  const [publicCode, setPublicCode] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPublicXmlJobs({
      per_page: 100,
      page: 1,
      auth: true,
      for_creator: true,
      promote_types: types.join(","),
    })
      .then((res) => {
        if (cancelled) return;
        const matched = res.jobs.filter((job) =>
          jobMatchesPromoteTypes(
            [job.title, job.jobtype, job.location, job.location_label, job.description_text]
              .filter(Boolean)
              .join(" "),
            types,
          ),
        );
        setJobs(matched.slice(0, 12));
      })
      .catch(() => {
        if (!cancelled) setJobs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [types]);

  useEffect(() => {
    fetchMe()
      .then((user) => setPublicCode(rememberPublicCode(user)))
      .catch(() => setPublicCode(null));
  }, []);

  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold">Jobs to promote</h2>
      <p className="mt-1 text-sm text-slate-500">
        Live jobs for the types you selected, shown under your preferences.
      </p>
      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Loading jobs…</p>
      ) : jobs.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          No live jobs match those types right now. Try another type.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {jobs.map((job) => {
            const shareUrl = publicCode ? shareJobUrl(publicCode, job.reference_id) : "";
            return (
              <li
                key={job.reference_id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">{job.title}</p>
                  <p className="mt-1 text-xs font-semibold text-emerald-600">
                    {postedAgo(job.publishdate)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {companyName(job.company, "Company")} · {job.location_label || job.location || "Remote"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ViewJobLink
                    href={syndicatedJobPath(job.reference_id)}
                    className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    View
                  </ViewJobLink>
                  {shareUrl ? <ShareLinkButton url={shareUrl} title={job.title} /> : null}
                  {shareUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(shareUrl);
                        setCopied(job.reference_id);
                        setTimeout(() => setCopied(null), 2000);
                      }}
                      className="inline-flex items-center gap-1 rounded-full bg-[#172b63] px-3 py-2 text-xs font-bold text-white"
                    >
                      {copied === job.reference_id ? <Check size={14} /> : <Copy size={14} />}
                      {copied === job.reference_id ? "Copied" : "Copy link"}
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
