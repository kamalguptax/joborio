"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Flame, ArrowRight } from "lucide-react";
import { fetchListings } from "@/lib/api/listings";
import type { Listing } from "@/lib/api/types";

const fallbackJobs = [
  {
    id: 0,
    company: "Demo Co",
    title: "Sample role",
    location: "Remote",
    earning: "$0.03 / click",
    color: "blue",
  },
];

const colorClasses: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700",
  pink: "bg-pink-50 text-pink-600",
  cyan: "bg-cyan-50 text-cyan-600",
  green: "bg-green-50 text-green-700",
  orange: "bg-orange-50 text-orange-600",
  purple: "bg-purple-50 text-purple-700",
  teal: "bg-teal-50 text-teal-600",
  red: "bg-red-50 text-red-600",
};

const colors = Object.keys(colorClasses);

function mapListing(listing: Listing, index: number) {
  return {
    id: listing.id,
    company: listing.company_name ?? "Company",
    title: listing.title,
    location: listing.location_label ?? (listing.is_remote ? "Remote" : "Global"),
    earning: `$${Number(listing.ppc_rate_usd ?? 0.03).toFixed(2)} / click`,
    color: colors[index % colors.length],
  };
}

export default function HotJobs() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [jobs, setJobs] = useState(fallbackJobs);
  const [activeDot, setActiveDot] = useState(0);
  const [dotCount, setDotCount] = useState(fallbackJobs.length);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    fetchListings({ per_page: 8 })
      .then(({ data }) => {
        if (data.length > 0) {
          setJobs(data.map(mapListing));
        }
      })
      .catch(() => {});
  }, []);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;

    const card = el.querySelector<HTMLElement>("[data-card]");
    const cardWidth = card ? card.offsetWidth + 12 : el.clientWidth;

    const index = Math.round(el.scrollLeft / cardWidth);
    setActiveDot(index);

    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);

    const visibleCards = Math.max(1, Math.round(el.clientWidth / cardWidth));
    setDotCount(Math.max(1, jobs.length - visibleCards + 1));
  }, [jobs.length]);

  useEffect(() => {
    updateScrollState();
    const el = trackRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scrollByCards = useCallback((direction: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;

    const card = el.querySelector<HTMLElement>("[data-card]");
    const cardWidth = card ? card.offsetWidth + 12 : el.clientWidth * 0.75;

    el.scrollBy({
      left: direction === "right" ? cardWidth : -cardWidth,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;

      const nearEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      if (nearEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollByCards("right");
      }
    }, 3500);

    return () => clearInterval(timer);
  }, [isPaused, scrollByCards]);

  const goToDot = (i: number) => {
    const el = trackRef.current;
    if (!el) return;

    const card = el.querySelector<HTMLElement>("[data-card]");
    const cardWidth = card ? card.offsetWidth + 12 : el.clientWidth;

    el.scrollTo({ left: i * cardWidth, behavior: "smooth" });
  };

  return (
    <section className="w-full bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div className="flex items-start gap-3">
            <Flame
              size={26}
              fill="#ff4b4b"
              strokeWidth={1.8}
              className="mt-1 shrink-0 text-orange-400"
            />
            <div>
              <h2 className="text-2xl font-bold leading-tight text-[#24375C] sm:text-[26px]">
                Hot Jobs
              </h2>
              <p className="mt-1 text-sm text-[#8290AA]">
                Top opportunities this week. Start sharing and earn!
              </p>
            </div>
          </div>

          <Link
            href="/jobs"
            className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-[#633BFF] transition hover:text-[#4f2ee0] sm:flex"
          >
            View All Jobs
            <ArrowRight size={15} />
          </Link>
        </div>

        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <button
            type="button"
            onClick={() => scrollByCards("left")}
            disabled={atStart}
            className="absolute left-[-16px] top-[92px] z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white text-[#52617D] shadow-md transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-0 md:flex"
            aria-label="Previous jobs"
          >
            <ChevronLeft size={20} />
          </button>

          <div
            ref={trackRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {jobs.map((job) => (
              <div
                key={`${job.id}-${job.company}`}
                data-card
                className="w-[calc(50%_-_6px)] shrink-0 snap-start sm:w-[calc(33.333%_-_8px)] lg:w-[calc(20%_-_9.6px)]"
              >
                <div className="group h-full rounded-2xl border border-[#E9EEF6] bg-white p-4 transition duration-300">
                  <div className="flex h-14 items-center justify-center rounded-xl bg-[#FAFBFD] text-lg font-bold text-[#633BFF]">
                    {(job.company ?? "J").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="mt-3">
                    <h3 className="text-base font-bold text-[#273B60]">
                      {job.company}
                    </h3>
                    <p className="mt-1 min-h-[38px] text-sm font-medium leading-snug text-[#536584]">
                      {job.title}
                      <br />
                      {job.location}
                    </p>
                  </div>
                  <div
                    className={`mt-3 flex items-center justify-between rounded-lg px-3 py-2 ${colorClasses[job.color]}`}
                  >
                    <div>
                      <span className="block text-[11px] font-medium opacity-80">
                        Earn up to
                      </span>
                      <strong className="text-[15px] font-bold">
                        {job.earning}
                      </strong>
                    </div>
                    <ArrowRight
                      size={16}
                      className="shrink-0 transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollByCards("right")}
            disabled={atEnd}
            className="absolute right-[-16px] top-[92px] z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white text-[#52617D] shadow-md transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-0 md:flex"
            aria-label="Next jobs"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {dotCount > 1 && (
          <div className="mt-5 flex justify-center gap-1.5">
            {Array.from({ length: dotCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToDot(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeDot ? "w-6 bg-[#633BFF]" : "w-1.5 bg-[#E1E6F0]"
                }`}
              />
            ))}
          </div>
        )}

        <div className="mt-5 flex justify-center sm:hidden">
          <Link
            href="/jobs"
            className="flex items-center gap-1 text-sm font-semibold text-[#633BFF]"
          >
            View All Jobs
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
