"use client";

// Images: /public/images/how-it-works/step-01.png … step-06.png
// Sticky stack: heading scrolls away; only the 6 cards use position:sticky.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import SectionHeading from "@/components/layout/SectionHeading";

type Theme = {
  card: string;
  ring: string;
  chip: string;
  panel: string;
  glow: string;
  num: string;
  check: string;
  dot: string;
};

type Step = {
  step: string;
  title: string;
  description: string;
  points: [string, string];
  time: string;
  image: string;
  alt: string;
  theme: Theme;
};

const themes: Record<string, Theme> = {
  violet: {
    card: "from-[#F7F3FF] to-[#EBE4FF]",
    ring: "ring-violet-200/70",
    chip: "bg-violet-600 text-white",
    panel: "from-violet-200/80 via-violet-100/60 to-white",
    glow: "bg-violet-400/30",
    num: "text-violet-600/[0.07]",
    check: "bg-violet-600",
    dot: "bg-violet-600",
  },
  sky: {
    card: "from-[#F1F9FF] to-[#DFF0FF]",
    ring: "ring-sky-200/70",
    chip: "bg-sky-600 text-white",
    panel: "from-sky-200/80 via-sky-100/60 to-white",
    glow: "bg-sky-400/30",
    num: "text-sky-600/[0.07]",
    check: "bg-sky-600",
    dot: "bg-sky-600",
  },
  pink: {
    card: "from-[#FFF3FA] to-[#FFE3F2]",
    ring: "ring-pink-200/70",
    chip: "bg-pink-600 text-white",
    panel: "from-pink-200/80 via-pink-100/60 to-white",
    glow: "bg-pink-400/30",
    num: "text-pink-600/[0.07]",
    check: "bg-pink-600",
    dot: "bg-pink-600",
  },
  emerald: {
    card: "from-[#F0FCF6] to-[#DAF6E8]",
    ring: "ring-emerald-200/70",
    chip: "bg-emerald-600 text-white",
    panel: "from-emerald-200/80 via-emerald-100/60 to-white",
    glow: "bg-emerald-400/30",
    num: "text-emerald-600/[0.07]",
    check: "bg-emerald-600",
    dot: "bg-emerald-600",
  },
  amber: {
    card: "from-[#FFF9EC] to-[#FFEFCC]",
    ring: "ring-amber-200/70",
    chip: "bg-amber-600 text-white",
    panel: "from-amber-200/80 via-amber-100/60 to-white",
    glow: "bg-amber-400/30",
    num: "text-amber-600/[0.08]",
    check: "bg-amber-600",
    dot: "bg-amber-600",
  },
  indigo: {
    card: "from-[#F2F3FF] to-[#E1E4FF]",
    ring: "ring-indigo-200/70",
    chip: "bg-indigo-600 text-white",
    panel: "from-indigo-200/80 via-indigo-100/60 to-white",
    glow: "bg-indigo-400/30",
    num: "text-indigo-600/[0.07]",
    check: "bg-indigo-600",
    dot: "bg-indigo-600",
  },
};

