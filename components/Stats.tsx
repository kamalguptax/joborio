"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { PointerEvent } from "react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const tones = {
  violet: { bg: "bg-violet-100", fg: "text-violet-600", line: "#8B5CF6", spot: "rgba(139,92,246,0.10)" },
  sky: { bg: "bg-sky-100", fg: "text-sky-500", line: "#3B9BF5", spot: "rgba(59,155,245,0.10)" },
  orange: { bg: "bg-orange-100", fg: "text-orange-500", line: "#F97316", spot: "rgba(249,115,22,0.10)" },
  green: { bg: "bg-emerald-100", fg: "text-emerald-500", line: "#34D399", spot: "rgba(52,211,153,0.12)" },
} as const;

type Stat = {
  icon: "users" | "wave" | "case" | "shield" | "wallet";
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  delta: string;
  tone: keyof typeof tones;
};

const stats: Stat[] = [
  { icon: "users", value: 12500, suffix: "+", label: "Active creators", delta: "+18%", tone: "violet" },
  { icon: "wave", value: 3.8, decimals: 1, suffix: "M+", label: "Monthly reach", delta: "+24%", tone: "sky" },
  { icon: "case", value: 250, suffix: "+", label: "Active opportunities", delta: "+12%", tone: "orange" },
  { icon: "shield", value: 98, suffix: "%", label: "Verified & trusted", delta: "+6%", tone: "green" },
  { icon: "wallet", value: 1.8, decimals: 1, prefix: "₹", suffix: "L+", label: "Total creator earnings", delta: "+32%", tone: "violet" },
];

/* ------------------------------------------------------------------ */
/*  Small pieces                                                       */
/* ------------------------------------------------------------------ */

function Icon({ name }: { name: Stat["icon"] }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" aria-hidden="true" {...p}>
      {name === "users" && (
        <>
          <circle cx="12" cy="6.5" r="2.4" />
          <circle cx="5.5" cy="9.5" r="1.8" />
          <circle cx="18.5" cy="9.5" r="1.8" />
          <path d="M7.5 18c.6-2.8 2.2-4.2 4.5-4.2s3.9 1.4 4.5 4.2" />
          <path d="M2.5 17c.3-1.9 1.4-3 3-3M21.5 17c-.3-1.9-1.4-3-3-3" />
        </>
      )}
      {name === "wave" && (
        <>
          <circle cx="12" cy="12" r="1.7" fill="currentColor" />
          <path d="M8.6 8.6a5 5 0 000 6.8M15.4 8.6a5 5 0 010 6.8M5.6 5.6a9 9 0 000 12.8M18.4 5.6a9 9 0 010 12.8" />
        </>
      )}
      {name === "case" && (
        <>
          <rect x="3" y="7" width="18" height="13" rx="2.5" />
          <path d="M9 7V5.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V7M3 13h18M10.5 12.5v2h3v-2" />
        </>
      )}
      {name === "shield" && (
        <>
          <path d="M12 3l7 3v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6l7-3z" />
          <path d="M8.8 12.2l2.4 2.4 4.2-4.4" />
        </>
      )}
      {name === "wallet" && (
        <>
          <path d="M3.5 10.5h13a2 2 0 012 2V19a2 2 0 01-2 2h-11a2 2 0 01-2-2v-8.5z" />
          <circle cx="15.5" cy="15.8" r="1" />
          <path d="M7 14h4M7 16h4M7 14c2.6 0 2.6 3 0 3l2.6 2.2" />
          <path d="M8 8l3-3 2 2 4-4M14 3h3v3" />
        </>
      )}
    </svg>
  );
}

