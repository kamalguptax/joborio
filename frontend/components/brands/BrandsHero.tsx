import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, BadgeCheck, BarChart3, Briefcase, GraduationCap, Rocket } from "lucide-react";

/**
 * Optional photo for the right side of the hero (transparent PNG works best),
 * e.g. "/images/brand-hero.png". Leave null to show the built-in campaign visual.
 */
const HERO_IMAGE: string | null = null;

const bars = [34, 46, 40, 58, 52, 72, 88];

function Chip({
  children,
  className,
  delay = "0s",
}: {
  children: ReactNode;
  className: string;
  delay?: string;
}) {
  return (
    <div
      className={`brand-float absolute z-20 flex items-center gap-2.5 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-[#0A2150] shadow-[0_18px_40px_-18px_rgba(10,74,168,0.55)] ring-1 ring-violet-100 ${className}`}
      style={{ animationDelay: delay }}
    >
      {children}
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]">
      <div className="absolute inset-[4%] rounded-full bg-gradient-to-br from-violet-300/60 via-violet-200/50 to-indigo-200/40" />
      <div className="absolute inset-[16%] rounded-full border border-white/70" />

      {HERO_IMAGE ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-x-[6%] bottom-0 z-10 h-[96%] w-[88%] object-contain object-bottom"
        />
      ) : (
        <div className="absolute inset-x-[9%] bottom-[10%] top-[19%] z-10 flex flex-col rounded-[2rem] bg-white p-5 shadow-[0_40px_80px_-35px_rgba(10,61,145,0.6)] ring-1 ring-violet-100 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Campaign performance</p>
              <p className="mt-0.5 text-base font-bold text-[#0A2150]">All creators &amp; publishers</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live
            </span>
          </div>

          <div className="mt-4 flex flex-1 items-end gap-2 sm:gap-3" aria-hidden="true">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-xl bg-gradient-to-t from-[#0A4AA8] to-[#1F73E6]"
                style={{ height: `${h}%`, opacity: 0.55 + i * 0.07 }}
              />
            ))}
          </div>

          <ul className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-slate-500 sm:text-xs">
            {["Clicks", "Registrations", "Applications"].map((label) => (
              <li key={label} className="rounded-xl bg-violet-50 px-2 py-2 text-violet-700">
                {label}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-center text-[10px] text-slate-400">Sample view of your campaign dashboard</p>
        </div>
      )}

      <Chip className="left-[2%] top-[8%]" delay="0s">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Briefcase size={16} />
        </span>
        Jobs
      </Chip>
      <Chip className="right-[0%] top-[32%]" delay="1.2s">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white">
          <GraduationCap size={16} />
        </span>
        Courses
      </Chip>
      <Chip className="bottom-[4%] right-[4%]" delay="2.1s">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Rocket size={16} />
        </span>
        SaaS
      </Chip>
      <div
        className="brand-float absolute right-[10%] top-[3%] z-20 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-lg ring-1 ring-violet-100"
        style={{ animationDelay: "0.6s" }}
        aria-hidden="true"
      >
        <BarChart3 size={22} />
      </div>
    </div>
  );
}

export default function BrandsHero() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-violet-100/80 via-white to-indigo-50">
      <style>{`
        @keyframes brand-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .brand-float { animation: brand-float 5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .brand-float { animation: none; } }
      `}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-violet-300/25 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-indigo-300/25 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-4 pb-12 pt-28 sm:px-8 sm:pb-16 sm:pt-32 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:pb-20 lg:pt-36">
        <div className="min-w-0">
          <span className="inline-flex rounded-full bg-violet-100 px-4 py-1.5 text-sm font-semibold text-violet-700 ring-1 ring-violet-200">
            Upclift for Brands
          </span>
          <h1 className="mt-5 max-w-[22ch] text-balance text-[clamp(2.25rem,1.3rem+3.6vw,3.9rem)] font-bold leading-[1.07] tracking-tight text-[#0A2150]">
            Acquire customers, applicants and{" "}
            <span className="bg-gradient-to-r from-[#0A5FCF] to-[#2563EB] bg-clip-text text-transparent">
              learners.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl">
            Performance-based campaigns through creators and publishers.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/brand/register"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#0A4AA8] px-7 py-3 text-base font-semibold text-white shadow-[0_16px_34px_-16px_rgba(10,74,168,0.9)] transition hover:bg-[#0B3B85] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A4AA8]"
            >
              Create Brand Account
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center rounded-full border-2 border-[#0A4AA8] bg-white/70 px-7 py-3 text-base font-semibold text-[#0B3B85] transition hover:bg-violet-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A4AA8]"
            >
              Request a Campaign Plan
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
            {["Pay only for verified outcomes", "Track every creator", "Pause or scale anytime"].map((t) => (
              <li key={t} className="inline-flex items-center gap-2">
                <BadgeCheck size={16} className="text-violet-600" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}