const steps: Step[] = [
  {
    step: "01",
    title: "Sign up & build your profile",
    description:
      "Create your account, pick your interests and connect your social accounts. It takes less than two minutes.",
    points: ["Free to join, no hidden fees", "Connect Instagram, YouTube & more"],
    time: "2 min",
    image: "/images/how-it-works/step-01.png",
    alt: "Creator profile card with social icons and a laptop",
    theme: themes.violet,
  },
  {
    step: "02",
    title: "Get verified as a creator",
    description:
      "A quick profile check tells brands you are real, so you get access to better and higher paying campaigns.",
    points: ["Verified badge on your profile", "Priority access to top campaigns"],
    time: "24 hrs",
    image: "/images/how-it-works/step-02.png",
    alt: "Verified creator shield with checklist",
    theme: themes.sky,
  },
  {
    step: "03",
    title: "Discover opportunities",
    description:
      "Browse campaigns, jobs and courses matched to your audience and niche, all in one place.",
    points: ["Matched to your interests", "New opportunities added daily"],
    time: "Anytime",
    image: "/images/how-it-works/step-03.png",
    alt: "Brand collaboration opportunities list",
    theme: themes.pink,
  },
  {
    step: "04",
    title: "Apply in one tap",
    description:
      "Pick what fits you, send your application and track its status live from your dashboard.",
    points: ["One-tap applications", "Real-time status updates"],
    time: "1 min",
    image: "/images/how-it-works/step-04.png",
    alt: "Creator with laptop and application sent badge",
    theme: themes.emerald,
  },
  {
    step: "05",
    title: "Share & create content",
    description:
      "Post using your unique link. Every click and every apply is tracked, so you always know what works.",
    points: ["Unique tracking link", "Live clicks and apply stats"],
    time: "Your pace",
    image: "/images/how-it-works/step-05.png",
    alt: "Creator with phone tripod and content performance stats",
    theme: themes.amber,
  },
  {
    step: "06",
    title: "Earn & withdraw",
    description:
      "Watch your earnings grow with every successful hire and cash out straight to your bank or UPI.",
    points: ["Transparent earnings report", "Fast payouts to UPI / bank"],
    time: "Weekly",
    image: "/images/how-it-works/step-06.png",
    alt: "Total earnings chart with coins",
    theme: themes.indigo,
  },
];

/** Extra px each next card sticks below the previous (shows edges of cards behind). */
const STACK_STEP = 28;
/** Gap below fixed navbar when a card sticks. */
const NAV_GAP = 16;
/** Approx scrolled navbar height (h-16). */
const NAV_H = 64;

/* ------------------------------------------------------------------ */
/*  Fallback art                                                       */
/* ------------------------------------------------------------------ */

