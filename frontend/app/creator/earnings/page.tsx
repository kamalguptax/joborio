"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Briefcase, Landmark, Shield } from "lucide-react";
import {
  fetchCreatorClicks,
  fetchCreatorDashboard,
  fetchCreatorTransactions,
} from "@/lib/api/creator";
import { formatMoney } from "@/lib/money";

type JobEarningCard = {
  key: string;
  listing_id?: number | null;
  title: string;
  earning_type?: string;
  click_count?: number;
  counted_count?: number;
  duplicate_count?: number;
  earning_count: number;
  net_usd: number;
  pending_usd: number;
  approved_usd: number;
  payable_usd: number;
  paid_usd: number;
  last_at?: string | null;
};

type PricingModel = "ppc" | "ppr" | "ppa" | "ppe";

const MODEL_STYLE: Record<string, string> = {
  ppc: "bg-purple-50 text-purple-700",
  ppr: "bg-emerald-50 text-emerald-700",
  ppa: "bg-blue-50 text-blue-700",
  ppe: "bg-amber-50 text-amber-700",
};

const MODEL_RING: Record<PricingModel, string> = {
  ppc: "border-purple-400 ring-2 ring-purple-200",
  ppr: "border-emerald-400 ring-2 ring-emerald-200",
  ppa: "border-blue-400 ring-2 ring-blue-200",
  ppe: "border-amber-400 ring-2 ring-amber-200",
};

const MODEL_RANK: Record<string, number> = {
  ppr: 0,
  ppa: 1,
  ppe: 2,
  ppc: 3,
};

