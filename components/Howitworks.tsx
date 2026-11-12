"use client";

// Images: /public/images/how-it-works/step-01.png … step-06.png
// Sticky stack: heading scrolls away; each full-height card sticks and the next one slides over it.

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
    num: "text-violet-600/[0.10]",
    check: "bg-violet-600",
    dot: "bg-violet-600",
  },
  sky: {
    card: "from-[#F1F9FF] to-[#DFF0FF]",
    ring: "ring-sky-200/70",
    chip: "bg-sky-600 text-white",
    panel: "from-sky-200/80 via-sky-100/60 to-white",
    glow: "bg-sky-400/30",
    num: "text-sky-600/[0.10]",
    check: "bg-sky-600",
    dot: "bg-sky-600",
  },
  pink: {
    card: "from-[#FFF3FA] to-[#FFE3F2]",
    ring: "ring-pink-200/70",
    chip: "bg-pink-600 text-white",
    panel: "from-pink-200/80 via-pink-100/60 to-white",
    glow: "bg-pink-400/30",
    num: "text-pink-600/[0.10]",
    check: "bg-pink-600",
    dot: "bg-pink-600",
  },
  emerald: {
    card: "from-[#F0FCF6] to-[#DAF6E8]",
    ring: "ring-emerald-200/70",
    chip: "bg-emerald-600 text-white",
    panel: "from-emerald-200/80 via-emerald-100/60 to-white",
    glow: "bg-emerald-400/30",
    num: "text-emerald-600/[0.10]",
    check: "bg-emerald-600",
    dot: "bg-emerald-600",
  },
  amber: {
    card: "from-[#FFF9EC] to-[#FFEFCC]",
    ring: "ring-amber-200/70",
    chip: "bg-amber-600 text-white",
    panel: "from-amber-200/80 via-amber-100/60 to-white",
    glow: "bg-amber-400/30",
    num: "text-amber-600/[0.11]",
    check: "bg-amber-600",
    dot: "bg-amber-600",
  },
  indigo: {
    card: "from-[#F2F3FF] to-[#E1E4FF]",
    ring: "ring-indigo-200/70",
    chip: "bg-indigo-600 text-white",
    panel: "from-indigo-200/80 via-indigo-100/60 to-white",
    glow: "bg-indigo-400/30",
    num: "text-indigo-600/[0.10]",
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

/** Approx scrolled navbar height (h-16). */
const NAV_H = 64;
/** Each next sheet sticks this many px lower, so the rounded edges of earlier sheets peek out. */
const PEEK = 0;
/** Space kept free at the bottom of the viewport while a sheet is stuck. */
const BOTTOM_GAP = 8;

const stickyTop = (i: number) => NAV_H + i * PEEK;

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
  covered,
  cardRef,
}: {
  item: Step;
  index: number;
  /** true once a later sheet has climbed on top of this one */
  covered: boolean;
  cardRef?: (el: HTMLElement | null) => void;
}) {
  const imageRight = index % 2 === 1;
  const t = item.theme;

  return (
    <article
      ref={cardRef}
      data-step-card
      data-step-index={index}
      className="sticky w-full"
      style={{
        top: stickyTop(index),
        zIndex: index + 1,
        height: `calc(100svh - ${stickyTop(index) + BOTTOM_GAP}px)`,
        minHeight: 560,
      }}
    >
      <div
        className={`relative h-full w-full bg-gradient-to-br ${t.card}  transition-[filter] duration-500 motion-reduce:transition-none ${
          covered ? "brightness-[0.965]" : ""
        }`}
      >
        {/* Decorative background (clipped separately so content is never cut) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-t-[inherit]">
          <div className={`absolute -left-24 top-1/4 h-80 w-80 rounded-full blur-[90px] ${t.glow}`} />
          <div className={`absolute -right-24 bottom-0 h-96 w-96 rounded-full blur-[110px] ${t.glow}`} />
          <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(60,30,160,0.14)_1px,transparent_1.5px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        </div>

        <div className="relative mx-auto grid h-full max-w-[1400px] grid-rows-[minmax(0,1fr)_auto] gap-4 px-5 pb-6 pt-6 sm:px-8 sm:pb-8 sm:pt-8 md:grid-cols-2 md:grid-rows-1 md:items-center md:gap-10 md:px-12 lg:gap-20 lg:px-16">
          {/* Image */}
          <div className={`relative h-full min-h-[160px] md:h-[min(100%,560px)] ${imageRight ? "md:order-last" : ""}`}>
            <div aria-hidden className="absolute inset-[6%] rounded-full bg-gradient-to-br from-white/90 via-white/50 to-white/0 blur-[2px]" />
            <div aria-hidden className={`absolute inset-[20%] rounded-full blur-3xl ${t.glow}`} />
            <div className="relative h-full w-full transition-transform duration-500 ease-out hover:scale-[1.03] motion-reduce:transition-none">
              <StepImage item={item} index={index} />
            </div>

            <span className="absolute bottom-2 left-2 inline-flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-sm font-semibold text-[#2A2A40] shadow-[0_10px_30px_-10px_rgba(40,20,120,0.35)] backdrop-blur-md sm:bottom-4 sm:left-4">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${t.check}`}>
                <ClockIcon />
              </span>
              {item.time}
            </span>
          </div>

          {/* Copy */}
          <div className="relative min-w-0">
            <span
              aria-hidden
              className={`pointer-events-none absolute -top-6 left-0 select-none text-[110px] font-extrabold leading-none tracking-tighter sm:-top-10 sm:text-[170px] lg:text-[220px] ${t.num}`}
            >
              {item.step}
            </span>

            <div className="relative">
              <span className={`inline-block rounded-full px-5 py-2 text-sm font-semibold tracking-wide shadow-sm sm:text-base ${t.chip}`}>
                Step {item.step}
              </span>

              <h3 className="text-section-heading mt-4 max-w-[20ch] sm:mt-6">
                {item.title}
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#5E5E74] sm:mt-5 sm:text-base sm:leading-7 lg:text-lg lg:leading-8">
                {item.description}
              </p>

              <ul className="mt-5 grid gap-2.5 sm:mt-7 sm:gap-3 lg:max-w-lg">
                {item.points.map((p) => (
                  <li
                    key={p}
                    className="flex items-center gap-3 rounded-2xl bg-white/65 px-4 py-3 text-sm font-medium text-[#2A2A40] shadow-[0_8px_24px_-12px_rgba(40,20,120,0.25)] backdrop-blur-sm sm:text-base"
                  >
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${t.check}`}>
                      <CheckIcon />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
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
  const cardEls = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);

  const setCardRef = useCallback((index: number) => (el: HTMLElement | null) => {
    cardEls.current[index] = el;
  }, []);

  /** Update 01 / 06 from which sticky sheet is currently on top. */
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      let current = 0;
      cardEls.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= stickyTop(i) + 4) current = i;
      });
      setActive((prev) => (prev === current ? prev : current));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const progress = (active + 1) / steps.length;

  return (
    // No overflow-y / overflow:hidden on parents — sticky would break
    <section id="how-it-works" className="relative bg-white pt-16 md:pt-24">
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
        </div>
      </div>

      {/* Full-width sheets: every one is sticky + full height, the next slides over the previous */}
      <div className="relative flex flex-col">
        {steps.map((item, i) => (
          <StepCard
            key={item.step}
            item={item}
            index={i}
            covered={i < active}
            cardRef={setCardRef(i)}
          />
        ))}
      </div>
    </section>
  );
}
