"use client";
// components/EarningCalculator.tsx
// Next.js + Tailwind CSS | npm i lucide-react

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import Dropdown, { type DropdownOption } from "./Dropdown";

/* ---------- Config ---------- */
const AUDIENCE_SIZES = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000];

const NICHES = {
  Technology: 1,
  Finance: 1.35,
  Business: 1.25,
  "Jobs & Careers": 1.2,
  Education: 1.1,
  Fitness: 0.85,
  Fashion: 0.8,
  Gaming: 0.75,
  Lifestyle: 0.7,
  Entertainment: 0.6,
} as const;

const PLATFORMS = {
  Instagram: 0.85,
  Telegram: 0.9,
  WhatsApp: 0.95,
  YouTube: 1.15,
  "Instagram + Telegram": 1,
  "Instagram + YouTube": 1.3,
} as const;

const RATE_LOW = 0.16;
const RATE_HIGH = 0.34;

/* ---------- Types ---------- */
type Niche = keyof typeof NICHES;
type Platform = keyof typeof PLATFORMS;

interface FormState {
  size: number;
  niche: Niche;
  platform: Platform;
}

/* ---------- Logic ---------- */
const sizeFactor = (n: number): number =>
  n < 10000 ? 1.1 : n <= 50000 ? 1 : n <= 100000 ? 0.9 : 0.8;

function estimate({ size, niche, platform }: FormState) {
  const m = sizeFactor(size) * NICHES[niche] * PLATFORMS[platform];
  const step = size < 5000 ? 100 : 500;
  const round = (v: number) => Math.max(step, Math.round(v / step) * step);
  const low = round(size * RATE_LOW * m);
  let high = round(size * RATE_HIGH * m);
  if (high <= low) high = low + step;
  return { low, high };
}

const fmt = (n: number): string => new Intl.NumberFormat("en-IN").format(n);

function toOptions<T extends string>(obj: Record<T, number>): DropdownOption<T>[] {
  return (Object.keys(obj) as T[]).map((k) => ({ value: k, label: k }));
}

const DEFAULTS: FormState = {
  size: 50000,
  niche: "Technology",
  platform: "Instagram + Telegram",
};

/* ---------- Main ---------- */
export default function EarningCalculator() {
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [result, setResult] = useState(() => estimate(DEFAULTS));
  const [stale, setStale] = useState(false);

  const set = <K extends keyof FormState>(key: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: v }));
    setStale(true);
  };

  const calculate = () => {
    setResult(estimate(form));
    setStale(false);
  };

  return (
    <section
      aria-labelledby="earning-heading"
      className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#12256b] to-[#0a1440] p-5 text-white shadow-2xl shadow-indigo-950/30 sm:p-6 lg:sticky lg:top-24"
    >
      <h3 id="earning-heading" className="text-2xl font-extrabold tracking-tight">
        Your Earning Potential
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-indigo-100/90">
        Get a personalized estimate based on your audience and niche.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Dropdown
          label="Audience Size"
          value={form.size}
          onChange={(v) => set("size", v)}
          options={AUDIENCE_SIZES.map((n) => ({ value: n, label: fmt(n) }))}
        />
        <Dropdown
          label="Main Niche"
          value={form.niche}
          onChange={(v) => set("niche", v)}
          options={toOptions(NICHES)}
        />
        <Dropdown
          label="Platform"
          value={form.platform}
          onChange={(v) => set("platform", v)}
          options={toOptions(PLATFORMS)}
          className="col-span-2"
        />
      </div>

      <button
        type="button"
        onClick={calculate}
        className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:from-violet-500 hover:to-indigo-500 active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-300"
      >
        Calculate Earnings
      </button>

      <div
        aria-live="polite"
        className={`mt-4 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-emerald-100 via-teal-50 to-sky-100 p-4 transition-opacity ${
          stale ? "opacity-60" : "opacity-100"
        }`}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/70 text-emerald-600">
          <BarChart3 className="h-7 w-7" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-medium text-teal-700">Estimated Monthly Earnings</p>
          <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-indigo-950">
            ₹{fmt(result.low)} – ₹{fmt(result.high)}
          </p>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-indigo-200/70">
        {stale
          ? "Inputs changed — click Calculate Earnings to update."
          : "Indicative estimate. Actual earnings vary."}
      </p>
    </section>
  );
}