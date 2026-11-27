"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CirclePlus, Heart, Pencil, Share2 } from "lucide-react";
import Character from "@/components/art/Character";
import { DEFAULT_AVATAR } from "@/lib/defaultAvatar";
import SocialIcon, { SOCIAL_BG, type SocialKey } from "@/components/creators/SocialIcon";

/* ——— Palette: site theme (navy text, violet accent) ——— */
const NAVY = "text-[#0F1B3D]";
const ACCENT = "#7C3AED";

/* ——— Small shared pieces ——— */

function MockCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`w-full max-w-[390px] rounded-[28px] bg-white p-4 shadow-[0_34px_60px_-34px_rgba(30,27,90,0.35)] ring-1 ring-black/[0.04] transition duration-300 hover:-translate-y-1 hover:shadow-[0_40px_64px_-32px_rgba(30,27,90,0.45)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`}
    >
      {children}
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className={`relative inline-block h-[18px] w-9 shrink-0 rounded-full ${on ? "bg-emerald-200" : "bg-slate-200"}`}
    >
      <span
        className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full ${
          on ? "right-1 bg-emerald-500" : "left-1 bg-slate-600"
        }`}
      />
    </span>
  );
}

/** Round brand button used on the profile card (LinkedIn, Instagram, TikTok, Telegram, YouTube, WhatsApp channel). */
function SocialDot({ platform }: { platform: SocialKey }) {
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white"
      style={{ background: SOCIAL_BG[platform] }}
    >
      <SocialIcon platform={platform} size={13} />
    </span>
  );
}

/* ——— The five mock UI cards ——— */

function ProfileCard() {
  return (
    <MockCard>
      <div className="h-24 rounded-2xl bg-[linear-gradient(115deg,#79D3B8_0%,#C6E7A6_38%,#F6E4A0_64%,#F7C8B8_100%)]" />
      <div className="-mt-10 flex flex-col items-center">
        <span className="block h-20 w-20 overflow-hidden rounded-full bg-white ring-4 ring-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={DEFAULT_AVATAR} alt="" className="h-full w-full object-cover" />
        </span>
      </div>
      <div className="-mt-9 flex items-center justify-between px-1">
        <span className="flex gap-1.5">
          <SocialDot platform="linkedin" />
          <SocialDot platform="instagram" />
          <SocialDot platform="tiktok" />
        </span>
        <span className="flex gap-1.5">
          <SocialDot platform="telegram" />
          <SocialDot platform="youtube" />
          <SocialDot platform="whatsapp" />
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500">
            <Share2 size={13} />
          </span>
        </span>
      </div>
      <div className="mt-2 text-center">
        <p className="text-[1.15rem] font-semibold text-slate-900">Aarav Mehta</p>
        <p className="text-[11px] text-slate-500">@aarav_shares</p>
        <p className="mt-2 text-[12px] text-slate-500">
          Careers <span className="px-1 text-slate-300">|</span>
          <span className="font-semibold text-slate-800">Jobs &amp; Education</span>
          <span className="px-1 text-slate-300">|</span> Campaigns
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 rounded-2xl border border-slate-200 bg-white py-3 text-center">
        <div className="border-r border-slate-200">
          <p className="text-base font-semibold text-slate-900">12.4k</p>
          <p className="text-[11px] text-slate-500">Followers</p>
        </div>
        <div>
          <p className="text-base font-semibold text-slate-900">38k</p>
          <p className="text-[11px] text-slate-500">Subscribers</p>
        </div>
      </div>
    </MockCard>
  );
}

/** The four ways a creator can earn (PPC, PPR, PPA, PPE). Values are examples. */
const RATES: { title: string; hint: string; value: string; unit?: string; example?: boolean }[] = [
  { title: "Pay per click (PPC)", hint: "Earn for every verified click", value: "$0.04", unit: "per click" },
  { title: "Pay per registration (PPR)", hint: "Earn when someone signs up", value: "Example: $1.20 per registration", example: true },
  { title: "Pay per action (PPA)", hint: "Earn for a lead or an application", value: "Example: $0.80 per application", example: true },
  { title: "Pay per engagement (PPE)", hint: "Earn when you like, comment or repost", value: "Example: $0.25 per engagement", example: true },
];

function RatesCard() {
  return (
    <MockCard className="p-5">
      <p className="text-center text-[1.05rem] font-semibold text-slate-900">Pick Your Campaigns</p>
      <p className="mx-auto mt-1.5 max-w-[17rem] text-center text-[12px] leading-snug text-slate-500">
        Choose what your audience will find useful. The reward is shown before you share.
      </p>
      <div className="mt-4 space-y-2.5 rounded-2xl bg-slate-50 p-3">
        {RATES.map((r) => (
          <div key={r.title}>
            <p className="text-[13px] font-medium text-slate-900">{r.title}</p>
            <p className="text-[11px] text-slate-500">{r.hint}</p>
            <div
              className={`mt-1.5 rounded-xl bg-white px-3 py-2.5 text-[14px] ${
                r.example ? "text-slate-400" : "font-medium text-slate-900"
              }`}
            >
              {r.example ? (
                r.value
              ) : (
                <>
                  {r.value} <span className="text-[12px] font-normal text-slate-500">{r.unit}</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </MockCard>
  );
}

function LinksCard() {
  const rows: { platform: SocialKey; label: string; link: string; on: boolean }[] = [
    { platform: "linkedin", label: "LinkedIn profile", link: "jobrio.link/aarav-in", on: true },
    { platform: "instagram", label: "Instagram bio", link: "jobrio.link/aarav", on: true },
    { platform: "telegram", label: "Telegram group", link: "jobrio.link/aarav-tg", on: true },
    { platform: "youtube", label: "YouTube channel", link: "jobrio.link/aarav-yt", on: false },
    { platform: "whatsapp", label: "WhatsApp channel", link: "jobrio.link/aarav-wa", on: false },
  ];
  return (
    <MockCard className="p-5">
      <p className="text-center text-[1.05rem] font-medium text-slate-800">Your Share Links</p>
      <div className="mt-2 space-y-0.5">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-center justify-between px-1 pt-2 text-[13px] text-slate-500">
              <span className="flex items-center gap-2">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                  style={{ background: SOCIAL_BG[r.platform] }}
                >
                  <SocialIcon platform={r.platform} size={11} />
                </span>
                {r.label}
              </span>
              <CirclePlus size={16} className="text-slate-400" />
            </div>
            <div className="mt-1 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-[13px] text-slate-800">
              <span>{r.link}</span>
              <span className="flex items-center gap-3">
                <Pencil size={13} className="text-slate-400" />
                <Toggle on={r.on} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </MockCard>
  );
}

function JobShareCard() {
  return (
    <div
      aria-hidden="true"
      className="relative h-[230px] w-full max-w-[390px] overflow-hidden rounded-[28px] bg-[linear-gradient(120deg,#0B1D4F_0%,#14296B_50%,#2E2297_100%)] shadow-[0_34px_60px_-34px_rgba(30,27,90,0.5)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_40px_64px_-32px_rgba(30,27,90,0.6)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="absolute left-0 top-0 flex max-w-[calc(100%-3rem)] text-[10.5px] font-medium sm:text-[11px]">
        <span className="whitespace-nowrap rounded-br-xl bg-[#7C3AED] px-2.5 py-1.5 text-white sm:px-3">
          Jobs &amp; Careers
        </span>
        <span className="whitespace-nowrap bg-white/10 px-2.5 py-1.5 text-white/80 sm:px-3">Courses</span>
        <span className="whitespace-nowrap bg-white/10 px-2.5 py-1.5 text-white/80 sm:px-3">
          Other Campaigns
        </span>
      </div>
      <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-700">
        <Heart size={14} />
      </span>
      <div className="absolute bottom-0 left-0 h-[86%] w-[40%] opacity-90">
        <Character hoodie="#6D3CF0" className="h-full w-full" />
      </div>
      <div className="absolute inset-y-0 right-0 flex w-[58%] flex-col justify-center pr-5 text-white">
        <p className="text-[1.6rem] font-semibold leading-[1.05]">Data Analyst</p>
        <p className="mt-1 text-[12px] text-white/70">Acme Hiring · Remote</p>
        <p className="mt-2 text-[11px] text-white/80">
          <span className="font-semibold">2.4k</span> clicks <span className="px-1 text-white/40">|</span>
          <span className="font-semibold">86</span> sign-ups
        </p>
        <div className="mt-3 flex items-center gap-3">
          <p className="leading-none">
            <span className="text-[1.5rem] font-semibold">$1.20</span>
            <span className="block text-[10px] text-white/70">per registration</span>
          </p>
          <span className="rounded-full bg-gradient-to-r from-violet-300 to-violet-600 px-4 py-2 text-[12px] font-medium text-white">
            Share link
          </span>
        </div>
      </div>
    </div>
  );
}

function EarningsCard() {
  return (
    <MockCard className="p-5">
      <p className="text-center text-[1.05rem] font-medium text-slate-900">Earnings Summary</p>
      <div className="mt-3 space-y-2.5 rounded-2xl bg-slate-50 p-2.5">
        {[
          { t: "Verified clicks", s: "1,050 clicks", v: "$42.00" },
          { t: "Registrations", s: "86 sign-ups", v: "$103.20" },
        ].map((r) => (
          <div key={r.t} className="flex items-center justify-between rounded-xl bg-white px-3.5 py-3">
            <div>
              <p className="text-[13px] font-medium text-slate-900">{r.t}</p>
              <p className="text-[11px] text-slate-500">{r.s}</p>
            </div>
            <div className="text-right">
              <p className="text-[1.05rem] font-semibold text-slate-900">{r.v}</p>
              <p className="text-[10px] text-slate-500">Verified</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-2xl bg-slate-50 px-3.5 py-3">
        <p className="text-[11px] text-slate-500">All campaigns this month</p>
        <div className="mt-0.5 flex items-center justify-between">
          <p className="text-[1.05rem] text-slate-900">Total Earned</p>
          <p className="text-[1.05rem] font-semibold text-slate-900">$145.20</p>
        </div>
      </div>
      <div className="mt-3 flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-violet-300 via-violet-500 to-violet-700 text-[14px] font-medium text-white">
        Request payout
      </div>
    </MockCard>
  );
}

/* ——— Steps ——— */

const STEPS: { title: string; text: string; card: ReactNode }[] = [
  {
    title: "Set up your creator profile",
    text: "Sign up and add your niche and platforms. Your profile gets one link you can share anywhere.",
    card: <ProfileCard />,
  },
  {
    title: "Pick campaigns that fit",
    text: "Browse jobs, courses and campaigns. See the reward for each one before you share it.",
    card: <RatesCard />,
  },
  {
    title: "Share one link anywhere",
    text: "Post your tracked link on Instagram, WhatsApp, Telegram or YouTube. Pause any link whenever you like.",
    card: <LinksCard />,
  },
  {
    title: "Your audience clicks and registers",
    text: "Every click and sign-up is tracked and verified, so you can follow real results as they happen.",
    card: <JobShareCard />,
  },
  {
    title: "Earn from verified results",
    text: "You are paid for qualified actions. Every click, registration and payout shows up in your earnings.",
    card: <EarningsCard />,
  },
];

export default function CreatorSolutionTimeline() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [fill, setFill] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const wrap = wrapRef.current;
      if (!wrap) return;
      const mid = window.innerHeight * 0.55;
      const rect = wrap.getBoundingClientRect();
      setFill(Math.max(0, Math.min(rect.height, mid - rect.top)));
      let best = 0;
      let bestDist = Infinity;
      nodeRefs.current.forEach((n, i) => {
        if (!n) return;
        const r = n.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      aria-labelledby="creator-solution-title"
      className="relative overflow-hidden bg-[linear-gradient(180deg,#F5F3FF_0%,#F8FAFF_55%,#FFFFFF_100%)] py-16 sm:py-20 md:py-24"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-sky-400/10 blur-[110px]" />
        <div className="absolute -right-32 bottom-24 h-96 w-96 rounded-full bg-violet-400/15 blur-[120px]" />
      </div>
      <div className="relative mx-auto w-full max-w-[1100px] px-5 sm:px-8">
        <div className="text-center">
          <p className="text-eyebrow flex items-center justify-center gap-3 text-violet-600">
            <span aria-hidden="true" className="h-px w-6 bg-violet-400" />
            THE SOLUTION
            <span aria-hidden="true" className="h-px w-6 bg-violet-400" />
          </p>
          <h2
            id="creator-solution-title"
            className={`text-section-heading mx-auto mt-4 max-w-3xl ${NAVY}`}
          >
            Turn your audience into income. One link. Verified pay.
          </h2>
        </div>

        <div ref={wrapRef} className="relative mt-16 md:mt-20">
          {/* Track + progress */}
          <div aria-hidden="true" className="absolute bottom-0 left-5 top-0 w-px rounded-full bg-slate-300 md:left-1/2" />
          <div
            aria-hidden="true"
            className="absolute left-5 top-0 w-0.5 -translate-x-[0.5px] rounded-full md:left-1/2"
            style={{ height: fill, backgroundColor: ACCENT, transition: "height 120ms linear" }}
          />

          <ol className="relative">
            {STEPS.map((step, i) => {
              const textLeft = i % 2 === 0;
              const isActive = i === active;
              const number = String(i + 1).padStart(2, "0");
              return (
                <li
                  key={step.title}
                  aria-current={isActive ? "step" : undefined}
                  className="relative py-10 pl-14 md:py-16 md:pl-0"
                >
                  <span
                    ref={(el) => {
                      nodeRefs.current[i] = el;
                    }}
                    aria-hidden="true"
                    className={`absolute left-5 top-14 z-10 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border text-[12px] font-semibold tabular-nums transition-all duration-300 motion-reduce:transition-none md:left-1/2 md:top-1/2 md:-translate-y-1/2 ${
                      isActive
                        ? "scale-105 border-[#7C3AED] bg-[#7C3AED] text-white shadow-[0_10px_24px_-6px_rgba(124,58,237,0.55)] ring-[10px] ring-[#7C3AED]/20"
                        : "border-slate-300 bg-white text-slate-500"
                    }`}
                  >
                    {number}
                  </span>

                  <div className="grid items-center gap-8 md:grid-cols-2 md:gap-x-[88px]">
                    <div
                      className={`transition-opacity duration-300 motion-reduce:transition-none md:row-start-1 ${
                        textLeft ? "md:col-start-1 md:text-right" : "md:col-start-2"
                      } ${isActive ? "opacity-100" : "opacity-60"}`}
                    >
                      <p className="text-[11px] font-semibold tracking-[0.2em] text-[#7C3AED]">STEP {number}</p>
                      <h3 className={`mt-2 text-balance text-[1.6rem] font-semibold leading-tight tracking-tight md:text-[1.9rem] ${NAVY}`}>
                        {step.title}
                      </h3>
                      <p
                        className={`mt-3 max-w-sm text-pretty text-[15px] leading-7 text-slate-600 ${textLeft ? "md:ml-auto" : ""}`}
                      >
                        {step.text}
                      </p>
                    </div>
                    <div
                      className={`flex transition duration-500 motion-reduce:transition-none md:row-start-1 ${
                        textLeft ? "md:col-start-2 md:justify-start" : "md:col-start-1 md:justify-end"
                      } ${isActive ? "opacity-100" : "opacity-80 md:scale-[0.98]"}`}
                    >
                      {step.card}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <p className="mt-6 text-center text-[12px] text-slate-500">
          Names and numbers are examples. Rewards depend on the campaigns you choose.
        </p>
      </div>
    </section>
  );
}