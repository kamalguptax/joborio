"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  MousePointerClick,
  UserPlus,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";
import LiveCampaignsPanel from "@/components/creator/LiveCampaignsPanel";
import ReferAndEarnPopup from "@/components/creator/ReferAndEarnPopup";
import {
  fetchCreatorDashboard,
} from "@/lib/api/creator";
import { creatorProfilePath } from "@/lib/staticExport";
import { formatMoney } from "@/lib/money";

type RangeKey = "3d" | "7d" | "30d" | "all";
type CampaignKey =
  | "all"
  | "ppc"
  | "ppr"
  | "course"
  | "ppa"
  | "ppe"
  | "branding";

const RANGE_LABEL: Record<Exclude<RangeKey, "all">, string> = {
  "3d": "3 days",
  "7d": "7 days",
  "30d": "30 days",
};

const DEFAULT_CAMPAIGN_FILTERS: Array<{ id: CampaignKey; label: string }> = [
  { id: "all", label: "All campaigns" },
  { id: "ppc", label: "Pay Per Click (PPC)" },
  { id: "ppr", label: "Pay Per Registration (PPR)" },
  { id: "course", label: "Courses" },
  { id: "ppa", label: "Pay Per Lead (PPA)" },
  { id: "ppe", label: "Post promote (PPE)" },
  { id: "branding", label: "Brand awareness" },
];

