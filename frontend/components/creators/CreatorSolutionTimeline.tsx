"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Briefcase,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  GraduationCap,
  Globe,
  Laptop,
  Megaphone,
  MousePointerClick,
  Play,
  Rocket,
  Star,
  User,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { DEFAULT_AVATAR } from "@/lib/defaultAvatar";
import SocialIcon, { SOCIAL_BG, type SocialKey } from "@/components/creators/SocialIcon";

/* ——— Palette: site theme (navy text, brand blue accent) ——— */
const NAVY = "text-[#0A2150]";
const ACCENT = "#0A5FCF";

/* ——— Shared pieces ——— */

function MockCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`w-full max-w-[420px] rounded-3xl border border-[#0A5FCF]/10 bg-white p-4 shadow-[0_28px_50px_-34px_rgba(10,33,80,0.35)] sm:p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function IconDisc({
  icon: Icon,
  className,
  size = 20,
}: {
  icon: LucideIcon;
  className: string;
  size?: number;
}) {
  return (
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${className}`}>
      <Icon size={size} aria-hidden="true" />
    </span>
  );
}

/* ——— The seven mock UI cards (content taken from the JobOrio "How it works" design) ——— */

/** 01: pick a role. */
function RoleCard() {
  const tile = "relative flex flex-col items-center gap-2 rounded-2xl border px-3 py-5 text-[14px] font-semibold";
  return (
    <MockCard>
      <div className="grid grid-cols-2 gap-3">
        <div className={`${tile} border-[#0A5FCF] bg-[#EEF5FF] text-[#0A5FCF] shadow-[0_0_0_3px_rgba(10,95,207,0.12)]`}>
          <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0A5FCF] text-white">
            <Check size={12} strokeWidth={3} />
          </span>
          <User size={30} className="text-[#3B7BE0]" />
          Creator
        </div>
        <div className={`${tile} border-slate-200 bg-slate-50 text-[#0A2150]/80`}>
          <Globe size={30} className="text-slate-400" />
          Publisher
        </div>
      </div>
    </MockCard>
  );
}

/** 02: profile with trust checks. */
function ProfileCard() {
  return (
    <MockCard>
      <div className="flex items-center gap-4">
        <span className="block h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-4 ring-[#EEF5FF]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={DEFAULT_AVATAR} alt="" className="h-full w-full object-cover" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[15px] font-semibold text-[#0A2150]">
            Your Profile
            <BadgeCheck size={16} className="text-[#0A5FCF]" />
          </p>
          <div className="mt-2.5 h-2 w-3/4 rounded-full bg-slate-200" />
          <div className="mt-2 h-2 w-1/2 rounded-full bg-slate-100" />
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-3.5 text-[12px] font-medium text-slate-700">
        {["Email Verified", "Social Linked", "Website Added"].map((t) => (
          <li key={t} className="flex items-center gap-1.5">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check size={10} strokeWidth={3.5} />
            </span>
            {t}
          </li>
        ))}
      </ul>
    </MockCard>
  );
}

/** 03: audience type chips. */
const AUDIENCES: { label: string; icon: LucideIcon; selected?: boolean }[] = [
  { label: "Students", icon: GraduationCap, selected: true },
  { label: "Job Seekers", icon: Briefcase },
  { label: "Tech Professionals", icon: Laptop },
  { label: "Course Learners", icon: Play },
  { label: "Entrepreneurs", icon: Rocket },
];

