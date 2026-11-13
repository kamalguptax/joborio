"use client";

import Link from "next/link";
import ViewJobLink from "@/components/jobs/ViewJobLink";
import { useEffect, useRef, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import {
  CATEGORY_BADGE,
  fetchHomeOpportunities,
  mixOpportunitiesByCategory,
  type HomeOpportunityCard,
} from "@/lib/home/opportunityCards";
import SectionHeading from "@/components/layout/SectionHeading";

type Opportunity = HomeOpportunityCard;

/* ------------------------------ icons ------------------------------ */

function VerifiedIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" aria-label="Verified">
      <circle cx="12" cy="12" r="11" fill="#1D8CF8" />
      <path
        d="M7 12.5l3.2 3.2L17 9"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 text-[#2F4F9D]"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function ArrowIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3h12v18l-6-4.5L6 21V3z" />
    </svg>
  );
}

/* ------------------------------- card ------------------------------ */

function OpportunityCard({ o }: { o: Opportunity }) {
  const [saved, setSaved] = useState(false);
  const badge = CATEGORY_BADGE[o.category] ?? CATEGORY_BADGE.hiring;

  return (
    <article className="opportunity-card flex h-full flex-col rounded-3xl border border-indigo-100 bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,0.06)] sm:p-6">
      {/* top row */}
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-bold ${o.logoColor}`}
        >
          {o.initial}
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-slate-900">{o.company}</span>
          <VerifiedIcon />
        </div>
        <span
          className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${badge.className}`}
        >
          {badge.label}
        </span>
        <button
          type="button"
          onClick={() => setSaved((v) => !v)}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save opportunity"}
          className={`tap-target flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition ${
            saved ? "text-violet-600" : "text-[#1E3A8A]"
          }`}
        >
          <BookmarkIcon filled={saved} />
        </button>
      </div>

      <h3 className="text-card-heading mt-5 line-clamp-2 min-h-[2.5rem]">
        {o.title}
      </h3>
      <p className="text-caption mt-2 flex items-center gap-2 font-semibold text-emerald-600">
        <ClockIcon />
        {o.endsIn}
      </p>

      <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 text-sm text-slate-500">
        <PinIcon />
        <span className="truncate">{o.location}</span>
        <span className="h-1 w-1 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />
        <span className="truncate">{o.type}</span>
      </div>

      <div className="mt-4 flex min-h-[2rem] flex-wrap gap-2">
        {o.tags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700"
          >
            {t}
          </span>
        ))}
      </div>

      {/* footer — no earnings/amount */}
      <div className="mt-auto pt-5">
        <div className="flex items-center gap-2.5 border-t border-slate-200 pt-4">
          <span className="whitespace-nowrap rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
            {o.match}% match
          </span>
          <ViewJobLink
            href={o.href}
            ariaLabel={`View ${o.title}`}
            className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[#1E3A8A] transition hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
          >
            <ArrowIcon />
          </ViewJobLink>
        </div>
      </div>
    </article>
  );
}

/* ----------------------------- slider ------------------------------ */

/** Number of cards in the slider. */
const SLIDER_CARDS = 6;

const PER_VIEW = { xl: 4, lg: 3, sm: 2, xs: 1 } as const;

function sliderSettings(count: number) {
  return {
    arrows: false,
    dots: true,
    speed: 600,
    slidesToShow: PER_VIEW.xl,
    slidesToScroll: 1,
    infinite: count > PER_VIEW.xl,
    swipeToSlide: true,
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    pauseOnFocus: true,
    responsive: [
      {
        breakpoint: 1280,
        settings: { slidesToShow: PER_VIEW.lg, infinite: count > PER_VIEW.lg },
      },
      {
        breakpoint: 1024,
        settings: { slidesToShow: PER_VIEW.sm, infinite: count > PER_VIEW.sm },
      },
      {
        breakpoint: 640,
        settings: { slidesToShow: PER_VIEW.xs, infinite: count > PER_VIEW.xs },
      },
    ],
  };
}

/* ----------------------------- section ----------------------------- */

export default function OpportunitiesSlider() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sliderRef = useRef<Slider>(null);

  useEffect(() => {
    // Fetch a bigger pool, then show 6 cards mixed across categories.
    fetchHomeOpportunities(24)
      .then((rows) => {
        setOpportunities(mixOpportunitiesByCategory(rows, SLIDER_CARDS));
        setError(null);
      })
      .catch(() => {
        setOpportunities([]);
        setError("Live jobs could not be loaded. Refresh the page and try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section
      aria-label="Opportunities worth sharing"
      className="section-pad overflow-x-clip bg-[#F7F8FC]"
    >
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            className="min-w-0"
            eyebrow="Fresh this week"
            title="Opportunities worth sharing"
            description="Curated, verified and ready for your audience."
          />

          <div className="flex shrink-0 items-center gap-4">
            <Link
              href="/opportunities"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
            >
              View all opportunities →
            </Link>

            {opportunities.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => sliderRef.current?.slickPrev()}
                  aria-label="Previous opportunities"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#1E3A8A] shadow-[0_6px_20px_rgba(76,29,149,0.12)] transition hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
                >
                  <ChevronIcon dir="left" />
                </button>
                <button
                  type="button"
                  onClick={() => sliderRef.current?.slickNext()}
                  aria-label="Next opportunities"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
                >
                  <ChevronIcon dir="right" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Slider: 1 → 2 → 3 → 4 cards per view */}
        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-3xl border border-indigo-100 bg-white/80"
                  aria-hidden
                />
              ))}
              <p className="col-span-full py-4 text-center text-sm text-slate-500 sm:text-base">
                Loading live jobs…
              </p>
            </div>
          ) : error ? (
            <p className="w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 sm:px-6">
              {error}
            </p>
          ) : opportunities.length === 0 ? (
            <p className="w-full rounded-2xl border border-dashed border-indigo-200 bg-white px-4 py-12 text-center text-sm text-slate-500 sm:text-base">
              No opportunities yet. Check back soon or{" "}
              <Link href="/opportunities" className="font-semibold text-indigo-700 underline">
                browse all
              </Link>
              .
            </p>
          ) : (
            <Slider ref={sliderRef} {...sliderSettings(opportunities.length)} className="opp-slider">
              {opportunities.map((o) => (
                <div key={o.id} className="h-full">
                  <OpportunityCard o={o} />
                </div>
              ))}
            </Slider>
          )}
        </div>
      </div>
    </section>
  );
}
