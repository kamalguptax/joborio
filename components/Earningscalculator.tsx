"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import SectionHeading from "@/components/layout/SectionHeading";

/* ------------------------------------------------------------------ */
/*  Estimate settings                                                  */
/* ------------------------------------------------------------------ */

const BASE_FOLLOWERS = 10_000;
const BASE_EARNINGS = 19_800; // ₹ per month at BASE_FOLLOWERS
const EXPONENT = 0.95;
const CREATOR_KEEP = 0.75;
const PLATFORM_FEE = 0.25;

const TICKS = [1_000, 10_000, 100_000, 1_000_000, 2_000_000];
const TICK_LABELS = ["1K", "10K", "100K", "1M", "2M+"];
const THUMB = 24;

const inr = new Intl.NumberFormat("en-IN");

function followersAt(pct: number) {
  const p = Math.min(Math.max(pct, 0), 100) / 25;
  const i = Math.min(Math.floor(p), 3);
  const t = p - i;
  const a = Math.log10(TICKS[i]);
  const b = Math.log10(TICKS[i + 1]);
  const raw = Math.pow(10, a + (b - a) * t);
  const step =
    raw < 10_000 ? 100 : raw < 100_000 ? 1_000 : raw < 1_000_000 ? 10_000 : 50_000;
  return Math.round(raw / step) * step;
}

function earningsFor(followers: number) {
  return Math.round((BASE_EARNINGS * Math.pow(followers / BASE_FOLLOWERS, EXPONENT)) / 100) * 100;
}

function followersLabel(f: number) {
  return f >= 2_000_000 ? "2M+" : f.toLocaleString("en-US");
}

const thumbLeft = (p: number) =>
  `calc(${p * 100}% + ${(THUMB / 2 - THUMB * p).toFixed(2)}px)`;