function AudienceCard() {
  return (
    <MockCard>
      <div className="flex flex-wrap gap-2.5">
        {AUDIENCES.map(({ label, icon: Icon, selected }) => (
          <span
            key={label}
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] ${
              selected
                ? "border-[#0A5FCF]/40 bg-[#EEF5FF] font-semibold text-[#0A5FCF]"
                : "border-slate-200 bg-white font-medium text-[#0A2150]/80"
            }`}
          >
            <Icon size={15} className={selected ? "text-[#0A5FCF]" : "text-[#0A2150]/70"} />
            {label}
          </span>
        ))}
      </div>
    </MockCard>
  );
}

/** 04: the four campaign types. */
const CAMPAIGN_TYPES: { label: string; icon: LucideIcon; tone: string }[] = [
  { label: "PPC", icon: MousePointerClick, tone: "bg-blue-100 text-blue-600" },
  { label: "PPR", icon: Megaphone, tone: "bg-rose-100 text-rose-500" },
  { label: "PPA", icon: Users, tone: "bg-sky-100 text-sky-600" },
  { label: "PPE", icon: Star, tone: "bg-amber-100 text-amber-500" },
];

function CampaignTypesCard() {
  return (
    <MockCard>
      <div className="grid grid-cols-4 gap-2.5">
        {CAMPAIGN_TYPES.map(({ label, icon, tone }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-1 py-3.5 text-[13px] font-semibold text-[#0A2150]"
          >
            <IconDisc icon={icon} className={tone} />
            {label}
          </div>
        ))}
      </div>
    </MockCard>
  );
}

/** 05: where to share. */
const PLATFORMS: { label: string; key?: SocialKey }[] = [
  { label: "WhatsApp", key: "whatsapp" },
  { label: "Telegram", key: "telegram" },
  { label: "Instagram", key: "instagram" },
  { label: "YouTube", key: "youtube" },
  { label: "LinkedIn", key: "linkedin" },
  { label: "Website" },
];

function PlatformsCard() {
  return (
    <MockCard>
      <div className="grid grid-cols-3 gap-2.5">
        {PLATFORMS.map(({ label, key }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-1 py-3 text-[12px] font-semibold text-[#0A2150]"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-white"
              style={{ background: key ? SOCIAL_BG[key] : ACCENT }}
            >
              {key ? <SocialIcon platform={key} size={19} /> : <Globe size={19} />}
            </span>
            {label}
          </div>
        ))}
      </div>
    </MockCard>
  );
}

/** 06: live numbers and a trend line. Values are illustrative. */
const STATS: { label: string; value: string; dot: string }[] = [
  { label: "Clicks", value: "12,450", dot: "bg-blue-500" },
  { label: "Sign-Ups", value: "3,248", dot: "bg-emerald-500" },
  { label: "Verified", value: "3,120", dot: "bg-violet-600" },
];

const TREND: [number, number][] = [
  [6, 68], [36, 52], [66, 56], [96, 40], [126, 54], [156, 34], [186, 30], [216, 36], [246, 24], [274, 16],
];

function TrackCard() {
  const line = TREND.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `6,80 ${line} 274,80`;
  return (
    <MockCard>
      <div className="grid grid-cols-3 gap-2">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </p>
            <p className="mt-1 text-[1.05rem] font-bold tabular-nums text-[#0A2150]">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="relative mt-3 rounded-xl bg-[#F3F8FF] px-2 pb-2 pt-3">
        <svg viewBox="0 0 280 84" className="h-24 w-full" role="presentation">
          <defs>
            <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity="0.22" />
              <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={area} fill="url(#trendFill)" />
          <polyline points={line} fill="none" stroke={ACCENT} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {[1, 3, 5, 7, 9].map((i) => (
            <circle key={i} cx={TREND[i][0]} cy={TREND[i][1]} r="3.2" fill="#fff" stroke={ACCENT} strokeWidth="2" />
          ))}
        </svg>
        <span className="absolute bottom-2 right-2 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500">
          Illustrative
        </span>
      </div>
    </MockCard>
  );
}

/** 07: earnings status chain and the two withdrawal options. */
const PAYOUT_FLOW: { label: string; icon: LucideIcon; tone: string }[] = [
  { label: "Pending", icon: Clock, tone: "bg-blue-100 text-blue-600" },
  { label: "Verified", icon: Check, tone: "bg-emerald-100 text-emerald-600" },
  { label: "Payable", icon: Wallet, tone: "bg-violet-100 text-violet-600" },
  { label: "Withdrawn", icon: Check, tone: "bg-emerald-500 text-white" },
];

function PayoutCard() {
  return (
    <MockCard>
      <div className="flex items-start justify-between">
        {PAYOUT_FLOW.map(({ label, icon, tone }, i) => (
          <div key={label} className="flex flex-1 items-start">
            <div className="flex flex-1 flex-col items-center gap-2 text-[12px] font-semibold text-[#0A2150]">
              <IconDisc icon={icon} className={tone} size={19} />
              {label}
            </div>
            {i < PAYOUT_FLOW.length - 1 ? (
              <ChevronRight size={16} className="mt-3 shrink-0 text-slate-300" />
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <span className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#0A5FCF] px-2 text-[12.5px] font-semibold text-white">
          <Zap size={14} />
          Instant Withdrawal
        </span>
        <span className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[#0A5FCF] bg-white px-2 text-[12.5px] font-semibold text-[#0A5FCF]">
          <CalendarDays size={14} />
          Scheduled Withdrawal
        </span>
      </div>
    </MockCard>
  );
}

/* ——— Steps (the order and wording come from the JobOrio design) ——— */

const STEPS: { title: string; text: ReactNode; card: ReactNode }[] = [
  {
    title: "Choose Creator or Publisher",
    text: (
      <>
        <span className="block">Creator: promote to your own audience.</span>
        <span className="block">Publisher: distribute through your website, community or network.</span>
      </>
    ),
    card: <RoleCard />,
  },
  {
    title: "Create Your Profile",
    text: "Set up your account and verify your social channels, website or community.",
    card: <ProfileCard />,
  },
  {
    title: "Choose Your Audience Type",
    text: "Select the audience you reach so JobOrio can match relevant campaigns.",
    card: <AudienceCard />,
  },
  {
    title: "Pick Relevant Campaigns",
    text: "Review campaign details and reward before sharing.",
    card: <CampaignTypesCard />,
  },
  {
    title: "Share Across Your Platforms",
    text: "Use your unique tracking links across the channels your audience trusts.",
    card: <PlatformsCard />,
  },
  {
    title: "Track Performance Live",
    text: "Monitor verified clicks, sign-ups and conversions with duplicate-click filtering.",
    card: <TrackCard />,
  },
  {
    title: "Earn & Withdraw Payouts",
    text: "Earnings move from Pending to Verified to Payable, then Instant or Scheduled Withdrawal.",
    card: <PayoutCard />,
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
            How it works
            <span aria-hidden="true" className="h-px w-6 bg-violet-400" />
          </p>
          <h2
            id="creator-solution-title"
            className={`text-section-heading mx-auto mt-4 max-w-3xl ${NAVY}`}
          >
            Turn your audience into income. One link. Verified pay.
          </h2>
          <p className="text-section-copy mx-auto mt-4">
            From choosing the right opportunity to getting paid, manage every step with JobOrio.
          </p>
        </div>

        <div ref={wrapRef} className="relative mt-12 md:mt-16">
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
                  className="relative py-8 pl-14 md:py-12 md:pl-0"
                >
                  <span
                    ref={(el) => {
                      nodeRefs.current[i] = el;
                    }}
                    aria-hidden="true"
                    className={`absolute left-5 top-12 z-10 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border text-[12px] font-semibold tabular-nums transition-all duration-300 motion-reduce:transition-none md:left-1/2 md:top-1/2 md:-translate-y-1/2 ${
                      isActive
                        ? "scale-105 border-[#0A5FCF] bg-[#0A5FCF] text-white shadow-[0_10px_24px_-6px_rgba(10,95,207,0.55)] ring-[10px] ring-[#0A5FCF]/20"
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
                      <h3 className={`text-balance text-[1.6rem] font-semibold leading-tight tracking-tight md:text-[1.9rem] ${NAVY}`}>
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