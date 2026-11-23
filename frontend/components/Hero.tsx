"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";

/* Image path fallbacks: pehla fail ho to agla try hoga */
const HERO_SOURCES = ["/images/hero-img.png"];

/*
  IMPORTANT: yahan apni image file ke ASLI pixel dimensions daalo
  (file ka right click > properties/info). Sirf aspect ratio ke liye use hota hai.
*/
const HERO_W = 1222;
const HERO_H = 1692;

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

const Arrow = () => (
  <svg
    className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/* Static social icon. x / y = center point in % of the stage (placed on the orbit ring) */
function Bubble({
  x,
  y,
  className,
  children,
}: {
  x: number;
  y: number;
  className: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{ left: `${x}%`, top: `${y}%` }}
      className={`absolute z-20 flex aspect-square w-[8.5%] min-w-[28px] max-w-[52px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}

const w = {
  fill: "none",
  stroke: "white",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

export default function Hero() {
  const [srcIdx, setSrcIdx] = useState(0);

  return (
    <section className="hero-section relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[linear-gradient(135deg,#0B1D4F_0%,#14296B_45%,#3F2AA8_100%)] pt-[var(--nav-h,80px)] text-white min-[993px]:h-[100svh] min-[993px]:min-h-[440px]">
      <style>{`
        /* Typography: mobile/tab = width based, desktop = width + height based (100svh me fit) */
        .hero-section {
          --hero-h1: clamp(1.75rem, 6.6vw, 3.25rem);
          --hero-p: clamp(0.95rem, 2.6vw, 1.2rem);
        }
        @media (min-width: 993px) {
          .hero-section {
            --hero-h1: clamp(2rem, min(3.4vw, 6vh), 3.9rem);
            --hero-p: clamp(0.9rem, min(1.5vw, 2.4vh), 1.25rem);
          }
        }

        /* Animations: only the orbit dot + jelly circles */
        @keyframes hero-orbit {
          to { transform: rotate(360deg); }
        }
        @keyframes hero-jelly-a {
          0%, 100% { transform: scale(1, 1); border-radius: 50%; }
          20% { transform: scale(1.05, 0.95); border-radius: 52% 48% 50% 50% / 47% 53% 50% 50%; }
          40% { transform: scale(0.96, 1.05); border-radius: 48% 52% 51% 49% / 53% 47% 50% 50%; }
          60% { transform: scale(1.03, 0.97); border-radius: 51% 49% 48% 52% / 49% 51% 52% 48%; }
          80% { transform: scale(0.99, 1.02); border-radius: 49% 51% 52% 48% / 51% 49% 48% 52%; }
        }
        @keyframes hero-jelly-b {
          0%, 100% { transform: scale(1, 1); border-radius: 50%; }
          25% { transform: scale(0.96, 1.04); border-radius: 48% 52% 50% 50% / 52% 48% 51% 49%; }
          50% { transform: scale(1.05, 0.95); border-radius: 52% 48% 49% 51% / 48% 52% 50% 50%; }
          75% { transform: scale(0.98, 1.03); border-radius: 50% 50% 52% 48% / 51% 49% 49% 51%; }
        }
        .hero-orbit { animation: hero-orbit 14s linear infinite; }
        .hero-jelly-a { animation: hero-jelly-a 5s ease-in-out infinite; transform-origin: 50% 100%; }
        .hero-jelly-b { animation: hero-jelly-b 6.5s ease-in-out infinite; transform-origin: 50% 100%; }
        @media (prefers-reduced-motion: reduce) {
          .hero-orbit, .hero-jelly-a, .hero-jelly-b { animation: none; }
        }
      `}</style>

      {/* ---------- Background ---------- */}
      <div className="pointer-events-none absolute -right-40 top-1/3 hidden h-[min(600px,70vw)] w-[min(600px,70vw)] rounded-full bg-violet-600/30 blur-3xl sm:block" />
      <div className="pointer-events-none absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full bg-sky-500/15 blur-3xl" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.16)_1px,transparent_1.5px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_at_25%_45%,black,transparent_70%)]"
      />
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 max-h-[70%] max-w-[min(1183px,100%)]"
        width="1183"
        height="704"
        viewBox="0 0 1183 704"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g opacity="0.82">
          <path d="M1131.75 232.398C1205.86 104.048 1369.98 60.0721 1498.33 134.175V134.175C1626.68 208.278 1670.65 372.398 1596.55 500.747L1376.99 881.034C1302.89 1009.38 1138.77 1053.36 1010.42 979.257V979.257C882.068 905.154 838.092 741.034 912.195 612.684L1131.75 232.398Z" fill="url(#paint0_linear_2007_1436)" />
        </g>
        <g opacity="0.9">
          <path d="M22.7168 896.957C10.1707 753.553 116.251 627.131 259.655 614.585L679.811 577.826C823.215 565.28 949.637 671.361 962.183 814.764L964.581 842.168L25.1144 924.361L22.7168 896.957Z" fill="url(#paint1_linear_2007_1436)" />
        </g>
        <g opacity="0.82">
          <path d="M1052.85 341.015C1112.52 237.648 1244.7 202.232 1348.07 261.911V261.911C1451.43 321.59 1486.85 453.765 1427.17 557.132L1250.35 863.398C1190.67 966.765 1058.49 1002.18 955.127 942.502V942.502C851.76 882.823 816.344 750.648 876.023 647.281L1052.85 341.015Z" fill="url(#paint2_linear_2007_1436)" />
        </g>
        <g opacity="0.82">
          <path d="M1130.08 286.466C1195.35 173.411 1339.92 134.675 1452.97 199.948V199.948C1566.03 265.22 1604.76 409.784 1539.49 522.839L1346.1 857.81C1280.82 970.866 1136.26 1009.6 1023.2 944.329V944.329C910.149 879.056 871.413 734.493 936.686 621.438L1130.08 286.466Z" fill="url(#paint3_linear_2007_1436)" />
        </g>
        <defs>
          <linearGradient id="paint0_linear_2007_1436" x1="1498.33" y1="134.175" x2="1010.42" y2="979.257" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1D4EB8" />
            <stop offset="1" stopColor="#9635EC" />
          </linearGradient>
          <linearGradient id="paint1_linear_2007_1436" x1="10.343" y1="755.523" x2="773.714" y2="1111.29" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5535D4" />
            <stop offset="0.48" stopColor="#F47BD2" />
            <stop offset="0.7" stopColor="#FFAD6D" />
            <stop offset="1" stopColor="#2D5EE7" />
          </linearGradient>
          <linearGradient id="paint2_linear_2007_1436" x1="1348.07" y1="261.911" x2="955.127" y2="942.502" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1D4EB8" />
            <stop offset="1" stopColor="#9635EC" />
          </linearGradient>
          <linearGradient id="paint3_linear_2007_1436" x1="1452.97" y1="199.948" x2="1023.2" y2="944.329" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1D4EB8" />
            <stop offset="1" stopColor="#9635EC" />
          </linearGradient>
        </defs>
      </svg>

      {/* ---------- Layout grid ----------
          0 - 992px : 1 column (text, phir visual + cards), kuch hide nahi
          993px+    : 2 columns, 100svh me fit                              */}
      <div className="relative mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 items-center gap-8 px-4 pb-10 pt-4 sm:px-8 sm:pb-12 min-[993px]:h-full min-[993px]:min-h-0 min-[993px]:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] min-[993px]:grid-rows-1 min-[993px]:gap-8 min-[993px]:px-10 min-[993px]:py-4 xl:gap-12">
        {/* ---------- Left: content ---------- */}
        <div className="relative z-10 w-full min-w-0 self-center">
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm sm:gap-3 sm:px-4 sm:py-2 [@media(min-width:993px)_and_(max-height:620px)]:hidden">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
            <span className="text-eyebrow leading-snug text-slate-200">
              The marketplace built for modern creators
            </span>
          </div>

          <h1
            className="text-page-hero mt-4 min-[993px]:mt-5"
            style={{ fontSize: "var(--hero-h1)" }}
          >
            Your audience has value.
            <span className="mt-1 block bg-gradient-to-r from-[#D8B4FE] via-[#A78BFA] to-[#D8B4FE] bg-clip-text text-transparent">
              Make every useful share count.
            </span>
          </h1>

          <p
            className="text-section-copy mt-4 w-full max-w-none text-slate-200/90 min-[993px]:mt-5 min-[993px]:max-w-[34rem]"
            style={{ fontSize: "var(--hero-p)" }}
          >
            Share trusted jobs, courses, campaigns and opportunities with your community. Track real results. Get paid.
          </p>

          {/* Buttons: chhoti screen pe wrap hote hain, kat-te nahi */}
          <div className="mt-5 flex flex-wrap gap-3 min-[993px]:mt-7 min-[993px]:flex-nowrap min-[993px]:gap-4">
            <Link
              href="/signup"
              className="btn-tap group inline-flex h-12 min-w-[150px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB] px-5 text-sm font-semibold shadow-lg shadow-indigo-900/40 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-8 sm:text-base min-[993px]:h-[52px] min-[993px]:flex-none min-[993px]:px-10"
            >
              Start Earning <Arrow />
            </Link>
            <Link
              href="/hiring"
              className="btn-tap group inline-flex h-12 min-w-[150px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-8 sm:text-base min-[993px]:h-[52px] min-[993px]:flex-none min-[993px]:px-10"
            >
              Lunch Campaigns <Arrow />
            </Link>
          </div>

          <div className="mt-6 flex items-center gap-3 min-[993px]:mt-7 min-[993px]:gap-4 [@media(min-width:993px)_and_(max-height:760px)]:hidden">
            <div className="flex -space-x-3">
              {["from-amber-400 to-rose-500", "from-sky-400 to-indigo-500", "from-emerald-400 to-teal-600"].map((g, i) => (
                <span
                  key={i}
                  className={`h-10 w-10 rounded-full border-2 border-[#14296B] bg-gradient-to-br sm:h-11 sm:w-11 ${g}`}
                />
              ))}
            </div>
            <div className="min-w-0">
              <p className="font-semibold">12,50+ active creators</p>
              <p className="text-sm text-slate-300">Growing and earning together</p>
            </div>
          </div>
        </div>

        {/* ---------- Right: visual ---------- */}
        {/* Cell: desktop pe container (size), mobile/tab pe normal flow */}
        <div className="relative flex w-full min-w-0 flex-col items-center min-[993px]:h-full min-[993px]:min-h-[160px] min-[993px]:flex-row min-[993px]:items-end min-[993px]:justify-center min-[993px]:self-stretch min-[993px]:[container-type:size]">
          {/* V: mobile = column (stage + cards) | desktop = square wrapper */}
          <div className="relative flex w-full flex-col items-center gap-4 min-[993px]:block min-[993px]:h-[min(100cqw,100cqh)] min-[993px]:w-[min(100cqw,100cqh)] min-[993px]:gap-0">
            {/* ===== Stage (square) ===== */}
            <div className="relative aspect-square w-full max-w-[520px] min-[993px]:absolute min-[993px]:inset-0 min-[993px]:aspect-auto min-[993px]:max-w-none">
              {/* Orbit ring + rotating dot */}
              <div className="absolute left-1/2 top-1/2 z-[1] aspect-square w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20">
                <div className="hero-orbit absolute inset-0">
                  <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_14px_3px_rgba(255,255,255,0.75)]" />
                </div>
              </div>

              {/* Jelly circles */}
              <div className="hero-jelly-b absolute bottom-0 right-[10%] aspect-square w-[78%] rounded-full bg-[linear-gradient(145deg,#F25ECA_8.8%,#FF9775_57%,#FFB16C_93.8%)] opacity-60" />
              <div className="hero-jelly-a absolute bottom-[5%] right-[10%] z-[1] aspect-square w-[78%] rounded-full bg-[linear-gradient(145deg,#F25ECA_8.8%,#FF9775_57%,#FFB16C_93.8%)] shadow-[inset_0_-14px_30px_rgba(150,40,160,0.35),inset_0_10px_24px_rgba(255,255,255,0.25)]">
                <div className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_30%_22%,rgba(255,255,255,0.5),transparent_38%)]" />
              </div>

              {/* Human image */}
              <Image
                key={HERO_SOURCES[srcIdx]}
                src={HERO_SOURCES[srcIdx]}
                alt="Creator sharing an opportunity on her phone"
                width={HERO_W}
                height={HERO_H}
                priority
                unoptimized
                onError={() => setSrcIdx((i) => (i + 1 < HERO_SOURCES.length ? i + 1 : i))}
                className="absolute bottom-0 right-[8%] z-[2] h-full w-auto max-w-none object-contain object-bottom"
              />

              {/* Social icons (static, ring pe): sab screen pe visible */}
              <Bubble x={21.7} y={16.3} className="bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600">
                <svg className="h-[48%] w-[48%]" viewBox="0 0 24 24" {...w} strokeWidth={2.2}>
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.3" cy="6.7" r=".6" fill="white" />
                </svg>
              </Bubble>

              <Bubble x={7.5} y={38.6} className="bg-white">
                <svg className="h-[42%] w-[56%]" viewBox="0 0 40 30">
                  <rect width="40" height="30" rx="8" fill="#FF0000" />
                  <path d="M16 9l10 6-10 6z" fill="white" />
                </svg>
              </Bubble>

              <Bubble x={7.5} y={61.4} className="bg-sky-500">
                <svg className="h-[46%] w-[46%]" viewBox="0 0 24 24" fill="white">
                  <path d="M21 4L3 11l6 2 2 6 3-4 5 3L21 4z" />
                </svg>
              </Bubble>

              <Bubble x={18.9} y={81.1} className="bg-[#0A66C2]">
                <span className="text-xs font-bold leading-none sm:text-sm min-[993px]:text-base">in</span>
              </Bubble>

              <Bubble x={78.3} y={16.3} className="bg-black">
                <svg className="h-[48%] w-[48%]" viewBox="0 0 24 24" {...w} strokeWidth={2.6}>
                  <path d="M14 3v11a3.5 3.5 0 11-3.5-3.5M14 3c.4 2.4 2 4 4.5 4.2" />
                </svg>
              </Bubble>

              <Bubble x={91.3} y={35} className="bg-green-500">
                <svg className="h-[50%] w-[50%]" viewBox="0 0 24 24" {...w}>
                  <path d="M12 3a9 9 0 00-7.8 13.5L3 21l4.6-1.2A9 9 0 1012 3z" />
                  <path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8c-1-.4-2-1.4-2.4-2.4l.8-1-1-2-1.9.6z" fill="white" stroke="none" />
                </svg>
              </Bubble>
            </div>

            {/* ===== Cards =====
                0-992px  : stage ke neeche grid (mobile 2 col, tablet 3 col), sab visible
                993px+   : "contents", yani cards stage ke upar floating (absolute) */}
            <div className="grid w-full max-w-[560px] grid-cols-2 gap-3 md:max-w-[760px] md:grid-cols-3 min-[993px]:contents">
              {/* Monthly reach */}
              <div className="flex h-full items-center gap-3 rounded-xl bg-white/95 px-3 py-3 text-slate-900 shadow-lg sm:px-4 min-[993px]:absolute min-[993px]:right-[2%] min-[993px]:top-[1%] min-[993px]:z-[3] min-[993px]:h-auto [@media(min-width:993px)_and_(max-height:640px)]:hidden">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                  <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" {...w} stroke="currentColor">
                    <path d="M4 20V10M10 20V6M16 20v-8M22 20H2M15 4h5v5M20 4l-6 6" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-lg font-semibold leading-none">3.8M+</p>
                  <p className="mt-1 text-xs text-slate-500 min-[993px]:whitespace-nowrap">Monthly reach</p>
                </div>
              </div>

              {/* Share. Track. Earn. */}
              <div className="flex h-full items-center gap-3 rounded-xl bg-white/95 px-3 py-3 text-slate-900 shadow-lg sm:px-4 min-[993px]:absolute min-[993px]:bottom-[1%] min-[993px]:left-[2%] min-[993px]:z-[3] min-[993px]:h-auto min-[993px]:pr-5 [@media(min-width:993px)_and_(max-height:760px)]:hidden">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600">
                  <svg className="h-[16px] w-[16px]" viewBox="0 0 24 24" {...w}>
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4" />
                  </svg>
                </span>
                <div className="min-w-0 min-[993px]:whitespace-nowrap">
                  <p className="text-sm font-semibold">Share. Track. Earn.</p>
                  <p className="text-xs text-slate-500">One link, measurable results</p>
                </div>
              </div>

              {/* Top Creator */}
              <div className="order-first col-span-2 md:order-none md:col-span-1 min-[993px]:absolute min-[993px]:bottom-[3%] min-[993px]:right-0 min-[993px]:z-[4] min-[993px]:w-[clamp(170px,40%,270px)] [@media(min-width:993px)_and_(max-height:700px)]:hidden">
                <div className="h-full w-full rounded-2xl bg-white p-3.5 text-slate-900 shadow-xl">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#14296B]">👑 Top Creator</p>
                      <p className="ml-6 text-[10px] uppercase tracking-widest text-slate-400">This week</p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-violet-100 px-2 py-1 text-[11px] font-bold text-violet-700">
                      🔥 #1
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-base font-bold text-white ring-2 ring-pink-400 ring-offset-2">
                      S
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-[#14296B]">
                        Sneha Verma <span className="text-sky-500">●</span>
                      </p>
                      <p className="truncate text-[11px] text-slate-500">Career &amp; Job Updates</p>
                      <span className="mt-1 inline-block rounded-full bg-pink-500 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                        Top Creator
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-600">Total earnings this week</p>
                      <p className="text-xl font-bold text-[#14296B]">₹18,420</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      +32%
                    </span>
                  </div>

                  <div className="mt-3 flex justify-between gap-2 px-1 text-[11px]">
                    <div>
                      <p className="font-bold">1.2M</p>
                      <p className="text-slate-400">Views</p>
                    </div>
                    <div>
                      <p className="font-bold">89,248</p>
                      <p className="text-slate-400">Clicks</p>
                    </div>
                    <div>
                      <p className="font-bold">6</p>
                      <p className="text-slate-400">Campaigns</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}