function useSmooth(target: number, run: boolean) {
  const [v, setV] = useState(target);
  const cur = useRef(target);
  const started = useRef(false);

  useEffect(() => {
    if (!run) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!started.current) {
      started.current = true;
      if (!reduced) cur.current = 0;
    }
    let raf = 0;
    const tick = () => {
      cur.current = reduced ? target : cur.current + (target - cur.current) * 0.14;
      if (Math.abs(target - cur.current) < 0.5) cur.current = target;
      setV(cur.current);
      if (cur.current !== target) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);

  return v;
}

const reveal = (hidden: boolean) =>
  `transition-all duration-700 ease-out motion-reduce:transition-none ${
    hidden ? "translate-y-7 opacity-0" : "translate-y-0 opacity-100"
  }`;

function M({
  depth = 0,
  amp = 0,
  speed = 1,
  phase = 0,
  className,
  children,
}: {
  depth?: number;
  amp?: number;
  speed?: number;
  phase?: number;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-depth={depth}
      data-amp={amp}
      data-speed={speed}
      data-phase={phase}
      className={className}
    >
      {children}
    </div>
  );
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const features = [
  { title: "Use your audience", sub: "Turn followers into income", bg: "bg-emerald-500", icon: "users" },
  { title: "Explore opportunities", sub: "Jobs, campaigns & more", bg: "bg-violet-600", icon: "bolt" },
  { title: "Grow & earn", sub: "Bigger audience, bigger earnings", bg: "bg-pink-500", icon: "chart" },
  { title: "Track your progress", sub: "See real-time estimates", bg: "bg-sky-500", icon: "star" },
] as const;

function FeatureIcon({ name }: { name: (typeof features)[number]["icon"] }) {
  return (
    <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      {name === "users" && (
        <>
          <circle cx="12" cy="6.5" r="2.4" />
          <circle cx="5.5" cy="9.5" r="1.8" />
          <circle cx="18.5" cy="9.5" r="1.8" />
          <path d="M7.5 18c.6-2.8 2.2-4.2 4.5-4.2s3.9 1.4 4.5 4.2" />
        </>
      )}
      {name === "bolt" && <path d="M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z" fill="currentColor" />}
      {name === "chart" && <path d="M4 17l5-5 3 3 7-8M15 7h4v4" />}
      {name === "star" && (
        <path
          d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.7l5.9-.9L12 3.5z"
          fill="currentColor"
        />
      )}
    </svg>
  );
}

/* Chart sample points across the follower range (syncs highlight with slider %) */
function chartPoints(pct: number) {
  const samples = 7;
  return Array.from({ length: samples }, (_, i) => {
    const samplePct = (i / (samples - 1)) * 100;
    const f = followersAt(samplePct);
    const e = earningsFor(f);
    return {
      x: (i / (samples - 1)) * 100,
      earnings: e,
      active:
        Math.abs(samplePct - pct) <= 100 / (samples - 1) / 2 + 0.01 ||
        i === Math.round((pct / 100) * (samples - 1)),
      samplePct,
    };
  });
}

function EarningsVisual({
  pct,
  followers,
  earnings,
  shown,
  label,
  active,
}: {
  pct: number;
  followers: number;
  earnings: number;
  shown: number;
  label: string;
  active: boolean;
}) {
  const gid = useId().replace(/:/g, "");
  const points = useMemo(() => chartPoints(pct), [pct]);
  const maxEarn = Math.max(...points.map((p) => p.earnings), earnings, 1);
  const keep = Math.round(shown * CREATOR_KEEP);
  const fee = Math.round(shown * PLATFORM_FEE);

  // Engagement proxies that scale with audience
  const clicks = Math.max(120, Math.round(followers * 0.042));
  const applies = Math.max(8, Math.round(followers * 0.0018));
  const hires = Math.max(1, Math.round(followers * 0.00022));

  const pathLine = points
    .map((pt, i) => {
      const x = 20 + (pt.x / 100) * 280;
      const y = 118 - (pt.earnings / maxEarn) * 88;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const areaPath = `${pathLine} L300 128 L20 128 Z`;

  const highlightIdx = Math.min(
    points.length - 1,
    Math.max(0, Math.round((pct / 100) * (points.length - 1))),
  );
  const hx = 20 + (points[highlightIdx].x / 100) * 280;
  const hy = 118 - (points[highlightIdx].earnings / maxEarn) * 88;

  return (
    <div className="relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1B1464] via-[#2A1B7A] to-[#5B2BE0] p-5 text-white shadow-xl sm:min-h-[500px] sm:rounded-[32px] sm:p-6 lg:min-h-full">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-fuchsia-400/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-sky-400/20 blur-3xl"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200">
            Live estimate
          </p>
          <p className="mt-2 text-[clamp(1.75rem,5vw,2.25rem)] font-bold tabular-nums leading-none tracking-tight">
            ₹{inr.format(Math.round(shown))}
            <span className="ml-2 text-base font-medium text-violet-200">/ mo</span>
          </p>
          <p className="mt-2 text-sm text-violet-100/80">{label} followers</p>
        </div>
        <M depth={16} amp={4} speed={0.9} phase={1} className="shrink-0">
          <div className="rounded-full border border-emerald-300/40 bg-emerald-400/15 px-3 py-2 text-xs font-semibold text-emerald-200 shadow-lg shadow-emerald-900/20 backdrop-blur">
            ₹ credited to UPI
          </div>
        </M>
      </div>

      {/* Area / bar chart */}
      <div className="relative mt-5 flex-1 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm sm:p-4">
        <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-violet-200/80">
          <span>Earnings vs audience</span>
          <span>1K → 2M+</span>
        </div>
        <svg viewBox="0 0 320 140" className="h-auto w-full" role="img" aria-label="Earnings chart by audience size">
          <defs>
            <linearGradient id={`${gid}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${gid}-stroke`} x1="0" y1="0" x2="1" y2="0">
              <stop stopColor="#C4B5FD" />
              <stop offset="1" stopColor="#F0ABFC" />
            </linearGradient>
          </defs>

          {/* soft bars under the curve */}
          {points.map((pt, i) => {
            const x = 20 + (pt.x / 100) * 280;
            const h = (pt.earnings / maxEarn) * 88;
            const lit = i === highlightIdx;
            return (
              <rect
                key={i}
                x={x - 10}
                y={118 - h}
                width={20}
                height={h}
                rx={6}
                fill={lit ? "rgba(244,114,182,0.35)" : "rgba(167,139,250,0.12)"}
                className="transition-all duration-300"
              />
            );
          })}

          <path
            d={areaPath}
            fill={`url(#${gid}-fill)`}
            className="transition-all duration-300"
          />
          <path
            d={pathLine}
            fill="none"
            stroke={`url(#${gid}-stroke)`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            style={{
              strokeDashoffset: active ? 0 : 1,
              transition: "stroke-dashoffset 1.2s ease-out",
            }}
          />
          <circle
            cx={hx}
            cy={hy}
            r={7}
            fill="#F0ABFC"
            stroke="#fff"
            strokeWidth={2.5}
            className="transition-all duration-300"
          />
        </svg>
      </div>

      {/* 75 / 25 breakdown */}
      <div className="relative mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
        <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-l-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all duration-500"
            style={{ width: `${CREATOR_KEEP * 100}%` }}
          />
          <div
            className="h-full rounded-r-full bg-gradient-to-r from-violet-300 to-fuchsia-300 transition-all duration-500"
            style={{ width: `${PLATFORM_FEE * 100}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-200/90">
              You keep 75%
            </p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-white">
              ₹{inr.format(keep)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium uppercase tracking-wide text-fuchsia-200/90">
              Platform fee 25%
            </p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-white">
              ₹{inr.format(fee)}
            </p>
          </div>
        </div>
      </div>

      {/* Floating mini cards */}
      <div className="relative mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        {(
          [
            { label: "Clicks", value: clicks, tone: "bg-sky-400/20 text-sky-100 border-sky-300/30" },
            { label: "Applies", value: applies, tone: "bg-amber-400/20 text-amber-100 border-amber-300/30" },
            { label: "Hires", value: hires, tone: "bg-pink-400/20 text-pink-100 border-pink-300/30" },
          ] as const
        ).map((card, i) => (
          <M
            key={card.label}
            depth={12 + i * 4}
            amp={3 + i}
            speed={0.8 + i * 0.15}
            phase={i}
            className="min-w-0"
          >
            <div
              className={`rounded-2xl border px-2.5 py-3 text-center shadow-lg backdrop-blur sm:px-3 ${card.tone}`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                {card.label}
              </p>
              <p className="mt-1 text-base font-bold tabular-nums sm:text-lg">
                {inr.format(card.value)}
              </p>
            </div>
          </M>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

export default function EarningsCalculator() {
  const sectionRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [pct, setPct] = useState(25);
  const [touched, setTouched] = useState(false);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const [armed, setArmed] = useState(false);
  const [active, setActive] = useState(false);
  const hidden = armed && !active;

  const followers = followersAt(pct);
  const earnings = earningsFor(followers);
  const shown = useSmooth(earnings, active);
  const label = followersLabel(followers);

  const setFromX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = (clientX - r.left - THUMB / 2) / (r.width - THUMB);
    setPct(Math.round(Math.min(Math.max(p, 0), 1) * 200) / 2);
    setTouched(true);
  };

  const onSliderKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = pct + step;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = pct - step;
    else if (e.key === "PageUp") next = pct + 10;
    else if (e.key === "PageDown") next = pct - 10;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 100;
    if (next === null) return;
    e.preventDefault();
    setPct(Math.min(100, Math.max(0, next)));
    setTouched(true);
  };

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let r1 = 0;
    let r2 = 0;
    let io: IntersectionObserver | undefined;
    r1 = requestAnimationFrame(() => {
      setArmed(true);
      if (typeof IntersectionObserver === "undefined") {
        setActive(true);
        return;
      }
      io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            r2 = requestAnimationFrame(() => setActive(true));
            io?.disconnect();
          }
        },
        { threshold: 0.05 },
      );
      io.observe(el);
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
      io?.disconnect();
    };
  }, []);

  useEffect(() => {
    const root = panelRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-depth]")).map((n) => ({
      n,
      depth: Number(n.dataset.depth ?? 0),
      amp: Number(n.dataset.amp ?? 0),
      speed: Number(n.dataset.speed ?? 1),
      phase: Number(n.dataset.phase ?? 0),
    }));

    let tx = 0,
      ty = 0,
      cx = 0,
      cy = 0,
      raf = 0;
    let visible = true;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = root.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
    };
    const tick = (t: number) => {
      raf = 0;
      if (!visible) return;
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      const s = t / 1000;
      for (const i of items) {
        const x = cx * i.depth + Math.sin(s * i.speed + i.phase) * i.amp * 0.6;
        const y = cy * i.depth + Math.cos(s * i.speed * 0.8 + i.phase) * i.amp;
        i.n.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    });
    io.observe(root);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      items.forEach((i) => (i.n.style.transform = ""));
    };
  }, []);

  const p = pct / 100;

  return (
    <section
      ref={sectionRef}
      aria-label="Earnings calculator"
      className="section-pad mx-auto w-full max-w-[1600px] px-4 sm:px-8 lg:px-10"
    >
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-white via-[#FBFAFF] to-[#F3EEFF] p-4 sm:rounded-[48px] sm:p-8 lg:p-12">
        <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-violet-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-sky-100/60 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-stretch lg:gap-10">
          {/* Left: calculator */}
          <div className="min-w-0">
            <SectionHeading
              className={reveal(hidden)}
              eyebrow="Earnings calculator"
              title={
                <>
                  Estimate Your <br className="hidden sm:block" />
                  <span className="bg-gradient-to-r from-[#6D3AE0] to-[#8B5CF6] bg-clip-text text-transparent">
                    Earnings
                  </span>{" "}
                  Joborio
                </>
              }
              description="See how much you can earn based on your audience size and engagement. Turn your followers into real opportunities."
            />

            <div
              className={`mt-8 rounded-[28px] border border-indigo-100 bg-white p-5 shadow-sm sm:mt-10 sm:p-8 ${reveal(hidden)}`}
              style={{ transitionDelay: "300ms" }}
            >
              <span className="inline-block rounded-2xl bg-violet-100 px-5 py-3 text-xs font-semibold text-violet-700">
                Your Estimated Earnings
              </span>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-5">
                <p className="flex flex-wrap items-baseline gap-x-3 leading-none">
                  <span
                    aria-live="polite"
                    className="bg-gradient-to-r from-[#2563EB] to-[#4F8DF5] bg-clip-text text-[clamp(2rem,8vw,3rem)] font-bold tabular-nums tracking-tight text-transparent"
                  >
                    ₹{inr.format(Math.round(shown))}
                  </span>
                  <span className="text-2xl font-normal text-slate-500 sm:text-3xl">/ Month</span>
                </p>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4">
                  <p className="text-xs text-slate-500">Based on</p>
                  <p className="mt-1 text-base font-semibold text-[#0F1B3D] sm:text-lg">
                    {label} Followers
                  </p>
                </div>
              </div>

              <p className="mt-8 text-sm text-slate-500">Audience size</p>
              <p className="mt-1 text-xl font-semibold text-[#0F1B3D]">{label} Followers</p>

              <div
                ref={trackRef}
                role="slider"
                tabIndex={0}
                aria-label="Audience size"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(pct)}
                aria-valuetext={`${label} followers, about ₹${inr.format(earnings)} per month`}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  draggingRef.current = true;
                  setDragging(true);
                  setFromX(e.clientX);
                }}
                onPointerMove={(e) => {
                  if (draggingRef.current) setFromX(e.clientX);
                }}
                onPointerUp={() => {
                  draggingRef.current = false;
                  setDragging(false);
                }}
                onPointerCancel={() => {
                  draggingRef.current = false;
                  setDragging(false);
                }}
                onKeyDown={onSliderKey}
                className="relative mt-5 h-8 cursor-pointer touch-pan-y select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
              >
                <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-indigo-100" />
                <div
                  className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#6366F1]"
                  style={{ width: thumbLeft(p) }}
                />
                <div
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: thumbLeft(p) }}
                >
                  {!touched && (
                    <span className="absolute inset-0 animate-ping rounded-full bg-violet-400/50 motion-reduce:animate-none" />
                  )}
                  <span
                    className={`relative block h-6 w-6 rounded-full bg-[#6D3AE0] shadow-lg shadow-violet-500/40 ring-4 ring-white transition-transform duration-150 ${
                      dragging ? "scale-110" : ""
                    }`}
                  />
                </div>
              </div>

              <div className="relative mt-1 h-6">
                {TICK_LABELS.map((t, i) => {
                  const tp = i / 4;
                  const near = Math.abs(pct - i * 25) < 12.5;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setPct(i * 25);
                        setTouched(true);
                      }}
                      className={`absolute top-0 -translate-x-1/2 rounded px-1 text-xs transition-colors hover:text-violet-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 ${
                        near ? "font-semibold text-[#0F1B3D]" : "text-slate-500"
                      }`}
                      style={{ left: thumbLeft(tp) }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>

              <p className="mt-5 text-xs text-slate-500">Drag to estimate your earning potential</p>
              <p className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-[11px] leading-snug text-slate-500">
                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 11v5M12 8h.01" />
                </svg>
                Estimates vary by niche, engagement, audience quality and platform performance.
              </p>
            </div>
          </div>

          {/* Right visual — full width under calculator on mobile */}
          <div
            ref={panelRef}
            className={`order-last min-w-0 lg:order-none ${reveal(hidden)}`}
            style={{ transitionDelay: "250ms" }}
          >
            <EarningsVisual
              pct={pct}
              followers={followers}
              earnings={earnings}
              shown={shown}
              label={label}
              active={active}
            />
          </div>
        </div>

        <div
          className={`relative mt-8 rounded-3xl border border-indigo-100 bg-white p-3 sm:mt-10 ${reveal(hidden)}`}
          style={{ transitionDelay: "400ms" }}
        >
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <li
                key={f.title}
                className="flex items-center gap-4 rounded-2xl bg-slate-50/70 p-4 transition duration-300 hover:-translate-y-1 hover:bg-violet-50/70 hover:shadow-md"
              >
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${f.bg}`}>
                  <FeatureIcon name={f.icon} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#0F1B3D]">{f.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{f.sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
