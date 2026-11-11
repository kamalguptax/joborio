"use client";

import ViewJobLink from "@/components/jobs/ViewJobLink";
import type { Listing } from "@/lib/api/types";
import { listingJobPath } from "@/lib/staticExport";

export default function PreferredJobsList({
  jobs,
  emptyHint,
}: {
  jobs: Listing[];
  emptyHint: string;
}) {
  if (jobs.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
        {emptyHint}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {jobs.map((job) => (
        <li
          key={job.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3"
        >
          <div>
            <p className="font-semibold">{job.title}</p>
            <p className="text-xs text-slate-500">
              {job.company_name ?? "Company"} ·{" "}
              {job.location_label ??
                (job.is_remote ? "Remote" : job.country_code ?? "—")}
            </p>
          </div>
          <ViewJobLink
            href={listingJobPath(job.id)}
            className="text-sm font-semibold text-purple-600"
          >
            View
          </ViewJobLink>
        </li>
      ))}
    </ul>
  );
}