function formatWhen(value?: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function resolveJobModel(
  job: JobEarningCard,
  pricingByJob: Record<string, string>,
): PricingModel {
  const fromClicks =
    (job.listing_id
      ? pricingByJob[`listing:${job.listing_id}`]
      : undefined) ??
    pricingByJob[`title:${String(job.title).trim().toLowerCase()}`];
  const fromLedger = String(job.earning_type ?? "").toLowerCase();
  const candidates = [fromClicks, fromLedger].filter((m) =>
    ["ppc", "ppr", "ppa", "ppe"].includes(String(m)),
  ) as PricingModel[];
  return (
    candidates.sort(
      (a, b) => (MODEL_RANK[a] ?? 99) - (MODEL_RANK[b] ?? 99),
    )[0] ?? "ppc"
  );
}

export default function CreatorEarningsPage() {
  const [byType, setByType] = useState<Record<string, Record<string, number>>>(
    {},
  );
  const [byJob, setByJob] = useState<JobEarningCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [totals, setTotals] = useState({
    pending_usd: 0,
    approved_usd: 0,
    payable_usd: 0,
    paid_usd: 0,
  });
  const [clickTotal, setClickTotal] = useState(0);
  const [clickCounted, setClickCounted] = useState(0);
  const [clickDuplicates, setClickDuplicates] = useState(0);
  const [clickJobs, setClickJobs] = useState(0);
  const [pricingByJob, setPricingByJob] = useState<Record<string, string>>({});
  const [selectedModel, setSelectedModel] = useState<PricingModel | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetchCreatorDashboard().catch(() => null),
      fetchCreatorTransactions(1).catch(() => null),
      fetchCreatorClicks(1).catch(() => null),
    ]).then(([dash, tx, clicks]) => {
      if (cancelled) return;

      if (!dash && !tx) {
        setError("Could not load earnings.");
        return;
      }

      if (dash) {
        setByType(
          (dash.earnings_by_type as Record<string, Record<string, number>>) ??
            {},
        );
        if (typeof dash.currency === "string") setCurrency(dash.currency);
        const fromDash = (dash.earnings_by_job as JobEarningCard[]) ?? [];
        if (fromDash.length > 0) setByJob(fromDash);
        const e = (dash.earnings_usd as Record<string, number>) ?? {};
        setTotals({
          pending_usd: Number(e.pending_usd ?? 0),
          approved_usd: Number(e.approved_usd ?? 0),
          payable_usd: Number(e.payable_usd ?? 0),
          paid_usd: Number(e.paid_usd ?? 0),
        });
      }

      if (tx) {
        const fromTx = (tx.meta.by_job as JobEarningCard[]) ?? [];
        if (fromTx.length > 0) setByJob(fromTx);
        setTotals((prev) => ({
          pending_usd: Number(tx.meta.pending_usd ?? prev.pending_usd),
          approved_usd: Number(tx.meta.approved_usd ?? prev.approved_usd),
          payable_usd: Number(tx.meta.payable_usd ?? prev.payable_usd),
          paid_usd: Number(tx.meta.paid_usd ?? prev.paid_usd),
        }));
      }

      if (clicks) {
        setClickTotal(Number(clicks.meta.total ?? 0));
        setClickCounted(Number(clicks.meta.counted ?? 0));
        setClickDuplicates(Number(clicks.meta.duplicates ?? 0));
        setClickJobs(
          Number(clicks.meta.total_jobs ?? clicks.data.length ?? 0),
        );
        const map: Record<string, string> = {};
        for (const row of clicks.data) {
          const model = String(
            row.pricing_model ?? row.pricing_models?.[0] ?? "",
          ).toLowerCase();
          if (!["ppc", "ppr", "ppa", "ppe"].includes(model)) continue;
          const listingId = row.listing?.id;
          if (listingId) map[`listing:${listingId}`] = model;
          const title = String(row.listing?.title ?? row.meta?.title ?? "")
            .trim()
            .toLowerCase();
          if (title) map[`title:${title}`] = model;
        }
        setPricingByJob(map);
      }

      setError(null);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const typeKeys = (["ppc", "ppr", "ppa", "ppe"] as const).filter(
    (type) => byType[type] != null,
  );
  const shownTypes =
    typeKeys.length > 0 ? typeKeys : (["ppc", "ppr", "ppa"] as const);

  const filteredJobs = selectedModel
    ? byJob.filter(
        (job) => resolveJobModel(job, pricingByJob) === selectedModel,
      )
    : byJob;

  function toggleModel(type: PricingModel) {
    setSelectedModel((prev) => (prev === type ? null : type));
    requestAnimationFrame(() => {
      document.getElementById("earnings-by-job")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  return (
    <>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
          {currency} ledger
        </p>
        <h1 className="mt-1 text-3xl font-bold">Earnings / Clicks</h1>
        <p className="mt-2 text-slate-500">
          Earnings and click traffic for the jobs you share — in one place.
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/creator/trust-tier"
          className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-purple-200 hover:shadow-md"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <Shield size={20} />
          </span>
          <span>
            <span className="block font-bold text-[#172b63]">Account features</span>
            <span className="mt-0.5 block text-sm text-slate-500">
              What you can unlock as a creator — PPC, PPR, campaigns, and more.
            </span>
          </span>
        </Link>
        <Link
          href="/creator/payout"
          className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-purple-200 hover:shadow-md"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Landmark size={20} />
          </span>
          <span>
            <span className="block font-bold text-[#172b63]">Payout account</span>
            <span className="mt-0.5 block text-sm text-slate-500">
              Add UPI, bank, or PayPal so approved earnings can be paid out.
            </span>
          </span>
        </Link>
      </div>

      {error ? (
        <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mb-3 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-400">On hold</p>
          <p className="mt-1 text-xl font-bold text-purple-700">
            {formatMoney(totals.pending_usd, currency)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-400">Approved</p>
          <p className="mt-1 text-xl font-bold">
            {formatMoney(totals.approved_usd, currency)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-400">Payable</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">
            {formatMoney(totals.payable_usd, currency)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-400">Paid</p>
          <p className="mt-1 text-xl font-bold">
            {formatMoney(totals.paid_usd, currency)}
          </p>
        </div>
      </div>

      <div id="clicks" className="mb-6 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-400">All clicks</p>
          <p className="mt-1 text-2xl font-bold">{clickTotal}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-400">Counted</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{clickCounted}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-400">Duplicates</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{clickDuplicates}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-400">Job posts</p>
          <p className="mt-1 text-2xl font-bold text-indigo-950">{clickJobs}</p>
        </div>
      </div>

      {Object.keys(byType).length > 0 ? (
        <div
          className={`mb-6 grid gap-3 ${
            shownTypes.length >= 4
              ? "sm:grid-cols-4"
              : shownTypes.length === 2
                ? "sm:grid-cols-2"
                : "sm:grid-cols-3"
          }`}
        >
          {shownTypes.map((type) => {
            const b = byType[type] ?? {};
            const sum =
              Number(b.pending_usd ?? 0) +
              Number(b.approved_usd ?? 0) +
              Number(b.payable_usd ?? 0) +
              Number(b.paid_usd ?? 0);
            const active = selectedModel === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleModel(type)}
                aria-pressed={active}
                className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-purple-200 hover:shadow-md ${
                  active
                    ? MODEL_RING[type]
                    : "border-slate-200"
                }`}
              >
                <p className="text-xs font-bold uppercase text-slate-400">
                  {type}
                </p>
                <p className="text-2xl font-bold">{formatMoney(sum, currency)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Pending {formatMoney(Number(b.pending_usd ?? 0), currency)}
                </p>
                <p className="mt-2 text-[11px] font-semibold text-purple-700">
                  {active ? "Showing these jobs · click to clear" : "Click to see jobs"}
                </p>
              </button>
            );
          })}
        </div>
      ) : null}

      <section id="earnings-by-job">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#172b63]">
              {selectedModel
                ? `Earned via ${selectedModel.toUpperCase()}`
                : "Earnings by job"}
            </h2>
            <p className="text-sm text-slate-500">
              {selectedModel
                ? `Jobs that earned through ${selectedModel.toUpperCase()}.`
                : "Click PPC / PPR / PPA / PPE above to see which jobs paid that way."}
            </p>
          </div>
          {selectedModel ? (
            <button
              type="button"
              onClick={() => setSelectedModel(null)}
              className="text-sm font-semibold text-purple-700 hover:text-purple-900"
            >
              Show all
            </button>
          ) : null}
        </div>

        {byJob.length === 0 && !error ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
            No clicked jobs yet. Share a live job from{" "}
            <Link href="/creator/opportunities" className="font-semibold text-purple-700">
              Opportunities
            </Link>{" "}
            to start earning.
          </p>
        ) : filteredJobs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
            No jobs earned via {selectedModel?.toUpperCase()} yet.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredJobs.map((job) => {
              const clicks = Number(job.click_count ?? 0);
              const dups = Number(job.duplicate_count ?? 0);
              const counted = Number(job.counted_count ?? 0);
              const badge = resolveJobModel(job, pricingByJob);
              const clicksLabel =
                clicks === 0
                  ? "No clicks logged"
                  : clicks === 1
                    ? "1 total click"
                    : `${clicks} total clicks`;
              return (
                <li key={job.key}>
                  <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                        <Briefcase size={18} />
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          MODEL_STYLE[badge] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {badge}
                      </span>
                    </div>
                    <h3 className="mt-3 line-clamp-2 font-bold text-[#172b63]">
                      {job.title}
                    </h3>
                    <p className="mt-3 text-2xl font-bold text-emerald-600">
                      {formatMoney(job.net_usd, currency)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {clicksLabel}
                      {dups > 0 ? ` · ${dups} duplicate` : ""}
                      {job.pending_usd > 0
                        ? ` · ${formatMoney(job.pending_usd, currency)} on hold`
                        : ""}
                    </p>
                    <div className="mt-auto grid grid-cols-3 gap-2 pt-4 text-xs text-slate-500">
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="font-semibold uppercase tracking-wide text-slate-400">
                          Total
                        </p>
                        <p className="mt-0.5 font-bold text-[#172b63]">{clicks}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="font-semibold uppercase tracking-wide text-slate-400">
                          Dupes
                        </p>
                        <p className="mt-0.5 font-bold text-amber-700">{dups}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="font-semibold uppercase tracking-wide text-slate-400">
                          Counted
                        </p>
                        <p className="mt-0.5 font-bold text-[#172b63]">{counted}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Last {formatWhen(job.last_at)}
                    </p>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
