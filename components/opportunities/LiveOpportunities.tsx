"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ViewJobLink from "@/components/jobs/ViewJobLink";
import {
  CATEGORY_BADGE,
  fetchHomeOpportunities,
  type HomeOpportunityCard,
} from "@/lib/home/opportunityCards";
import SectionHeading from "@/components/layout/SectionHeading";

function JobCard({ job }: { job: HomeOpportunityCard }) {
  const badge = CATEGORY_BADGE[job.category] ?? CATEGORY_BADGE.hiring;
  return (
    <article className="opportunity-card flex h-full flex-col rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-sm font-semibold text-slate-500">{job.company}</p>
        <span
          className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>
      <h2 className="mt-2 line-clamp-2 text-lg font-bold text-[#0F1536]">{job.title}</h2>
      <p className="mt-2 text-xs font-semibold text-emerald-600">{job.endsIn}</p>
      <p className="mt-1 text-sm text-slate-500">
        {job.location} · {job.type}
      </p>
      <div className="mt-3 flex min-h-[1.75rem] flex-wrap gap-2">
        {job.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
          {job.match}% match
        </span>
        <ViewJobLink href={job.href} className="text-sm font-semibold text-indigo-700 hover:underline">
          View job
        </ViewJobLink>
      </div>
    </article>
  );
}

export default function LiveOpportunities() {
  const [jobs, setJobs] = useState<HomeOpportunityCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHomeOpportunities(24)
      .then((rows) => {
        setJobs(rows);
        setError(null);
      })
      .catch(() => {
        setJobs([]);
        setError("Live jobs could not be loaded. Refresh the page and try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section-pad bg-[#F7F8FC] px-5 sm:px-8">
      <div className="mx-auto max-w-[1600px]">
        <SectionHeading
          as="h1"
          variant="hero"
          eyebrow="Opportunities"
          title="Jobs worth sharing"
          description="Live openings from the JobOrio feed. Open a job to see details."
        />

        {loading ? (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-52 animate-pulse rounded-3xl border border-indigo-100 bg-white/80"
                aria-hidden
              />
            ))}
            <p className="col-span-full py-2 text-center text-sm text-slate-500 sm:text-base">
              Loading live jobs…
            </p>
          </div>
        ) : error ? (
          <p className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 sm:px-6">
            {error}
          </p>
        ) : jobs.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-indigo-200 bg-white px-4 py-12 text-center text-sm text-slate-500 sm:text-base">
            No jobs loaded yet.{" "}
            <Link href="/jobs" className="font-semibold text-violet-600 hover:underline">
              Try the job board
            </Link>
          </p>
        ) : (
          <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {jobs.map((job) => (
              <li key={job.id} className="h-full min-w-0">
                <JobCard job={job} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
