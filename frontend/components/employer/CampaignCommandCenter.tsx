"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Info } from "lucide-react";

const inr = new Intl.NumberFormat("en-IN");

function formatInr(n: number) {
  return `₹${inr.format(Math.round(n))}`;
}

function formatNum(n: number) {
  return inr.format(Math.round(n));
}

type TrendMetric = "clicks" | "raw" | "verified" | "approved" | "spend";

const TREND_TABS: { id: TrendMetric; label: string }[] = [
  { id: "clicks", label: "Clicks" },
  { id: "raw", label: "Raw conversions" },
  { id: "verified", label: "Verified" },
  { id: "approved", label: "Approved" },
  { id: "spend", label: "Spend" },
];

/** Sample 14-day series shaped like the command-center mock. */
const TREND_SERIES: Record<TrendMetric, number[]> = {
  clicks: [4200, 5100, 4800, 6200, 5800, 7100, 6900, 6400, 7200, 6800, 6100, 5900, 5500, 4800],
  raw: [520, 610, 580, 740, 690, 820, 790, 760, 840, 800, 720, 690, 650, 580],
  verified: [410, 490, 460, 590, 550, 660, 630, 610, 670, 640, 580, 550, 520, 460],
  approved: [360, 420, 400, 510, 480, 570, 550, 530, 580, 560, 500, 480, 450, 400],
  spend: [28, 32, 30, 38, 35, 42, 40, 39, 44, 41, 37, 35, 33, 29],
};

const FUNNEL = [
  { label: "Impressions", value: 1_106_140 },
  { label: "Clicks", value: 79_010 },
  { label: "Landing page visits", value: 67_949 },
  { label: "Registrations", value: 8_720 },
  { label: "Verified", value: 6_976 },
  { label: "Approved", value: 6_030 },
];

type MetricCardProps = {
  label: string;
  value: string;
  hint: ReactNode;
  hintTone?: "up" | "down" | "neutral";
};

function MetricCard({ label, value, hint, hintTone = "neutral" }: MetricCardProps) {
  const hintClass =
    hintTone === "up"
      ? "text-emerald-600"
      : hintTone === "down"
        ? "text-rose-500"
        : "text-slate-500";

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-300"
          title="Sample metric"
        >
          <Info size={14} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-[#0A2150] tabular-nums sm:text-[1.65rem]">
        {value}
      </p>
      <p className={`mt-1.5 text-xs font-medium ${hintClass}`}>{hint}</p>
    </div>
  );
}

function TrendBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="mt-5 flex h-44 items-end gap-1.5 sm:gap-2">
      {values.map((v, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col items-center justify-end">
          <div
            className="w-full max-w-[28px] rounded-t-md bg-violet-500 transition-all duration-300"
            style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
            title={formatNum(v)}
          />
        </div>
      ))}
    </div>
  );
}

export default function CampaignCommandCenter({
  activeCampaigns,
  totalCampaigns,
}: {
  activeCampaigns?: number;
  totalCampaigns?: number;
}) {
  const [trendMetric, setTrendMetric] = useState<TrendMetric>("clicks");
  const series = TREND_SERIES[trendMetric];

  const activeLabel = useMemo(() => {
    const active = activeCampaigns ?? 3;
    const total = totalCampaigns ?? 6;
    return `${active} of ${total}`;
  }, [activeCampaigns, totalCampaigns]);

  const allocated = 700_000;
  const spent = 459_900;
  const reserved = 15_881;
  const remaining = allocated - spent - reserved;
  const spendPct = Math.round((spent / allocated) * 100);

  const funnelMax = FUNNEL[0].value;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0A2150] sm:text-3xl">
          Campaign command center
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Last 14 days vs the previous 14 days. Sample data
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Active campaigns"
          value={activeLabel}
          hint="+1 vs previous"
          hintTone="up"
        />
        <MetricCard
          label="Spend of budget"
          value={formatInr(spent)}
          hint={
            <span className="text-slate-500">
              {spendPct}% of {formatInr(allocated)}
            </span>
          }
        />
        <MetricCard
          label="Clicks"
          value={formatNum(79_010)}
          hint="+8.4% vs previous"
          hintTone="up"
        />
        <MetricCard
          label="Raw to approved"
          value={`${formatNum(8_720)} to ${formatNum(6_030)}`}
          hint="Approved is billable"
          hintTone="up"
        />
        <MetricCard
          label="Cost per approved result"
          value={formatInr(76)}
          hint="-2.1% vs previous"
          hintTone="up"
        />
        <MetricCard
          label="Approval rate"
          value="69%"
          hint="-1.3 pts vs previous"
          hintTone="down"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="text-base font-bold text-[#0A2150]">
            Campaign performance trend
          </h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {TREND_TABS.map((tab) => {
              const on = tab.id === trendMetric;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTrendMetric(tab.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    on
                      ? "bg-violet-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <TrendBars values={series} />
          <p className="mt-3 text-center text-[11px] text-slate-400">
            Daily {TREND_TABS.find((t) => t.id === trendMetric)?.label.toLowerCase()} · last 14 days
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-[#0A2150]">Budget utilisation</h2>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-violet-500"
              style={{ width: `${spendPct}%` }}
            />
          </div>
          <ul className="mt-5 space-y-2.5 text-sm">
            {[
              { label: "Allocated", value: formatInr(allocated) },
              { label: "Spent", value: formatInr(spent) },
              { label: "Reserved", value: formatInr(reserved) },
              { label: "Remaining", value: formatInr(remaining) },
            ].map((row) => (
              <li
                key={row.label}
                className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0"
              >
                <span className="text-slate-500">{row.label}</span>
                <span className="font-semibold tabular-nums text-[#0A2150]">
                  {row.value}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-xl bg-violet-50 px-3.5 py-3 text-xs leading-relaxed text-violet-800">
            Reserved = held for pending conversions and next-day delivery so
            spend never overshoots the allocated budget.
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-[#0A2150]">Conversion funnel</h2>
          <ul className="mt-5 space-y-3.5">
            {FUNNEL.map((row) => (
              <li key={row.label}>
                <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                  <span className="text-slate-600">{row.label}</span>
                  <span className="font-semibold tabular-nums text-[#0A2150]">
                    {formatNum(row.value)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-violet-500"
                    style={{
                      width: `${Math.max(4, (row.value / funnelMax) * 100)}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
