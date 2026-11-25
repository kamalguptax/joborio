"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  MousePointerClick,
  UserPlus,
  TrendingUp,
  Wallet,
} from "lucide-react";
import LiveCampaignsPanel from "@/components/creator/LiveCampaignsPanel";
import PageHeader from "@/components/layout/PageHeader";
import ReferAndEarnPopup from "@/components/creator/ReferAndEarnPopup";
import {
  fetchCreatorDashboard,
} from "@/lib/api/creator";
import { creatorProfilePath } from "@/lib/staticExport";
import { formatMoney } from "@/lib/money";
import { StatCardsSkeleton } from "@/components/ui/Skeleton";

type RangeKey = "1d" | "yesterday" | "3d" | "7d" | "30d" | "all";
type CampaignKey =
  | "all"
  | "ppc"
  | "ppr"
  | "course"
  | "ppa"
  | "ppe"
  | "branding";

const RANGE_LABEL: Record<Exclude<RangeKey, "all">, string> = {
  "1d": "Today",
  yesterday: "Yesterday",
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
  const [range, setRange] = useState<RangeKey>("1d");
  const [campaign, setCampaign] = useState<CampaignKey>("all");
  const [trafficQuery, setTrafficQuery] = useState("");
  const [trafficStatus, setTrafficStatus] = useState<
    "all" | "payable" | "duplicate" | "mixed"
  >("all");
  const [trafficEvent, setTrafficEvent] = useState<"all" | string>("all");
  const liveCampaignsRef = useRef<HTMLDivElement | null>(null);
  const skipCampaignScroll = useRef(true);

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

  useEffect(() => {
    if (skipCampaignScroll.current) {
      skipCampaignScroll.current = false;
      return;
    }
    liveCampaignsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [campaign]);

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
  const earningsByJob = useMemo(() => {
    const rows = (Array.isArray(data?.earnings_by_job)
      ? data.earnings_by_job
      : []) as Array<{
      title?: string;
      listing_id?: number | null;
      net_usd?: number;
      payable_usd?: number;
      pending_usd?: number;
      approved_usd?: number;
      paid_usd?: number;
    }>;
    const byTitle = new Map<string, (typeof rows)[number]>();
    const byListing = new Map<number, (typeof rows)[number]>();
    for (const row of rows) {
      const titleKey = String(row.title ?? "")
        .trim()
        .toLowerCase();
      if (titleKey) byTitle.set(titleKey, row);
      if (row.listing_id) byListing.set(Number(row.listing_id), row);
    }
    return { byTitle, byListing };
  }, [data]);

  const recentTraffic = useMemo(() => {
    type TrafficRow = (typeof recentTrafficAll)[number];
    type Grouped = TrafficRow & {
      title: string;
      click_count: number;
      counted_count: number;
      duplicate_count: number;
      payable_usd: number;
      total_earning_usd: number;
    };

    const filtered = recentTrafficAll.filter((row) =>
      eventMatchesCampaign(row, campaign),
    );
    const groups = new Map<string, Grouped>();

    for (const row of filtered) {
      const title = row.listing?.title ?? row.meta?.title ?? "Job";
      const key = `${row.event_type}::${title}`;
      const existing = groups.get(key);
      if (!existing) {
        groups.set(key, {
          ...row,
          title,
          click_count: 1,
          counted_count: row.is_counted ? 1 : 0,
          duplicate_count: row.fraud_status === "dedup" || !row.is_counted ? 1 : 0,
          payable_usd: 0,
          total_earning_usd: 0,
        });
        continue;
      }

      existing.click_count += 1;
      if (row.is_counted) existing.counted_count += 1;
      if (row.fraud_status === "dedup" || !row.is_counted) {
        existing.duplicate_count += 1;
      }

      const existingTs = Date.parse(
        String(existing.meta?.clicked_at ?? existing.created_at ?? ""),
      );
      const rowTs = Date.parse(String(row.meta?.clicked_at ?? row.created_at ?? ""));
      // Keep the newest event as the display row; prefer a counted one when tied.
      if (
        (Number.isFinite(rowTs) &&
          (!Number.isFinite(existingTs) || rowTs > existingTs)) ||
        (row.is_counted && !existing.is_counted)
      ) {
        existing.id = row.id;
        existing.is_counted = row.is_counted || existing.is_counted;
        existing.fraud_status = row.is_counted
          ? row.fraud_status
          : existing.fraud_status;
        existing.ip_address = row.ip_address ?? existing.ip_address;
        existing.meta = row.meta ?? existing.meta;
        existing.created_at = row.created_at ?? existing.created_at;
        existing.listing = row.listing ?? existing.listing;
        existing.title = title;
      }
    }

    return Array.from(groups.values())
      .map((row) => {
        const listingId = Number(
          (row.listing as { id?: number } | undefined)?.id ?? 0,
        );
        const earn =
          (listingId > 0 ? earningsByJob.byListing.get(listingId) : undefined) ??
          earningsByJob.byTitle.get(row.title.trim().toLowerCase());
        const payable = Number(earn?.payable_usd ?? 0);
        const total =
          Number(earn?.net_usd ?? 0) ||
          Number(earn?.pending_usd ?? 0) +
            Number(earn?.approved_usd ?? 0) +
            Number(earn?.payable_usd ?? 0) +
            Number(earn?.paid_usd ?? 0);
        return {
          ...row,
          payable_usd: payable,
          total_earning_usd: total,
        };
      })
      .sort((a, b) => {
        const aTs = Date.parse(String(a.meta?.clicked_at ?? a.created_at ?? ""));
        const bTs = Date.parse(String(b.meta?.clicked_at ?? b.created_at ?? ""));
        return (Number.isFinite(bTs) ? bTs : 0) - (Number.isFinite(aTs) ? aTs : 0);
      });
  }, [recentTrafficAll, campaign, earningsByJob]);

  const trafficEventOptions = useMemo(() => {
    const set = new Set<string>();
    for (const row of recentTraffic) {
      if (row.event_type) set.add(String(row.event_type));
    }
    return ["all", ...Array.from(set).sort()];
  }, [recentTraffic]);

  const filteredTraffic = useMemo(() => {
    const q = trafficQuery.trim().toLowerCase();
    return recentTraffic
      .filter((row) => {
        if (trafficEvent !== "all" && row.event_type !== trafficEvent) {
          return false;
        }
        if (trafficStatus === "payable" && row.counted_count <= 0) return false;
        if (trafficStatus === "duplicate" && row.duplicate_count <= 0) {
          return false;
        }
        if (
          trafficStatus === "mixed" &&
          !(row.counted_count > 0 && row.duplicate_count > 0)
        ) {
          return false;
        }
        if (!q) return true;
        const hay = [
          row.title,
          row.event_type,
          row.ip_address,
          row.listing?.type,
          row.listing?.program?.pricing_model,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 25);
  }, [recentTraffic, trafficQuery, trafficStatus, trafficEvent]);

  const trafficSummary = useMemo(() => {
    let clicks = 0;
    let duplicates = 0;
    let earning = 0;
    for (const row of filteredTraffic) {
      clicks += row.click_count;
      duplicates += row.duplicate_count;
      earning += row.total_earning_usd;
    }
    return { clicks, duplicates, earning };
  }, [filteredTraffic]);

  const trafficFilterField =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#172b63] outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10";
  const dedupMinutes = Number(data?.click_dedup_minutes ?? 10);
  const campaignLabel =
    campaignFilters.find((f) => f.id === campaign)?.label ?? "All campaigns";

  const rangeClicks = useMemo(() => {
    if (range === "1d") return metrics.clicks_1d ?? 0;
    if (range === "yesterday") return metrics.clicks_yesterday ?? 0;
    if (range === "3d") return metrics.clicks_3d ?? 0;
    if (range === "7d") return metrics.clicks_7d ?? 0;
    if (range === "30d") return metrics.clicks_30d ?? metrics.clicks_7d ?? 0;
    return metrics.clicks ?? 0;
  }, [metrics, range]);

  const rangeRegs = useMemo(() => {
    if (range === "1d") return metrics.registrations_1d ?? 0;
    if (range === "yesterday") return metrics.registrations_yesterday ?? 0;
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
      href: "/creator/campaigns",
      title: "Campaigns",
      desc: "Browse jobs, PPC / PPR programs, and copy tracked share links.",
      stat: `${modules.campaigns_joined ?? 0} joined · ${modules.listings_on_page ?? 0} on page`,
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
    href: string;
    cta: string;
  }> = [
    {
      label: range === "all" ? "Verified clicks" : `Clicks · ${RANGE_LABEL[range]}`,
      value: rangeClicks,
      icon: MousePointerClick,
      tone: "from-blue-500 to-blue-600",
      href: "/creator/earnings#clicks",
      cta: "View clicks →",
    },
    {
      label: "All-time clicks",
      value: metrics.clicks ?? 0,
      icon: TrendingUp,
      tone: "from-purple-500 to-purple-600",
      href: "/creator/performance",
      cta: "View performance →",
    },
    {
      label: "Duplicate clicks",
      value: metrics.clicks_duplicate ?? 0,
      icon: MousePointerClick,
      tone: "from-amber-500 to-orange-600",
      href: "/creator/earnings#clicks",
      cta: "View clicks →",
    },
    {
      label: range === "all" ? "Registrations" : `Regs · ${RANGE_LABEL[range]}`,
      value: rangeRegs,
      icon: UserPlus,
      tone: "from-pink-500 to-pink-600",
      href: "/creator/registrations",
      cta: "View regs →",
    },
    {
      label: "Pending verify",
      value: metrics.registrations_pending ?? 0,
      icon: ArrowUpRight,
      tone: "from-slate-500 to-slate-600",
      href: "/creator/registrations",
      cta: "View regs →",
    },
    {
      label: "Total earning",
      value: formatMoney(totalEarning, currencyCode),
      icon: Wallet,
      tone: "from-emerald-500 to-teal-600",
      href: "/creator/earnings",
      cta: "Open ledger →",
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

      <PageHeader title="Dashboard" />

      <section
        className="relative isolate mb-6 overflow-hidden rounded-3xl p-6 text-white shadow-[0_28px_60px_-34px_rgba(46,34,151,0.75)] sm:p-8"
        style={{ backgroundImage: "linear-gradient(135deg, #0B1D4F 0%, #14296B 48%, #2E2297 100%)" }}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-violet-500/35 blur-[90px]" />
          <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-sky-400/20 blur-[90px]" />
          <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:linear-gradient(to_right,black,transparent_75%)]" />
        </div>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-indigo-200">
              Welcome back{creator?.handle ? `, @${String(creator.handle).replace(/^@/, "")}` : ""}
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight !text-white sm:text-3xl">
              Here is how your links are performing
            </h2>
            <p className="mt-2 text-sm text-indigo-100/80">
              Showing <span className="font-semibold text-white">{campaignLabel}</span>
              {" · "}live clicks, registrations and earnings.
            </p>
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-3 sm:w-full sm:max-w-md">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
              <p className="text-xs font-medium text-indigo-200">Total earning</p>
              <p className="mt-1 text-2xl font-bold tracking-tight">
                {data ? formatMoney(totalEarning, currencyCode) : "—"}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
              <p className="text-xs font-medium text-indigo-200">Payable now</p>
              <p className="mt-1 text-2xl font-bold tracking-tight">
                {data ? formatMoney(Number(earnings.payable_usd ?? 0), currencyCode) : "—"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="dash-card mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 sm:px-4">
        <p className="text-xs font-semibold text-slate-500 sm:mr-auto">Filters</p>
        <label className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Campaign
          </span>
          <select
            value={campaign}
            onChange={(e) => setCampaign(e.target.value as CampaignKey)}
            className="min-h-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-[#172b63] outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10"
          >
            {campaignFilters.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Date
          </span>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as RangeKey)}
            className="min-h-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-[#172b63] outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10"
          >
            <option value="1d">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="3d">Last 3 days</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </select>
        </label>
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
        <StatCardsSkeleton count={6} className="sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6" />
      ) : null}

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {statCards.map(({ label, value, icon: Icon, tone, href, cta }) => (
              <Link
                key={label}
                href={href}
                className="group relative block overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,27,61,0.04),0_14px_30px_-24px_rgba(15,27,61,0.3)] transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_22px_40px_-26px_rgba(91,53,213,0.45)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-medium text-slate-500">{label}</p>
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${tone} text-white shadow-sm`}
                  >
                    <Icon size={18} />
                  </div>
                </div>
                <p className="mt-3 text-[1.75rem] font-bold leading-none tracking-tight">{value}</p>
                <p className="mt-3 text-xs font-semibold text-emerald-700 opacity-80 group-hover:opacity-100">
                  {cta}
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-8 dash-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold">Earnings by type</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Money you have already earned from verified actions — not the
                  campaign offer rates below.
                </p>
              </div>
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
                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Earned total
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            id="dashboard-live-campaigns"
            ref={liveCampaignsRef}
            className="mt-8 scroll-mt-28"
          >
            <LiveCampaignsPanel
              currency={String(data?.currency ?? "USD")}
              initialTab={campaign}
            />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-5">
            <div className="dash-card p-6 lg:col-span-3">
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
            <div className="mt-8 dash-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold">Recent traffic</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Same job clicks are grouped. Duplicates (same IP + device
                    within {dedupMinutes} min) are logged but not paid.
                  </p>
                </div>
                <Link
                  href="/creator/earnings#clicks"
                  className="text-sm font-semibold text-purple-700"
                >
                  All clicks
                </Link>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Search
                  <input
                    type="search"
                    value={trafficQuery}
                    onChange={(e) => setTrafficQuery(e.target.value)}
                    placeholder="Job, IP, event…"
                    className={`mt-1 ${trafficFilterField}`}
                  />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Status
                  <select
                    value={trafficStatus}
                    onChange={(e) =>
                      setTrafficStatus(
                        e.target.value as
                          | "all"
                          | "payable"
                          | "duplicate"
                          | "mixed",
                      )
                    }
                    className={`mt-1 ${trafficFilterField}`}
                  >
                    <option value="all">All statuses</option>
                    <option value="payable">Payable / counted</option>
                    <option value="duplicate">Has duplicate</option>
                    <option value="mixed">Counted + duplicate</option>
                  </select>
                </label>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Event type
                  <select
                    value={trafficEvent}
                    onChange={(e) => setTrafficEvent(e.target.value)}
                    className={`mt-1 ${trafficFilterField}`}
                  >
                    {trafficEventOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt === "all" ? "All events" : opt}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {(trafficQuery ||
                trafficStatus !== "all" ||
                trafficEvent !== "all") && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">
                    Showing {filteredTraffic.length} of {recentTraffic.length}{" "}
                    job groups
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setTrafficQuery("");
                      setTrafficStatus("all");
                      setTrafficEvent("all");
                    }}
                    className="text-xs font-semibold text-violet-700 hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Total click
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-[#172b63]">
                    {trafficSummary.clicks}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/80">
                    Duplicate
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-amber-800">
                    {trafficSummary.duplicates}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700/80">
                    Total earning
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-800">
                    {formatMoney(
                      trafficSummary.earning,
                      String(data?.currency ?? "USD"),
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                {filteredTraffic.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    No traffic matches these filters.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredTraffic.map((row) => (
                      <article
                        key={`${row.event_type}-${row.title}`}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <p className="line-clamp-2 font-semibold text-[#172b63]">
                          {row.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {row.event_type}
                          {" · "}
                          {formatClickTime(
                            row.meta?.clicked_at ?? row.created_at,
                          )}
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Total click
                            </p>
                            <p className="mt-0.5 text-lg font-bold tabular-nums text-[#172b63]">
                              {row.click_count}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700/80">
                              Duplicate
                            </p>
                            <p
                              className={`mt-0.5 text-lg font-bold tabular-nums ${
                                row.duplicate_count > 0
                                  ? "text-amber-700"
                                  : "text-slate-400"
                              }`}
                            >
                              {row.duplicate_count}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/80">
                              Payable
                            </p>
                            <p
                              className={`mt-0.5 text-lg font-bold tabular-nums ${
                                row.counted_count > 0
                                  ? "text-emerald-700"
                                  : "text-slate-400"
                              }`}
                            >
                              {row.counted_count}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-700/80">
                              Total earning
                            </p>
                            <p className="mt-0.5 text-lg font-bold tabular-nums text-violet-700">
                              {formatMoney(
                                row.total_earning_usd,
                                String(data?.currency ?? "USD"),
                              )}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
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
                  className="group rounded-2xl border border-slate-200 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_18px_34px_-24px_rgba(91,53,213,0.45)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-indigo-950">{m.title}</p>
                    <ArrowUpRight
                      size={16}
                      aria-hidden="true"
                      className="shrink-0 text-slate-300 transition group-hover:text-violet-600"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{m.desc}</p>
                  <p className="mt-2 text-sm font-semibold text-purple-600">{m.stat}</p>
                </Link>
              ))}
            </div>
          </div>

          {topListings.length > 0 && campaign === "all" ? (
            <div className="mt-8 dash-card p-6">
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

          <section className="mt-8 rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-white p-6 shadow-sm">
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

        </>
      ) : null}
    </>
  );
}