function formatClickTime(value?: string): string {
  if (!value) return "time unknown";
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

function eventMatchesCampaign(
  row: {
    listing?: {
      type?: string;
      program?: { pricing_model?: string; promotion_type?: string };
    };
  },
  campaign: CampaignKey,
): boolean {
  if (campaign === "all") return true;
  const listingType = String(row.listing?.type ?? "").toLowerCase();
  const pricing = String(row.listing?.program?.pricing_model ?? "").toLowerCase();
  const promo = String(row.listing?.program?.promotion_type ?? "").toLowerCase();

  if (campaign === "course") {
    return listingType === "course" || promo === "course";
  }
  if (campaign === "branding") {
    return listingType === "branding" || promo === "branding";
  }
  if (campaign === "ppe") {
    return listingType === "post_promote" || pricing === "ppe" || promo === "post_promote";
  }
  if (campaign === "ppc") {
    return pricing === "ppc" || (!pricing && ["job", "tool", "other", ""].includes(listingType));
  }
  return pricing === campaign;
}

export default function CreatorDashboardPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>("7d");
  const [campaign, setCampaign] = useState<CampaignKey>("all");

  useEffect(() => {
    const load = () => {
      fetchCreatorDashboard()
        .then(setData)
        .catch(() =>
          setError("Could not load dashboard. Complete onboarding first."),
        );
    };
    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, []);

  const campaignFilters = useMemo(() => {
    const fromApi = (data?.campaign_filters ?? []) as Array<{
      id: string;
      label: string;
    }>;
    if (fromApi.length === 0) return DEFAULT_CAMPAIGN_FILTERS;
    return fromApi.map((f) => ({
      id: f.id as CampaignKey,
      label: f.label,
    }));
  }, [data]);

  const byCampaign = (data?.metrics_by_campaign ?? {}) as Record<
    string,
    { metrics?: Record<string, number>; earnings_usd?: Record<string, number> }
  >;
  const campaignBucket = byCampaign[campaign] ?? byCampaign.all ?? {};
  const metrics = (campaignBucket.metrics ??
    data?.metrics ??
    {}) as Record<string, number>;
  const earnings = (campaignBucket.earnings_usd ??
    data?.earnings_usd ??
    {}) as Record<string, number>;
  const earningsByType = (data?.earnings_by_type ?? {}) as Record<
    string,
    Record<string, number>
  >;
  const pprMeta = (data?.ppr ?? {}) as { can_earn?: boolean; hold_days?: number };
  const creator = data?.creator as {
    handle?: string;
    trust_tier?: string;
    approval_status?: string;
  };
  const modules = (data?.modules ?? {}) as Record<string, number | boolean>;
  const topListings = (data?.top_listings ?? []) as Array<{
    listing_id: number;
    clicks: number;
    listing?: { title?: string; company_name?: string };
  }>;
  const recentTrafficAll = (Array.isArray(data?.recent_traffic_all)
    ? data?.recent_traffic_all
    : data?.recent_traffic ?? []) as Array<{
    id: number;
    event_type: string;
    is_counted: boolean;
    fraud_status?: string;
    ip_address?: string | null;
    meta?: { duplicate_of_event_id?: number; title?: string; clicked_at?: string };
    created_at?: string;
    listing?: {
      title?: string;
      type?: string;
      program?: { pricing_model?: string; promotion_type?: string };
    };
  }>;
  const recentTraffic = useMemo(
    () =>
      recentTrafficAll
        .filter((row) => eventMatchesCampaign(row, campaign))
        .slice(0, 12),
    [recentTrafficAll, campaign],
  );
  const campaignEarnings = useMemo(() => {
    const rows = (data?.earnings_by_campaign ?? []) as Array<
      Record<string, unknown>
    >;
    if (campaign === "all") return rows;
    return rows.filter((row) => {
      const pricing = String(row.pricing_model ?? "").toLowerCase();
      const promo = String(row.promotion_type ?? "").toLowerCase();
      if (campaign === "course") return promo === "course" || pricing === "ppr";
      if (campaign === "branding") return promo === "branding";
      if (campaign === "ppe") return pricing === "ppe" || promo === "post_promote";
      return pricing === campaign;
    });
  }, [data, campaign]);
  const dedupMinutes = Number(data?.click_dedup_minutes ?? 10);
  const campaignLabel =
    campaignFilters.find((f) => f.id === campaign)?.label ?? "All campaigns";

  const rangeClicks = useMemo(() => {
    if (range === "3d") return metrics.clicks_3d ?? 0;
    if (range === "7d") return metrics.clicks_7d ?? 0;
    if (range === "30d") return metrics.clicks_30d ?? metrics.clicks_7d ?? 0;
    return metrics.clicks ?? 0;
  }, [metrics, range]);

  const rangeRegs = useMemo(() => {
    if (range === "3d") return metrics.registrations_3d ?? 0;
    if (range === "7d") return metrics.registrations_7d ?? 0;
    if (range === "30d") return metrics.registrations_30d ?? metrics.registrations ?? 0;
    return metrics.registrations ?? 0;
  }, [metrics, range]);

  const totalEarning =
    Number(earnings.pending_usd ?? 0) +
    Number(earnings.approved_usd ?? 0) +
    Number(earnings.payable_usd ?? 0) +
    Number(earnings.paid_usd ?? 0);
  const currencyCode = String(data?.currency ?? "USD");
  const topPerformers = (data?.top_performers ?? null) as {
    period_days?: number;
    leaders?: Array<{
      rank: number;
      handle: string;
      trust_tier?: string | null;
      verified_clicks: number;
      earnings_usd: number;
      is_you?: boolean;
    }>;
    your_rank?: number | null;
    your_clicks?: number;
    your_earnings_usd?: number;
  } | null;
  const leaders = topPerformers?.leaders ?? [];
  const referralSummary = (data?.referrals ?? null) as {
    code?: string;
    signups?: number;
    recent?: Array<{
      id: number;
      handle: string;
      joined_at?: string;
      onboarded?: boolean;
    }>;
  } | null;

  const moduleLinks = [
    {
      href: "/creator/opportunities",
      title: "Opportunities",
      desc: "Copy tracked links for marketplace listings on your page.",
      stat: `${modules.listings_on_page ?? 0} live on page`,
    },
    {
      href: "/creator/campaigns",
      title: "Campaigns",
      desc: "Join employer PPC / PPR / PPA / PPE programs.",
      stat: `${modules.campaigns_joined ?? 0} joined`,
    },
    {
      href: "/creator/performance",
      title: "Performance",
      desc: "PPC · PPR · PPA · PPE earnings, plus PPR registrations per campaign.",
      stat: `${metrics.registrations_pending ?? 0} regs awaiting verify`,
    },
    {
      href: "/creator/referrals",
      title: "Referrals",
      desc: "Invite creators — bonus + override earnings.",
      stat: `${referralSummary?.signups ?? 0} signup${(referralSummary?.signups ?? 0) === 1 ? "" : "s"}`,
    },
    {
      href: "/creator/earnings",
      title: "Earnings",
      desc: "Ledger, account features, and payout account.",
      stat: `${formatMoney(Number(earnings.payable_usd ?? 0), currencyCode)} payable`,
    },
    {
      href: "/creator/settings",
      title: "Settings",
      desc: "Profile, job preferences, and account options.",
      stat: modules.onboarding_complete ? "Profile complete" : "Finish profile",
    },
  ];

  const statCards: Array<{
    label: string;
    value: string | number;
    icon: typeof MousePointerClick;
    tone: string;
    href?: string;
  }> = [
    {
      label: range === "all" ? "Verified clicks" : `Clicks · ${RANGE_LABEL[range]}`,
      value: rangeClicks,
      icon: MousePointerClick,
      tone: "from-blue-500 to-blue-600",
    },
    {
      label: "All-time clicks",
      value: metrics.clicks ?? 0,
      icon: TrendingUp,
      tone: "from-purple-500 to-purple-600",
    },
    {
      label: "Duplicate clicks",
      value: metrics.clicks_duplicate ?? 0,
      icon: MousePointerClick,
      tone: "from-amber-500 to-orange-600",
    },
    {
      label: range === "all" ? "Registrations" : `Regs · ${RANGE_LABEL[range]}`,
      value: rangeRegs,
      icon: UserPlus,
      tone: "from-pink-500 to-pink-600",
    },
    {
      label: "Pending verify",
      value: metrics.registrations_pending ?? 0,
      icon: ArrowUpRight,
      tone: "from-slate-500 to-slate-600",
    },
    {
      label: "Total earning",
      value: formatMoney(totalEarning, currencyCode),
      icon: Wallet,
      tone: "from-emerald-500 to-teal-600",
      href: "/creator/earnings",
    },
  ];

  const highlightTypes =
    campaign === "all"
      ? (["ppc", "ppr", "ppa", "ppe"] as const)
      : campaign === "course"
        ? (["ppr"] as const)
        : campaign === "branding"
          ? (["ppc"] as const)
          : ([campaign] as const);

  return (
    <>
      <ReferAndEarnPopup />

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
            Overview
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-slate-500">
            Showing <span className="font-semibold text-slate-700">{campaignLabel}</span>
            {" · "}
            live clicks, registrations, and earnings.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex min-w-[12rem] flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Campaign
            </span>
            <select
              value={campaign}
              onChange={(e) => setCampaign(e.target.value as CampaignKey)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#172b63] shadow-sm outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10"
            >
              {campaignFilters.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[10rem] flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Date range
            </span>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as RangeKey)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#172b63] shadow-sm outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10"
            >
              <option value="3d">Last 3 days</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </label>
        </div>
      </div>

      {creator?.approval_status && creator.approval_status !== "approved" ? (
        <p className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {creator.approval_status === "rejected"
            ? "Your creator account was not approved. Update your profile links and contact support."
            : "Your creator account is pending manual approval. You can explore the dashboard while we review your LinkedIn, Instagram, community, or website links."}
        </p>
      ) : null}

      {error ? (
        <p className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}{" "}
          <Link href="/onboarding" className="font-semibold underline">
            Complete onboarding
          </Link>
        </p>
      ) : null}

      {!data && !error ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : null}

      {data ? (
        <>
          <section className="mb-8 rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-violet-700">
                  Refer & Earn
                </p>
                <h2 className="mt-1 text-xl font-bold text-[#172b63]">
                  Your referrals
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Code{" "}
                  <span className="font-mono font-bold text-violet-700">
                    {referralSummary?.code ?? "—"}
                  </span>
                  {" · "}
                  {referralSummary?.signups ?? 0} creator
                  {(referralSummary?.signups ?? 0) === 1 ? "" : "s"} joined with your
                  invite.
                </p>
              </div>
              <Link
                href="/creator/referrals"
                className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-bold text-white"
              >
                Open Referrals →
              </Link>
            </div>
            {(referralSummary?.recent?.length ?? 0) > 0 ? (
              <ul className="mt-4 space-y-2">
                {referralSummary!.recent!.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-violet-100 bg-white px-4 py-3 text-sm"
                  >
                    <Link
                      href={creatorProfilePath(row.handle)}
                      className="font-semibold text-[#172b63] hover:text-purple-700"
                    >
                      @{row.handle}
                    </Link>
                    <span className="text-xs text-slate-500">
                      {row.onboarded ? "Onboarded" : "Signed up"}
                      {row.joined_at
                        ? ` · ${new Date(row.joined_at).toLocaleDateString()}`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                No one has joined with your code yet. Share your invite link from
                Referrals.
              </p>
            )}
          </section>

          <section className="mb-8 overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-purple-50 p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-700">
                  <Trophy size={16} />
                  Top performers
                </p>
                <h2 className="mt-1 text-xl font-bold text-[#172b63]">
                  {(topPerformers?.period_days ?? 30) > 0
                    ? `Top earners · last ${topPerformers?.period_days} days`
                    : "Top earners"}
                </h2>
                <p className="mt-1 max-w-xl text-sm text-slate-600">
                  Creators ranked by earnings — climb the list and stay motivated.
                </p>
              </div>
              <Link
                href="/leaderboard"
                className="rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-800 shadow-sm"
              >
                Full leaderboard →
              </Link>
            </div>

            {topPerformers?.your_rank ? (
              <div className="mt-4 rounded-2xl border border-amber-100 bg-white/80 px-4 py-3 text-sm">
                You’re{" "}
                <span className="font-bold text-purple-700">
                  #{topPerformers.your_rank}
                </span>
                {" · "}
                {formatMoney(Number(topPerformers.your_earnings_usd ?? 0), currencyCode)}{" "}
                earned
                {topPerformers.your_rank > 1
                  ? " — keep going to catch the next spot."
                  : " — you’re on top!"}
              </div>
            ) : null}

            {leaders.length > 0 ? (
              <ol className="mt-4 space-y-2">
                {leaders.map((row) => (
                  <li
                    key={`${row.rank}-${row.handle}`}
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-sm ${
                      row.is_you
                        ? "border-purple-300 bg-purple-50 ring-1 ring-purple-200"
                        : "border-slate-100 bg-white"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          row.rank === 1
                            ? "bg-amber-300 text-amber-900"
                            : row.rank === 2
                              ? "bg-slate-200 text-slate-700"
                              : row.rank === 3
                                ? "bg-orange-300 text-orange-950"
                                : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        #{row.rank}
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={creatorProfilePath(row.handle)}
                          className="font-semibold text-[#172b63] hover:text-purple-700"
                        >
                          @{row.handle}
                          {row.is_you ? (
                            <span className="ml-2 text-xs font-bold uppercase text-purple-600">
                              you
                            </span>
                          ) : null}
                        </Link>
                        {row.trust_tier ? (
                          <p className="text-[11px] uppercase tracking-wide text-slate-400">
                            {row.trust_tier}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <p className="font-bold tabular-nums text-emerald-700">
                      {formatMoney(Number(row.earnings_usd ?? 0), currencyCode)}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                No top performers yet. Start earning to appear on this list.
              </p>
            )}
          </section>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {statCards.map(({ label, value, icon: Icon, tone, href }) => {
              const body = (
                <>
                  <div
                    className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tone} text-white`}
                  >
                    <Icon size={20} />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                  <p className="mt-1 text-3xl font-bold">{value}</p>
                  {href ? (
                    <p className="mt-2 text-xs font-semibold text-emerald-700">
                      Open ledger →
                    </p>
                  ) : null}
                </>
              );
              const className =
                "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-purple-200 hover:shadow-md";
              return href ? (
                <Link key={label} href={href} className={`block ${className}`}>
                  {body}
                </Link>
              ) : (
                <div key={label} className={className}>
                  {body}
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Promote link types</h2>
              <Link
                href="/creator/performance"
                className="text-sm font-semibold text-purple-600"
              >
                Full performance →
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(["ppc", "ppr", "ppa", "ppe"] as const).map((type) => {
                const bucket = earningsByType[type] ?? {};
                const total =
                  Number(bucket.pending_usd ?? 0) +
                  Number(bucket.approved_usd ?? 0) +
                  Number(bucket.payable_usd ?? 0) +
                  Number(bucket.paid_usd ?? 0);
                const active = highlightTypes.includes(type as never);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setCampaign(
                        type === "ppe"
                          ? "ppe"
                          : (type as CampaignKey),
                      )
                    }
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      active
                        ? "border-purple-300 bg-purple-50 ring-2 ring-purple-200"
                        : "border-slate-100 bg-slate-50 opacity-70"
                    }`}
                  >
                    <p className="text-xs font-bold uppercase text-slate-400">{type}</p>
                    <p className="mt-1 text-lg font-bold">
                      {formatMoney(total, String(data?.currency ?? "USD"))}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {campaignEarnings.length > 0 ? (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">Campaigns in this view</h2>
              <ul className="mt-4 space-y-2 text-sm">
                {campaignEarnings.slice(0, 8).map((row, idx) => (
                  <li
                    key={String(row.id ?? idx)}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold">{String(row.title ?? "Campaign")}</p>
                      <p className="text-xs uppercase text-slate-500">
                        {String(row.pricing_model ?? "link")}
                      </p>
                    </div>
                    <p className="font-bold text-purple-700">
                      {formatMoney(
                        Number(row.net_usd ?? row.gross_usd ?? 0),
                        String(data?.currency ?? "USD"),
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-8">
            <LiveCampaignsPanel
              currency={String(data?.currency ?? "USD")}
              initialTab={campaign}
            />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  Earnings · {campaignLabel} ({String(data?.currency ?? "USD")})
                </h2>
                <Link
                  href="/creator/earnings"
                  className="text-sm font-semibold text-purple-600"
                >
                  View ledger →
                </Link>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  ["Pending", earnings.pending_usd],
                  ["Approved", earnings.approved_usd],
                  ["Payable", earnings.payable_usd],
                  ["Paid", earnings.paid_usd],
                ].map(([label, val]) => (
                  <div key={String(label)}>
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="text-xl font-bold">
                      {formatMoney(Number(val ?? 0), String(data?.currency ?? "USD"))}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Filtered by campaign type. Holds: {pprMeta.hold_days ?? 3} days after
                verify.
              </p>
            </div>

            <div className="rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-lg font-bold">Account type</h2>
              <p className="mt-2 text-2xl font-bold text-purple-700">Creator</p>
              <p className="mt-2 text-sm text-slate-600">
                Switch campaign above to see PPC, PPR, Courses, and other dashboards
                separately.
              </p>
              <Link
                href="/creator/trust-tier"
                className="mt-4 inline-block text-sm font-semibold text-purple-700 hover:text-blue-600"
              >
                View creator features →
              </Link>
            </div>
          </div>

          {recentTraffic.length > 0 ? (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold">Recent traffic</h2>
                <Link href="/creator/clicks" className="text-sm font-semibold text-purple-700">
                  All clicks
                </Link>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Duplicate clicks (same IP + device within {dedupMinutes} min) are
                logged but not paid.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {recentTraffic.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <span>
                      {row.event_type} · {row.listing?.title ?? row.meta?.title ?? "Job"}
                      <span className="mt-1 block text-xs font-normal text-slate-500">
                        {row.ip_address || "IP unknown"}
                        {" · "}
                        {formatClickTime(row.meta?.clicked_at ?? row.created_at)}
                      </span>
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        row.fraud_status === "dedup"
                          ? "text-amber-700"
                          : row.is_counted
                            ? "text-emerald-700"
                            : "text-slate-500"
                      }`}
                    >
                      {row.fraud_status === "dedup"
                        ? `Duplicate${row.meta?.duplicate_of_event_id ? ` of #${row.meta.duplicate_of_event_id}` : ""}`
                        : row.is_counted
                          ? "Counted"
                          : row.fraud_status ?? "Not counted"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-8 rounded-3xl border border-dashed border-purple-200 bg-white/80 p-6">
            <h2 className="font-bold">Studio modules</h2>
            <p className="mt-1 text-sm text-slate-500">
              Jump to each part of your creator account.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {moduleLinks.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-purple-200 hover:shadow-sm"
                >
                  <p className="font-bold text-indigo-950">{m.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{m.desc}</p>
                  <p className="mt-2 text-sm font-semibold text-purple-600">{m.stat}</p>
                </Link>
              ))}
            </div>
          </div>

          {topListings.length > 0 && campaign === "all" ? (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-bold">Top listings by clicks</h2>
              <ul className="mt-4 space-y-2 text-sm">
                {topListings.map((row) => (
                  <li
                    key={row.listing_id}
                    className="flex justify-between gap-2 border-b border-slate-50 py-2 last:border-0"
                  >
                    <span>
                      {row.listing?.title ?? `Listing #${row.listing_id}`}
                      {row.listing?.company_name
                        ? ` · ${row.listing.company_name}`
                        : ""}
                    </span>
                    <span className="font-semibold text-purple-600">{row.clicks} clicks</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-8 rounded-3xl border border-dashed border-purple-200 bg-white/80 p-6">
            <h2 className="font-bold">Quick actions</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/creator/opportunities"
                className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-bold text-white"
              >
                Copy tracked links
              </Link>
              {creator?.handle ? (
                <Link
                  href={creatorProfilePath(creator.handle)}
                  className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Preview public page
                </Link>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