/* Sparkline: animated with plain transitions (no injected <style> needed) */
function Spark({ color, hidden }: { color: string; hidden: boolean }) {
  const id = useId().replace(/:/g, "");
  const line = "M0 52 C8 52 10 34 22 34 L40 34 C52 34 52 20 66 20 L92 20 C104 20 104 8 118 8 L140 6";
  return (
    <svg className="block h-auto w-full" viewBox="0 0 140 52" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${line} L140 52 L0 52 Z`}
        fill={`url(#${id})`}
        className="transition-opacity duration-1000 delay-[1100ms] motion-reduce:transition-none"
        style={{ opacity: hidden ? 0 : 1 }}
      />
      <path
        d={line}
        stroke={color}
        strokeOpacity="0.55"
        strokeWidth="1.5"
        pathLength={1}
        strokeDasharray={1}
        className="transition-[stroke-dashoffset] duration-[1800ms] ease-out delay-500 motion-reduce:transition-none"
        style={{ strokeDashoffset: hidden ? 1 : 0 }}
      />
    </svg>
  );
}

function CountUp({
  to,
  decimals = 0,
  prefix = "",
  suffix = "",
  active,
  delay = 0,
  duration = 1800,
}: {
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  active: boolean;
  delay?: number;
  duration?: number;
}) {
  // starts at the final value, so the number is always correct even if animation never runs
  const [v, setV] = useState(to);

  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = requestAnimationFrame(() => setV(0));
    let start = 0;
    const timer = setTimeout(() => {
      const step = (t: number) => {
        if (!start) start = t;
        const p = Math.min((t - start) / duration, 1);
        setV(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [active, to, delay, duration]);

  const text = new Intl.NumberFormat("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(v);
  return (
    <span className="tabular-nums">
      {prefix}
      {text}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Stats                                                              */
/* ------------------------------------------------------------------ */

export default function Stats() {
  const ref = useRef<HTMLElement>(null);
  const [armed, setArmed] = useState(false); // JS is running -> allowed to hide + animate in
  const [active, setActive] = useState(false); // revealed
  const hidden = armed && !active;

  // Content is visible by default (also on the server / if JS fails).
  // Once the page has loaded we hide it and reveal it when it scrolls into view.
  useEffect(() => {
    const el = ref.current;
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
        { threshold: 0.05 }
      );
      io.observe(el);
    });

    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
      io?.disconnect();
    };
  }, []);

  // soft spotlight that follows the mouse inside a card
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <section ref={ref} aria-label="Platform stats" className="mx-auto w-full max-w-[1600px] px-4 py-10 sm:px-8 sm:py-12 lg:px-10">
      {/* Mobile: 2-col grid. Tablet: 2. Desktop: 5. */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 lg:grid-cols-6 xl:grid-cols-5">
        {stats.map((s, idx) => {
          const t = tones[s.tone];
          const span = idx < 3 ? "lg:col-span-2 xl:col-span-1" : "lg:col-span-3 xl:col-span-1";
          const last = idx === stats.length - 1 ? "col-span-2 md:col-span-2 xl:col-span-1" : "";
          return (
            <div
              key={s.label}
              className={`${span} ${last} min-w-0 transition-all duration-700 ease-out motion-reduce:transition-none ${
                hidden ? "translate-y-7 opacity-0" : "translate-y-0 opacity-100"
              }`}
              style={{ transitionDelay: `${idx * 90}ms` }}
            >
              <div
                onPointerMove={onMove}
                className="group relative flex h-full min-h-[168px] flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-[0_12px_40px_rgba(30,27,75,0.12)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(76,29,149,0.14)] sm:min-h-[220px] sm:rounded-3xl sm:p-6 md:min-h-[250px]"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: `radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), ${t.spot}, transparent 70%)` }}
                />

                <div className="relative flex items-start justify-between gap-2">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 sm:h-[58px] sm:w-[58px] sm:rounded-2xl ${t.bg} ${t.fg}`}>
                    <Icon name={s.icon} />
                  </span>
                  <div className="min-w-0 text-right leading-tight">
                    <p className="text-xs font-bold text-emerald-500 sm:text-[13px]">{s.delta}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400 sm:mt-1 sm:text-xs">this month</p>
                  </div>
                </div>

                <div className="relative mt-4 sm:mt-8">
                  <p className="text-[clamp(1.25rem,4vw,1.75rem)] font-bold leading-none tracking-tight text-[#0F1B3D]">
                    <CountUp to={s.value} decimals={s.decimals} prefix={s.prefix} suffix={s.suffix} active={active} delay={idx * 90 + 200} />
                  </p>
                  <p className="mt-2 text-sm text-slate-500 sm:text-base">{s.label}</p>
                </div>

                {idx === 0 ? (
                  <div className="absolute bottom-4 left-4 flex items-center sm:bottom-6 sm:left-6">
                    {["from-amber-400 to-rose-500", "from-slate-700 to-slate-900", "from-sky-300 to-indigo-400"].map((g, i) => (
                      <span key={i} className={`-ml-2 hidden h-9 w-9 rounded-full bg-gradient-to-br ring-2 ring-white first:ml-0 sm:block ${g}`} />
                    ))}
                    <span className="text-[10px] text-slate-500 sm:ml-3 sm:text-xs">+ 12.5K creators</span>
                  </div>
                ) : (
                  <div className="pointer-events-none absolute bottom-0 right-0 hidden w-[48%] sm:block">
                    <Spark color={t.line} hidden={hidden} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}