function StepArt({ n, alt }: { n: number; alt: string }) {
  return (
    <svg viewBox="0 0 240 180" role="img" aria-label={alt} className="h-full w-full">
      <ellipse cx="120" cy="168" rx="86" ry="8" fill="#6D3FE0" opacity=".08" />
      {n === 0 && (
        <>
          <rect x="52" y="22" width="136" height="132" rx="18" fill="#fff" stroke="#DDD3FB" strokeWidth="2" />
          <circle cx="120" cy="62" r="22" fill="url(#hw-a)" />
          <circle cx="120" cy="56" r="8" fill="#fff" opacity=".9" />
          <path d="M106 78c3-9 25-9 28 0" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" opacity=".9" />
          <rect x="84" y="96" width="72" height="8" rx="4" fill="#E7DFFD" />
          <rect x="98" y="110" width="44" height="6" rx="3" fill="#F1EDFE" />
          <circle cx="94" cy="134" r="9" fill="#F25ECA" />
          <circle cx="120" cy="134" r="9" fill="#2563EB" />
          <circle cx="146" cy="134" r="9" fill="#34D399" />
        </>
      )}
      {n === 1 && (
        <>
          <path d="M120 18l50 18v40c0 34-21 58-50 70-29-12-50-36-50-70V36l50-18z" fill="url(#hw-a)" />
          <path d="M96 80l17 17 31-33" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <rect x="30" y="112" width="52" height="30" rx="8" fill="#fff" stroke="#DDD3FB" strokeWidth="2" />
          <path d="M40 122l4 4 7-8" stroke="#34D399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <rect x="56" y="123" width="18" height="5" rx="2.5" fill="#E7DFFD" />
          <rect x="158" y="112" width="52" height="30" rx="8" fill="#fff" stroke="#DDD3FB" strokeWidth="2" />
          <path d="M168 122l4 4 7-8" stroke="#34D399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <rect x="184" y="123" width="18" height="5" rx="2.5" fill="#E7DFFD" />
        </>
      )}
      {n === 2 && (
        <>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(0 ${i * 44})`}>
              <rect x="40" y="20" width="160" height="38" rx="12" fill="#fff" stroke="#DDD3FB" strokeWidth="2" />
              <rect x="50" y="29" width="20" height="20" rx="6" fill={["#7C3AED", "#2563EB", "#F25ECA"][i]} />
              <rect x="80" y="30" width="62" height="6" rx="3" fill="#E7DFFD" />
              <rect x="80" y="42" width="40" height="5" rx="2.5" fill="#F1EDFE" />
              <rect x="158" y="31" width="32" height="16" rx="8" fill="#DDF6EC" />
              <path d="M168 39l4 4 8-8" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" transform="translate(-3 0)" />
            </g>
          ))}
        </>
      )}
      {n === 3 && (
        <>
          <rect x="78" y="14" width="84" height="148" rx="16" fill="#fff" stroke="#DDD3FB" strokeWidth="3" />
          <rect x="108" y="20" width="24" height="4" rx="2" fill="#E7DFFD" />
          <rect x="90" y="50" width="60" height="30" rx="10" fill="url(#hw-a)" />
          <path d="M108 65h24M122 59l6 6-6 6" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <rect x="90" y="92" width="60" height="8" rx="4" fill="#E7DFFD" />
          <rect x="90" y="106" width="40" height="6" rx="3" fill="#F1EDFE" />
          <circle cx="178" cy="46" r="20" fill="#34D399" />
          <path d="M168 46l7 7 11-13" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="58" cy="112" r="13" fill="#F25ECA" />
          <path d="M52 112h12M59 107l5 5-5 5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      )}
      {n === 4 && (
        <>
          <rect x="36" y="22" width="168" height="128" rx="18" fill="#fff" stroke="#DDD3FB" strokeWidth="2" />
          {[44, 62, 52, 80, 70, 96].map((h, i) => (
            <rect key={i} x={54 + i * 24} y={134 - h} width="14" height={h} rx="5" fill={i === 5 ? "url(#hw-a)" : "#E7DFFD"} />
          ))}
          <path d="M60 100l24-14 24 6 24-24 24 8 20-24" stroke="#F25ECA" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <rect x="146" y="30" width="48" height="22" rx="11" fill="#DDF6EC" />
          <text x="170" y="45" textAnchor="middle" fontSize="12" fontWeight="700" fill="#059669">+32%</text>
        </>
      )}
      {n === 5 && (
        <>
          <rect x="30" y="30" width="110" height="110" rx="18" fill="#fff" stroke="#DDD3FB" strokeWidth="2" />
          <path d="M44 120l24-20 20 10 28-34 14 6" stroke="#7C3AED" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <rect x="44" y="46" width="52" height="8" rx="4" fill="#E7DFFD" />
          <rect x="44" y="60" width="32" height="6" rx="3" fill="#F1EDFE" />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <ellipse cx="180" cy={138 - i * 14} rx="30" ry="11" fill="#FFAD6D" />
              <ellipse cx="180" cy={134 - i * 14} rx="30" ry="11" fill="#FFC98F" />
            </g>
          ))}
          <circle cx="180" cy="72" r="22" fill="#FFC98F" stroke="#FFAD6D" strokeWidth="4" />
          <text x="180" y="81" textAnchor="middle" fontSize="24" fontWeight="800" fill="#C2701F">₹</text>
        </>
      )}
      <defs>
        <linearGradient id="hw-a" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#7C3AED" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function StepImage({ item, index }: { item: Step; index: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <StepArt n={index} alt={item.alt} />;
  return (
    <Image
      src={item.image}
      alt={item.alt}
      fill
      sizes="(min-width: 768px) 45vw, 90vw"
      onError={() => setFailed(true)}
      className="object-contain"
    />
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Card                                                               */
/* ------------------------------------------------------------------ */

function StepCard({
  item,
  index,
  sticky,
  reduceMotion,
  cardRef,
}: {
  item: Step;
  index: number;
  sticky: boolean;
  reduceMotion: boolean | null;
  cardRef?: (el: HTMLElement | null) => void;
}) {
  const imageOnLeft = index % 2 === 1;
  const t = item.theme;
  const top = NAV_H + NAV_GAP + index * STACK_STEP;
  const maxH = `calc(100svh - ${NAV_H + NAV_GAP + index * STACK_STEP + 12}px)`;

  return (
    <article
      ref={cardRef}
      data-step-card
      data-step-index={index}
      className={`relative w-full ${sticky ? "sticky" : "relative"} ${sticky && !reduceMotion ? "" : ""}`}
      style={{
        top: sticky ? top : undefined,
        zIndex: sticky ? index + 1 : undefined,
      }}
    >
      <div
        className={`group relative flex w-full flex-col overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-br ${t.card} px-5 py-6 shadow-[0_-14px_40px_-14px_rgba(60,30,160,0.28)] ring-1 ring-inset ${t.ring} sm:rounded-[32px] sm:px-8 sm:py-8 md:px-10 md:py-10`}
        style={{
          maxHeight: sticky ? maxH : undefined,
        }}
      >
        <span
          aria-hidden
          className={`pointer-events-none absolute -top-6 select-none text-[140px] font-extrabold leading-none tracking-tighter sm:text-[200px] md:text-[240px] ${t.num} ${
            imageOnLeft ? "right-2 md:right-8" : "right-2 md:left-6 md:right-auto"
          }`}
        >
          {item.step}
        </span>

        {/* Mobile: image on top. md+: side by side (compact). lg+: roomy. */}
        <div
          className={`relative flex min-h-0 flex-1 flex-col gap-5 md:items-center md:gap-8 lg:gap-12 ${
            imageOnLeft ? "md:flex-row-reverse" : "md:flex-row"
          }`}
        >
          {/* Image first in DOM so on mobile it sits above text */}
          <div
            className={`relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-[22px] bg-gradient-to-br ${t.panel} ring-1 ring-white/80 sm:rounded-[28px] md:aspect-auto md:h-56 md:w-1/2 lg:h-72`}
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(60,30,160,0.18)_1px,transparent_1.5px)] [background-size:16px_16px]"
            />
            <div aria-hidden className={`absolute -bottom-10 -right-10 h-40 w-40 rounded-full blur-3xl ${t.glow}`} />
            <div className="relative h-full w-full p-4 sm:p-5">
              <StepImage item={item} index={index} />
            </div>
          </div>

          <div className="min-w-0 w-full md:w-1/2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-block rounded-full px-4 py-1.5 text-sm font-semibold shadow-sm sm:px-5 sm:py-2 sm:text-base ${t.chip}`}>
                Step {item.step}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-[#55556B] ring-1 ring-black/5 sm:px-3.5 sm:py-2 sm:text-sm">
                <ClockIcon />
                {item.time}
              </span>
            </div>

            <h3 className="text-section-heading mt-4 max-w-[22ch] sm:mt-5">
              {item.title}
            </h3>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[#5E5E74] sm:mt-4 sm:text-base sm:leading-7 md:text-lg md:leading-8">
              {item.description}
            </p>

            <ul className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
              {item.points.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm font-medium text-[#2A2A40] sm:items-center sm:gap-3 sm:text-base">
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white sm:mt-0 sm:h-6 sm:w-6 ${t.check}`}>
                    <CheckIcon />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Section                                                            */
/* ------------------------------------------------------------------ */

export default function HowItWorks() {
  const stackRef = useRef<HTMLDivElement>(null);
  const cardEls = useRef<(HTMLElement | null)[]>([]);
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [useSticky, setUseSticky] = useState(true);

  const setCardRef = useCallback((index: number) => (el: HTMLElement | null) => {
    cardEls.current[index] = el;
  }, []);

  /** Disable sticky when a card won't fit in the sticky viewport (esp. mobile). */
  useEffect(() => {
    const measure = () => {
      if (reduceMotion) {
        setUseSticky(false);
        return;
      }
      const available =
        window.innerHeight - NAV_H - NAV_GAP - (steps.length - 1) * STACK_STEP - 24;
      let tooTall = false;
      for (const el of cardEls.current) {
        if (!el) continue;
        const inner = el.firstElementChild as HTMLElement | null;
        // Temporarily ignore max-height clamp for measurement
        const prev = inner?.style.maxHeight;
        if (inner) inner.style.maxHeight = "none";
        const h = inner?.scrollHeight ?? el.offsetHeight;
        if (inner) inner.style.maxHeight = prev ?? "";
        if (h > available + 48) {
          tooTall = true;
          break;
        }
      }
      setUseSticky(!tooTall);
    };

    const raf = requestAnimationFrame(() => requestAnimationFrame(measure));
    window.addEventListener("resize", measure);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    cardEls.current.forEach((el) => el && ro?.observe(el));
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, [reduceMotion]);

  /** Update 01 / 06 from which sticky card is currently “on top”. */
  useEffect(() => {
    const onScroll = () => {
      const pivot = NAV_H + NAV_GAP + 8;
      let current = 0;
      cardEls.current.forEach((el, i) => {
        if (!el) return;
        const top = el.getBoundingClientRect().top;
        if (top <= pivot + i * STACK_STEP + 4) current = i;
      });
      setActive((prev) => (prev === current ? prev : current));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [useSticky]);

  const progress = (active + 1) / steps.length;

  return (
    // No overflow-y / overflow:hidden on parents — sticky would break
    <section id="how-it-works" className="section-pad relative bg-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 bottom-0 h-[420px] w-[420px] rounded-full bg-[#ECE8FF] opacity-60 blur-3xl"
      />

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* Heading: normal document flow — scrolls away, never sticky */}
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <SectionHeading
            className="min-w-0 max-w-xl"
            eyebrow={
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                Your path to earning
              </span>
            }
            title="How it Works?"
            description="Six simple steps turn every useful share into measurable impact and meaningful earnings."
          />

          <div className="flex flex-wrap items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-3">
            <div
              className="flex items-center gap-1.5"
              aria-label={`Step ${active + 1} of ${steps.length}`}
              aria-live="polite"
            >
              {steps.map((s, i) => (
                <span
                  key={s.step}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === active
                      ? `w-7 ${s.theme.dot}`
                      : i < active
                        ? "w-2 bg-violet-300"
                        : "w-2 bg-slate-200"
                  }`}
                />
              ))}
              <span className="ml-2 text-sm font-semibold tabular-nums text-[#6B6B80]">
                {String(active + 1).padStart(2, "0")} /{" "}
                {String(steps.length).padStart(2, "0")}
              </span>
            </div>
            <Link
              href="/opportunities"
              className="text-sm font-semibold text-[#5B35D5] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5B35D5]"
            >
              View all opportunities →
            </Link>
          </div>
        </div>

        {/* Progress bar (non-sticky, sits under heading until cards take over) */}
        <div
          aria-hidden
          className="mb-6 h-[3px] overflow-hidden rounded-full bg-violet-100 sm:mb-8"
        >
          <div
            className="h-full origin-left rounded-full bg-gradient-to-r from-violet-600 via-pink-500 to-sky-500 transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Stacking cards — sticky when it fits; else normal vertical list */}
        <div ref={stackRef} className="relative flex flex-col">
          {steps.map((item, i) => (
            <div
              key={item.step}
              className={
                useSticky
                  ? i < steps.length - 1
                    ? "pb-[min(42vh,22rem)]" // scroll runway so the next card can climb over
                    : "pb-6 sm:pb-10"
                  : "mb-6 sm:mb-8"
              }
            >
              <StepCard
                item={item}
                index={i}
                sticky={useSticky}
                reduceMotion={reduceMotion}
                cardRef={setCardRef(i)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
