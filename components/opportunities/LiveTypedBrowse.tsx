"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ViewJobLink from "@/components/jobs/ViewJobLink";
import SectionHeading from "@/components/layout/SectionHeading";
import {
  CATEGORY_BADGE,
  fetchTypedOpportunities,
  type HomeOpportunityCard,
  type OpportunityCategory,
} from "@/lib/home/opportunityCards";

function OfferCard({
  job,
  ctaLabel,
}: {
  job: HomeOpportunityCard;
  ctaLabel: string;
}) {
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
          {ctaLabel}
        </ViewJobLink>
      </div>
    </article>
  );
}

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  emptyHint: string;
  ctaLabel?: string;
  listingTypes?: string[];
  category?: OpportunityCategory;
  includeXmlCategoryMatches?: boolean;
};

export default function LiveTypedBrowse({
  eyebrow,
  title,
  description,
  emptyHint,
  ctaLabel = "View details",
  listingTypes,
  category,
  includeXmlCategoryMatches = false,
}: Props) {
  const [rows, setRows] = useState<HomeOpportunityCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const typesKey = (listingTypes ?? []).join(",");

  useEffect(() => {
    setLoading(true);
    fetchTypedOpportunities({
      listingTypes: typesKey ? typesKey.split(",") : undefined,
      category,
      includeXmlCategoryMatches,
      limit: 24,
    })
      .then((data) => {
        setRows(data);
        setError(null);
      })
      .catch(() => {
        setRows([]);
        setError("Live offers could not be loaded. Refresh and try again.");
      })
      .finally(() => setLoading(false));
  }, [typesKey, category, includeXmlCategoryMatches]);

  return (
    <section className="section-pad bg-[#F7F8FC] px-5 sm:px-8">
      <div className="mx-auto max-w-[1600px]">
        <SectionHeading
          as="h1"
          variant="hero"
          eyebrow={eyebrow}
          title={title}
          description={description}
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
            <p className="col-span-full py-2 text-center text-sm text-slate-500">
              Loading live offers…
            </p>
          </div>
        ) : error ? (
          <p className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            {error}
          </p>
        ) : rows.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-indigo-200 bg-white px-4 py-12 text-center text-sm text-slate-500">
            {emptyHint}{" "}
            <Link href="/opportunities" className="font-semibold text-violet-600 hover:underline">
              Browse all opportunities
            </Link>
          </p>
        ) : (
          <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((job) => (
              <li key={job.id} className="h-full min-w-0">
                <OfferCard job={job} ctaLabel={ctaLabel} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
