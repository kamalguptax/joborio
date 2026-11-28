"use client";

import Link from "next/link";

export default function BrandSectionPlaceholder({
  title,
  description,
  ctaHref = "/brand/programs",
  ctaLabel = "Go to My Campaigns",
}: {
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          Brand
        </p>
        <h1 className="mt-1 text-3xl font-bold text-[#0A2150]">{title}</h1>
        <p className="mt-2 max-w-2xl text-slate-500">{description}</p>
      </div>
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-sm text-slate-500">
          This section is ready in the menu. Full workflows land here next.
        </p>
        <Link
          href={ctaHref}
          className="mt-5 inline-flex rounded-full bg-violet-600 px-5 py-2.5 text-sm font-bold text-white"
        >
          {ctaLabel}
        </Link>
      </div>
    </>
  );
}
