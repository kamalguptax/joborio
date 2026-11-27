"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Briefcase, Landmark, Shield } from "lucide-react";
import {
  fetchCreatorClicks,
  fetchCreatorDashboard,
  fetchCreatorTransactions,
} from "@/lib/api/creator";
import { formatMoney } from "@/lib/money";
import PageHeader from "@/components/layout/PageHeader";

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
  const [campaignFilter, setCampaignFilter] = useState<"all" | PricingModel>(
    "all",
  );
  const [dateFilter, setDateFilter] = useState<
    "all" | "1d" | "7d" | "30d" | "90d"
  >("all");
  const [trafficFilter, setTrafficFilter] = useState<
    "all" | "has_traffic" | "has_counted" | "has_duplicate" | "no_traffic"
  >("all");
  const [earningFilter, setEarningFilter] = useState<
    "all" | "has_earning" | "on_hold" | "payable" | "zero"
  >("all");
  const [sortBy, setSortBy] = useState<"recent" | "traffic" | "earning">(
    "recent",
  );

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
    typeKeys.length > 0 ? typeKeys : (["ppc", "ppr", "ppa", "ppe"] as const);

  const filteredJobs = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const cutoff =
      dateFilter === "1d"
        ? now - dayMs
        : dateFilter === "7d"
          ? now - 7 * dayMs
          : dateFilter === "30d"
            ? now - 30 * dayMs
            : dateFilter === "90d"
              ? now - 90 * dayMs
              : null;

    const rows = byJob.filter((job) => {
      const model = resolveJobModel(job, pricingByJob);
      if (campaignFilter !== "all" && model !== campaignFilter) return false;

      if (cutoff != null) {
        const ts = Date.parse(String(job.last_at ?? ""));
        if (!Number.isFinite(ts) || ts < cutoff) return false;
      }

      const clicks = Number(job.click_count ?? 0);
      const counted = Number(job.counted_count ?? 0);
      const dups = Number(job.duplicate_count ?? 0);
      if (trafficFilter === "has_traffic" && clicks <= 0) return false;
      if (trafficFilter === "has_counted" && counted <= 0) return false;
      if (trafficFilter === "has_duplicate" && dups <= 0) return false;
      if (trafficFilter === "no_traffic" && clicks > 0) return false;

      const net = Number(job.net_usd ?? 0);
      const pending = Number(job.pending_usd ?? 0);
      const payable = Number(job.payable_usd ?? 0);
      if (earningFilter === "has_earning" && net <= 0) return false;
      if (earningFilter === "on_hold" && pending <= 0) return false;
      if (earningFilter === "payable" && payable <= 0) return false;
      if (earningFilter === "zero" && net > 0) return false;

      return true;
    });

    rows.sort((a, b) => {
      if (sortBy === "traffic") {
        return Number(b.click_count ?? 0) - Number(a.click_count ?? 0);
      }
      if (sortBy === "earning") {
        return Number(b.net_usd ?? 0) - Number(a.net_usd ?? 0);
      }
      const aTs = Date.parse(String(a.last_at ?? ""));
      const bTs = Date.parse(String(b.last_at ?? ""));
      return (Number.isFinite(bTs) ? bTs : 0) - (Number.isFinite(aTs) ? aTs : 0);
    });

    return rows;
  }, [
    byJob,
    pricingByJob,
    campaignFilter,
    dateFilter,
    trafficFilter,
    earningFilter,
    sortBy,
  ]);

  const filtersActive =
    campaignFilter !== "all" ||
    dateFilter !== "all" ||
    trafficFilter !== "all" ||
    earningFilter !== "all" ||
    sortBy !== "recent";

  function clearFilters() {
    setCampaignFilter("all");
    setDateFilter("all");
    setTrafficFilter("all");
    setEarningFilter("all");
    setSortBy("recent");
  }

  function toggleModel(type: PricingModel) {
    setCampaignFilter((prev) => (prev === type ? "all" : type));
    requestAnimationFrame(() => {
      document.getElementById("earnings-by-campaign")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  const filterField =
    "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#172b63] outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10";

  return (
    <>
      <PageHeader title="Earnings / Clicks" />
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
          {currency} ledger
        </p>
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
          href="/creator/profile?tab=payout"
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
            const active = campaignFilter === type;
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
                  {active ? "Filtered · click to clear" : "Filter campaigns"}
                </p>
              </button>
            );
          })}
        </div>
      ) : null}

      <section id="earnings-by-campaign">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#172b63]">
              {campaignFilter === "all"
                ? "Earnings as per Campaign"
                : `Earnings as per ${campaignFilter.toUpperCase()}`}
            </h2>
            <p className="text-sm text-slate-500">
              Filter by campaign type, date, traffic, and earning.
            </p>
          </div>
          {filtersActive ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-semibold text-purple-700 hover:text-purple-900"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Campaigns
            <select
              value={campaignFilter}
              onChange={(e) =>
                setCampaignFilter(e.target.value as "all" | PricingModel)
              }
              className={filterField}
            >
              <option value="all">All campaigns</option>
              <option value="ppc">PPC</option>
              <option value="ppr">PPR</option>
              <option value="ppa">PPA</option>
              <option value="ppe">PPE</option>
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Date
            <select
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(
                  e.target.value as "all" | "1d" | "7d" | "30d" | "90d",
                )
              }
              className={filterField}
            >
              <option value="all">All time</option>
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Traffic
            <select
              value={trafficFilter}
              onChange={(e) =>
                setTrafficFilter(
                  e.target.value as
                    | "all"
                    | "has_traffic"
                    | "has_counted"
                    | "has_duplicate"
                    | "no_traffic",
                )
              }
              className={filterField}
            >
              <option value="all">All traffic</option>
              <option value="has_traffic">Has clicks</option>
              <option value="has_counted">Has counted</option>
              <option value="has_duplicate">Has duplicates</option>
              <option value="no_traffic">No traffic</option>
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Earning
            <select
              value={earningFilter}
              onChange={(e) =>
                setEarningFilter(
                  e.target.value as
                    | "all"
                    | "has_earning"
                    | "on_hold"
                    | "payable"
                    | "zero",
                )
              }
              className={filterField}
            >
              <option value="all">All earnings</option>
              <option value="has_earning">Has earning</option>
              <option value="on_hold">On hold</option>
              <option value="payable">Has payable</option>
              <option value="zero">Zero earning</option>
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Sort
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "recent" | "traffic" | "earning")
              }
              className={filterField}
            >
              <option value="recent">Most recent</option>
              <option value="traffic">As per traffic</option>
              <option value="earning">As per earning</option>
            </select>
          </label>
        </div>

        {filtersActive ? (
          <p className="mb-3 text-xs text-slate-500">
            Showing {filteredJobs.length} of {byJob.length} campaigns
          </p>
        ) : null}

        {byJob.length === 0 && !error ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
            No clicked campaigns yet. Share a live job from{" "}
            <Link href="/creator/campaigns" className="font-semibold text-purple-700">
              Campaigns
            </Link>{" "}
            to start earning.
          </p>
        ) : filteredJobs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
            No campaigns match these filters.
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
