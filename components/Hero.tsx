"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

const Arrow = () => (
  <svg
    className="h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-1"
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

/*
  Motion: any element wrapped in this gets
   - mouse parallax   (depth = max px shift, negative = opposite direction)
   - idle floating    (amp = px, speed, phase)
   - 3D tilt          (tilt = max degrees)
  All of it is driven by ONE requestAnimationFrame loop in Hero (no re-renders).
*/
type MotionProps = {
  depth?: number;
  amp?: number;
  speed?: number;
  phase?: number;
  tilt?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

function Motion({ depth = 0, amp = 0, speed = 1, phase = 0, tilt = 0, className, style, children }: MotionProps) {
  return (
    <div
      data-depth={depth}
      data-amp={amp}
      data-speed={speed}
      data-phase={phase}
      data-tilt={tilt}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
}

/* Bubble size is a % of the visual, so it scales with the screen */
function Bubble({
  className,
  children,
  delay = 0,
  ...m
}: { className: string; children: ReactNode; delay?: number } & Omit<MotionProps, "className" | "children" | "style">) {
  return (
    <Motion
      {...m}
      className={`hero-pop absolute flex aspect-square w-[11%] min-w-[36px] items-center justify-center rounded-full shadow-xl ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </Motion>
  );
}

/* Number count-up (respects reduced motion) */
function CountUp({
  to,
  decimals = 0,
  prefix = "",
  suffix = "",
  delay = 0,
  duration = 1800,
}: {
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  delay?: number;
  duration?: number;
}) {
  const [v, setV] = useState(0);

  useEffect(() => {
    let raf = 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      raf = requestAnimationFrame(() => setV(to));
      return () => cancelAnimationFrame(raf);
    }
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
  }, [to, delay, duration]);

  const text = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(v);

  return (
    <span className="tabular-nums">
      {prefix}
      {text}
      {suffix}
    </span>
  );
}

const w = { fill: "none", stroke: "white", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const d = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-depth]")).map((n) => ({
      n,
      depth: Number(n.dataset.depth ?? 0),
      amp: Number(n.dataset.amp ?? 0),
      speed: Number(n.dataset.speed ?? 1),
      phase: Number(n.dataset.phase ?? 0),
      tilt: Number(n.dataset.tilt ?? 0),
    }));
    const magnets = Array.from(root.querySelectorAll<HTMLElement>("[data-magnet]"));
    const glow = glowRef.current;
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    let tx = 0, ty = 0, cx = 0, cy = 0; // mouse target / current (-1..1)
    let gtx = 0, gty = 0, gx = 0, gy = 0; // glow target / current (px)
    let seen = false;
    let raf = 0;
    let visible = true;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = root.getBoundingClientRect();
      gtx = e.clientX - r.left;
      gty = e.clientY - r.top;
      tx = (gtx / r.width - 0.5) * 2;
      ty = (gty / r.height - 0.5) * 2;
      if (!seen) {
        gx = gtx;
        gy = gty;
        seen = true;
      }
      if (glow) glow.style.opacity = "1";
    };

    const onLeave = () => {
      tx = 0;
      ty = 0;
      seen = false;
      if (glow) glow.style.opacity = "0";
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
        let tr = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
        if (i.tilt) {
          tr = `perspective(900px) ${tr} rotateX(${(-cy * i.tilt).toFixed(2)}deg) rotateY(${(cx * i.tilt).toFixed(2)}deg)`;
        }
        i.n.style.transform = tr;
      }

      if (glow) {
        gx += (gtx - gx) * 0.12;
        gy += (gty - gy) * 0.12;
        glow.style.setProperty("--gx", `${gx.toFixed(1)}px`);
        glow.style.setProperty("--gy", `${gy.toFixed(1)}px`);
      }

      raf = requestAnimationFrame(tick);
    };

    // pause the loop when hero is off-screen
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    });
    io.observe(root);

    // magnetic buttons
    const cleanups: Array<() => void> = [];
    if (finePointer) {
      magnets.forEach((el) => {
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          const mx = (e.clientX - (r.left + r.width / 2)) * 0.18;
          const my = (e.clientY - (r.top + r.height / 2)) * 0.3;
          el.style.transform = `translate(${mx.toFixed(1)}px,${my.toFixed(1)}px)`;
        };
        const out = () => {
          el.style.transform = "";
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", out);
        cleanups.push(() => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", out);
        });
      });
    }

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      cleanups.forEach((fn) => fn());
      items.forEach((i) => (i.n.style.transform = ""));
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative isolate flex flex-col justify-center overflow-hidden lg:justify-end bg-[linear-gradient(135deg,#0B1D4F_0%,#14296B_45%,#3F2AA8_100%)] pt-24 text-white sm:pt-28 lg:pt-32 xl:pt-36">
      <div className="pointer-events-none absolute -right-40 top-1/3 hidden h-[min(600px,70vw)] w-[min(600px,70vw)] rounded-full bg-violet-600/30 blur-3xl sm:block" />
      <div className="pointer-events-none absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full bg-sky-500/15 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.16)_1px,transparent_1.5px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_at_25%_45%,black,transparent_70%)]" />
      <svg aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 max-h-[70%] max-w-[min(1183px,100%)]" width="1183" height="704" viewBox="0 0 1183 704" fill="none" xmlns="http://www.w3.org/2000/svg">
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

      {/* Soft spotlight that follows the mouse */}
      <div ref={glowRef} aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(520px circle at var(--gx, 70%) var(--gy, 40%), rgba(167,139,250,0.22), transparent 60%)",
        }}
      />

      <div className="relative mx-auto grid w-full max-w-[1600px] items-center gap-6 px-4 pb-12 sm:gap-10 sm:px-8 sm:pb-16 md:pb-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-end lg:gap-10 lg:px-10 lg:pb-0 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] xl:gap-16">
        {/* ---------- Left: content ---------- */}
        <div className="min-w-0 lg:pb-20 lg:self-center">
          <div className="hero-in inline-flex max-w-full items-center gap-3 rounded-3xl border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur-sm sm:rounded-full sm:px-5" style={d(0)}>
            <span className="hero-pulse h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />
            <span className="text-eyebrow leading-snug text-slate-200">The marketplace built for modern creators</span>
          </div>

          <h1 className="hero-in text-page-hero mt-5 sm:mt-7 lg:text-[2.6rem] xl:text-[2.9rem] min-[1440px]:text-[3.4rem] min-[1700px]:text-[3.9rem]" style={d(120)}>
            Your audience has value.
            <span className="hero-shine mt-1 block bg-gradient-to-r from-[#D8B4FE] via-[#A78BFA] to-[#D8B4FE] bg-clip-text text-transparent" style={{ backgroundSize: "200% auto" }}>
              Make every useful share count.
            </span>
          </h1>

          <p className="hero-in text-section-copy mt-5 max-w-xl text-slate-200/90 sm:mt-6 lg:max-w-[34rem] lg:text-lg xl:text-xl" style={d(260)}>
            Share trusted jobs, courses, campaigns and opportunities with your community. Track real results. Get paid.
          </p>
          <div className="hero-in mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4" style={d(400)}>
            <Link href="/signup" data-magnet className="btn-tap group inline-flex h-12 w-full min-h-11 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB] px-8 text-base font-semibold shadow-lg shadow-indigo-900/40 transition hover:brightness-110 hover:shadow-xl hover:shadow-violet-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-[52px] sm:w-auto sm:px-10">
              Start Earning <Arrow />
            </Link>
            <Link href="/hiring" data-magnet className="btn-tap group inline-flex h-12 w-full min-h-11 items-center justify-center gap-3 rounded-full bg-white px-8 text-base font-semibold text-slate-900 transition hover:bg-slate-100 hover:shadow-xl hover:shadow-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-[52px] sm:w-auto sm:px-10">
              I&apos;m Hiring <Arrow />
            </Link>
          </div>

          <div className="hero-in mt-8 flex items-center gap-4 sm:mt-12" style={d(540)}>
            <div className="flex -space-x-3">
              {["from-amber-400 to-rose-500", "from-sky-400 to-indigo-500", "from-emerald-400 to-teal-600"].map((g, i) => (
                <span key={i} className={`h-11 w-11 rounded-full border-2 border-[#14296B] bg-gradient-to-br transition-transform duration-300 hover:-translate-y-1 sm:h-12 sm:w-12 ${g}`}/>
              ))}
            </div>
            <div className="min-w-0">
              <p className="font-semibold">
                <CountUp to={12500} suffix="+" delay={700} /> active creators
              </p>
              <p className="text-sm text-slate-300">Growing and earning together</p>
            </div>
          </div>
        </div>

        {/* ---------- Right: visual ---------- */}
        <div className="relative mx-auto w-full min-w-0 max-w-[420px] sm:max-w-[560px] lg:max-w-[640px]">
          <div className="relative mx-auto aspect-square w-full">
            <Motion depth={-10} className="hero-fade absolute inset-0 hidden sm:block">
              <div className="absolute left-1/2 top-1/2 aspect-square w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" />
              <div className="absolute left-1/2 top-1/2 aspect-square w-[88%] -translate-x-1/2 -translate-y-1/2">
                <div className="hero-spin h-full w-full">
                  <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_14px_3px_rgba(255,255,255,0.7)]" />
                </div>
              </div>
            </Motion>

            <Motion depth={10} amp={4} speed={0.6} className="hero-pop absolute bottom-[7%] right-[8%] z-[1] aspect-square w-[72%] rounded-full bg-[linear-gradient(145deg,#F25ECA_8.8%,#FF9775_57%,#FFB16C_93.8%)] sm:right-[12%] sm:w-[69%]" style={d(250)}/>
            <Motion depth={4} amp={3} speed={0.6} phase={1} className="hero-pop absolute bottom-[1%] right-[8%] aspect-square w-[72%] rounded-full bg-[linear-gradient(145deg,#F25ECA_8.8%,#FF9775_57%,#FFB16C_93.8%)] sm:right-[12%] sm:w-[69%]" style={d(150)}/>

            <Image
              src="/hero-img.png"
              alt="Creator sharing an opportunity on her phone"
              width={611}
              height={846}
              priority
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 640px"
              className="hero-in absolute bottom-0 right-[4%] z-[1] h-[94%] w-auto max-w-[92%] object-contain object-bottom sm:right-[6%]"
            />

            {/* Social bubbles: fewer on mobile so they don't collide with the photo */}
            <Bubble depth={26} amp={9} speed={1.1} phase={0} delay={650} className="left-[12%] top-[8%] hidden bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 sm:flex">
              <svg className="h-1/2 w-1/2" viewBox="0 0 24 24" {...w} strokeWidth={2.2}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r=".6" fill="white" /></svg>
            </Bubble>
            <Bubble depth={20} amp={8} speed={0.9} phase={1.3} delay={750} className="left-[2%] top-[28%] bg-white sm:left-0 sm:top-[30%]">
              <svg className="h-[44%] w-[58%]" viewBox="0 0 40 30"><rect width="40" height="30" rx="8" fill="#FF0000" /><path d="M16 9l10 6-10 6z" fill="white" /></svg>
            </Bubble>
            <Bubble depth={30} amp={10} speed={1.2} phase={2.1} delay={850} className="left-[0%] top-[52%] hidden bg-sky-500 sm:flex sm:left-[-4%] sm:top-[55%]">
              <svg className="h-1/2 w-1/2" viewBox="0 0 24 24" fill="white"><path d="M21 4L3 11l6 2 2 6 3-4 5 3L21 4z" /></svg>
            </Bubble>
            <Bubble depth={22} amp={8} speed={1} phase={3.4} delay={950} className="left-[2%] top-[72%] bg-[#0A66C2] sm:left-[-4%] sm:top-[76%]">
              <span className="text-base font-bold leading-none sm:text-2xl lg:text-xl xl:text-3xl">in</span>
            </Bubble>
            <Bubble depth={28} amp={9} speed={1.3} phase={4.2} delay={700} className="right-[2%] top-[10%] hidden bg-black sm:flex sm:right-0 sm:top-[21%]">
              <svg className="h-1/2 w-1/2" viewBox="0 0 24 24" {...w} strokeWidth={2.6}><path d="M14 3v11a3.5 3.5 0 11-3.5-3.5M14 3c.4 2.4 2 4 4.5 4.2" /></svg>
            </Bubble>
            <Bubble depth={24} amp={10} speed={0.8} phase={5.1} delay={900} className="right-[0%] top-[36%] bg-green-500 sm:right-[-3%] sm:top-[38%]">
              <svg className="h-[52%] w-[52%]" viewBox="0 0 24 24" {...w}><path d="M12 3a9 9 0 00-7.8 13.5L3 21l4.6-1.2A9 9 0 1012 3z" /><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8c-1-.4-2-1.4-2.4-2.4l.8-1-1-2-1.9.6z" fill="white" stroke="none" /></svg>
            </Bubble>

            {/* Floating cards: desktop only (stacked below on mobile) */}
            <Motion depth={22} amp={5} speed={0.9} phase={0.5} tilt={6} className="hero-in absolute right-[2%] top-[2%] z-[2] hidden md:block" style={d(1000)}>
              <div className="flex items-center gap-4 rounded-2xl bg-white/90 px-5 py-4 text-slate-900 shadow-xl lg:scale-[.85] xl:scale-100">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                  <svg className="h-[26px] w-[26px]" viewBox="0 0 24 24" {...w} stroke="currentColor"><path d="M4 20V10M10 20V6M16 20v-8M22 20H2M15 4h5v5M20 4l-6 6" /></svg>
                </span>
                <div>
                  <p className="text-2xl font-semibold leading-none">
                    <CountUp to={3.8} decimals={1} suffix="M+" delay={900} />
                  </p>
                  <p className="mt-1 whitespace-nowrap text-sm text-slate-500">Monthly reach</p>
                </div>
              </div>
            </Motion>

            <Motion depth={28} amp={6} speed={1} phase={2} tilt={6} className="hero-in absolute bottom-[5%] left-[2%] z-[2] hidden xl:block" style={d(1100)}>
              <div className="flex items-center gap-4 rounded-2xl bg-white/95 py-4 pl-4 pr-6 text-slate-900 shadow-xl lg:scale-[.85] xl:scale-100">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-600">
                  <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" {...w}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4" /></svg>
                </span>
                <div className="whitespace-nowrap">
                  <p className="text-sm font-semibold">Share. Track. Earn.</p>
                  <p className="text-xs text-slate-500">One link, measurable results</p>
                </div>
              </div>
            </Motion>
          </div>

          {/* Mobile mini-stats under the image (no overlap) */}
          <div className="relative z-[3] -mt-7 grid grid-cols-2 gap-3 md:hidden">
            <div className="flex items-center gap-3 rounded-2xl bg-white/95 px-3 py-3 text-slate-900 shadow-lg">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                <svg className="h-5 w-5" viewBox="0 0 24 24" {...w} stroke="currentColor"><path d="M4 20V10M10 20V6M16 20v-8M22 20H2M15 4h5v5M20 4l-6 6" /></svg>
              </span>
              <div className="min-w-0">
                <p className="text-lg font-semibold leading-none">
                  <CountUp to={3.8} decimals={1} suffix="M+" delay={900} />
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">Monthly reach</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/95 px-3 py-3 text-slate-900 shadow-lg">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" {...w}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4" /></svg>
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Share · Track</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">Earn with links</p>
              </div>
            </div>
          </div>

          {/* Top creator: stacked on mobile, floating from md+ */}
          <Motion depth={18} amp={5} speed={0.8} phase={3} tilt={5} className="hero-in relative z-[2] mx-auto mt-4 w-full max-w-sm md:absolute md:bottom-[5%] md:right-0 md:mx-0 md:mt-0 md:max-w-[290px] lg:right-[-2%] xl:right-[-3%]" style={d(1200)}>
            <div className="w-full rounded-2xl bg-white p-4 text-slate-900 shadow-2xl lg:origin-bottom-right lg:scale-[.85] xl:scale-100">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#14296B]">👑 Top Creator</p>
                  <p className="ml-6 text-[10px] uppercase tracking-widest text-slate-400">This week</p>
                </div>
                <span className="shrink-0 rounded-lg bg-violet-100 px-2 py-1 text-[11px] font-bold text-violet-700">🔥 #1</span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-lg font-bold text-white ring-2 ring-pink-400 ring-offset-2 sm:h-14 sm:w-14">S</span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[#14296B]">Sneha Verma <span className="text-sky-500">●</span></p>
                  <p className="truncate text-[11px] text-slate-500">Career &amp; Job Updates</p>
                  <span className="mt-1 inline-block rounded-full bg-pink-500 px-3 py-0.5 text-[10px] font-semibold text-white">Top Creator</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-600">Total earnings this week</p>
                  <p className="text-xl font-bold text-[#14296B] sm:text-2xl">
                    <CountUp to={18420} prefix="₹" delay={1100} />
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">+32%</span>
              </div>
              <div className="mt-3 flex justify-between gap-2 px-1 text-[11px]">
                <div><p className="font-bold">1.2M</p><p className="text-slate-400">Views</p></div>
                <div><p className="font-bold"><CountUp to={89248} delay={1200} /></p><p className="text-slate-400">Clicks</p></div>
                <div><p className="font-bold">6</p><p className="text-slate-400">Campaigns</p></div>
              </div>
            </div>
          </Motion>
        </div>
      </div>
    </section>
  );
}