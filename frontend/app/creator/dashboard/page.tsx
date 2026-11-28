"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  Gift,
  Users,
  MousePointerClick,
  Search,
  UserPlus,
  TrendingUp,
  Wallet,
} from "lucide-react";
import LiveCampaignsPanel from "@/components/creator/LiveCampaignsPanel";
import PageHeader from "@/components/layout/PageHeader";
import ReferAndEarnPopup from "@/components/creator/ReferAndEarnPopup";
import {
  fetchCreatorDashboard,
  fetchTrackLink,
} from "@/lib/api/creator";
import { formatMoney } from "@/lib/money";
import { StatCardsSkeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";

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

function eventChipClass(type: string): string {
  switch (type) {
    case "job_apply":
      return "bg-violet-50 text-violet-700";
    case "click":
      return "bg-sky-50 text-sky-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

/** Copies text that is still being fetched. Uses a ClipboardItem promise so Safari keeps the click permission. */
async function copyTextLater(getText: Promise<string>): Promise<void> {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof ClipboardItem !== "undefined"
  ) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": getText.then((t) => new Blob([t], { type: "text/plain" })),
        }),
      ]);
      return;
    } catch {
      /* fall through to the plain approach below */
    }
  }
  const text = await getText;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}

function ReferralMiniCard({
  code,
  signups,
}: {
  code?: string;
  signups: number;
}) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const el = document.createElement("textarea");
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-white/20 via-white/10 to-white/5 p-px shadow-[0_18px_40px_-20px_rgba(0,0,0,0.6)] sm:flex-1 xl:w-72 xl:flex-none">
      <div className="relative h-full rounded-[15px] bg-[#101a55]/80 p-3.5 backdrop-blur-xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-fuchsia-500/30 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-pink-500 text-white shadow-lg shadow-pink-500/30">
            <Gift className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight !text-white">
              Refer &amp; Earn
            </p>
            <p className="text-[11px] leading-snug text-indigo-200">
              Invite creators, earn from their revenue
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/15">
            <Users className="h-3 w-3" aria-hidden="true" />
            {signups}
          </span>
        </div>

        <div className="relative mt-3 flex items-center gap-2 rounded-xl border border-dashed border-white/25 bg-white/5 py-1.5 pl-3 pr-1.5">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-widest text-indigo-300">
              Your code
            </p>
            <p className="truncate font-mono text-base font-bold tracking-[0.18em] text-white">
              {code ?? "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void copyCode()}
            disabled={!code}
            aria-label="Copy referral code"
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              copied
                ? "bg-emerald-400 text-emerald-950"
                : "bg-white text-[#0B3D91] hover:bg-indigo-50"
            }`}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <Link
          href="/creator/referrals"
          className="group relative mt-2.5 flex items-center justify-between text-[11px] font-semibold !text-indigo-100 transition hover:!text-white"
        >
          <span>
            {signups === 0
              ? "No one joined yet · share your invite"
              : `${signups} creator${signups === 1 ? "" : "s"} joined with your code`}
          </span>
          <span className="inline-flex items-center gap-0.5 text-white">
            Open
            <ArrowUpRight
              className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </Link>
      </div>
    </div>
  );
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
  const [trafficSort, setTrafficSort] = useState<"latest" | "clicks">("latest");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyBusyKey, setCopyBusyKey] = useState<string | null>(null);
  const trackUrlCache = useRef(new Map<number, string>());
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
      .sort((a, b) =>
        trafficSort === "clicks"
          ? b.click_count - a.click_count ||
            b.total_earning_usd - a.total_earning_usd
          : 0,
      )
      .slice(0, 25);
  }, [recentTraffic, trafficQuery, trafficStatus, trafficEvent, trafficSort]);

  const trafficSummary = useMemo(() => {
    let clicks = 0;
    let duplicates = 0;
    let payable = 0;
    let earning = 0;
    for (const row of filteredTraffic) {
      clicks += row.click_count;
      duplicates += row.duplicate_count;
      payable += row.counted_count;
      earning += row.total_earning_usd;
    }
    return { clicks, duplicates, payable, earning };
  }, [filteredTraffic]);

  const trafficFilterField =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#172b63] outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10";
  const trafficLabel =
    "block text-[11px] font-semibold uppercase tracking-wide text-slate-400";
  const trafficControl = `${trafficFilterField} h-10`;
  const hasTrafficFilters =
    Boolean(trafficQuery) ||
    trafficStatus !== "all" ||
    trafficEvent !== "all" ||
    trafficSort !== "latest";
  const clearTrafficFilters = () => {
    setTrafficQuery("");
    setTrafficStatus("all");
    setTrafficEvent("all");
    setTrafficSort("latest");
  };
  const dedupMinutes = Number(data?.click_dedup_minutes ?? 10);

  const copyTrackedLink = async (key: string, listingId: number) => {
    if (copyBusyKey || listingId <= 0) return;
    setCopyBusyKey(key);
    try {
      const cached = trackUrlCache.current.get(listingId);
      const urlPromise = cached
        ? Promise.resolve(cached)
        : fetchTrackLink(listingId).then((res) => {
            trackUrlCache.current.set(listingId, res.tracked_url);
            return res.tracked_url;
          });
      await copyTextLater(urlPromise);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800);
    } catch {
      toast.error("Could not copy the link. Please try again.");
    } finally {
      setCopyBusyKey(null);
    }
  };
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
      href: "/creator/profile",
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
        className="relative isolate mb-6 overflow-hidden rounded-3xl p-6 text-white shadow-[0_28px_60px_-34px_rgba(10,61,145,0.75)] sm:p-8"
        style={{ backgroundImage: "linear-gradient(135deg, #0A2150 0%, #0B3D91 48%, #0A3D91 100%)" }}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-violet-500/35 blur-[90px]" />
          <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-sky-400/20 blur-[90px]" />
          <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:linear-gradient(to_right,black,transparent_75%)]" />
        </div>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
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
          <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch xl:w-auto xl:shrink-0">
            <ReferralMiniCard
              code={referralSummary?.code}
              signups={referralSummary?.signups ?? 0}
            />
          <div className="grid min-w-0 grid-cols-2 gap-3 sm:w-56 sm:grid-cols-1 sm:grid-rows-2 xl:w-44">
            <div className="rounded-2xl bg-white/10 p-3.5 ring-1 ring-white/15 backdrop-blur">
              <p className="text-xs font-medium text-indigo-200">Total earning</p>
              <p className="mt-0.5 text-xl font-bold tracking-tight">
                {data ? formatMoney(totalEarning, currencyCode) : "—"}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3.5 ring-1 ring-white/15 backdrop-blur">
              <p className="text-xs font-medium text-indigo-200">Payable now</p>
              <p className="mt-0.5 text-xl font-bold tracking-tight">
                {data ? formatMoney(Number(earnings.payable_usd ?? 0), currencyCode) : "—"}
              </p>
            </div>
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
                className="group relative block overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(10,33,80,0.04),0_14px_30px_-24px_rgba(10,33,80,0.3)] transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_22px_40px_-26px_rgba(10,95,207,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
              >
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone} opacity-80`}
                />
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-medium text-slate-500">{label}</p>
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${tone} text-white shadow-sm`}
                  >
                    <Icon size={18} />
                  </div>
                </div>
                <p className="mt-3 text-[1.75rem] font-bold leading-none tracking-tight tabular-nums text-[#0A2150]">
                  {value}
                </p>
                <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-700 opacity-80 transition group-hover:opacity-100">
                  {cta}
                  <ArrowUpRight
                    size={12}
                    aria-hidden="true"
                    className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-8 dash-card p-5 sm:p-6">
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
                className="inline-flex items-center gap-1 rounded-full border border-violet-200 px-3 py-1 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
              >
                Full performance
                <ArrowUpRight size={14} aria-hidden="true" />
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
                    aria-pressed={active}
                    className={`rounded-xl border px-4 py-3 text-left transition duration-200 hover:-translate-y-0.5 ${
                      active
                        ? "border-violet-300 bg-gradient-to-br from-violet-50 to-white shadow-sm ring-1 ring-violet-200"
                        : "border-slate-200 bg-slate-50/70 opacity-80 hover:border-violet-200 hover:opacity-100"
                    }`}
                  >
                    <p
                      className={`inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                        active ? "bg-violet-600 text-white" : "bg-slate-200/70 text-slate-500"
                      }`}
                    >
                      {type}
                    </p>
                    <p className="mt-2 text-lg font-bold tabular-nums text-[#0A2150]">
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

          <div className="mt-8 ">
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
          </div>

          {recentTraffic.length > 0 ? (
            <section
              aria-labelledby="recent-traffic-heading"
              className="mt-8 dash-card p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <h2
                    id="recent-traffic-heading"
                    className="text-lg font-bold text-[#172b63]"
                  >
                    Recent traffic
                  </h2>
                  <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
                    Same job clicks are grouped. Duplicates (same IP + device
                    within {dedupMinutes} min) are logged but not paid.
                  </p>
                </div>
                <Link
                  href="/creator/earnings#clicks"
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-violet-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
                >
                  All clicks
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className={trafficLabel}>
                  Search
                  <span className="relative mt-1.5 block">
                    <Search
                      size={15}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="search"
                      value={trafficQuery}
                      onChange={(e) => setTrafficQuery(e.target.value)}
                      placeholder="Job, IP, event…"
                      className={`${trafficControl} pl-9`}
                    />
                  </span>
                </label>
                <label className={trafficLabel}>
                  Status
                  <span className="relative mt-1.5 block">
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
                      className={`${trafficControl} appearance-none pr-9`}
                    >
                      <option value="all">All statuses</option>
                      <option value="payable">Payable / counted</option>
                      <option value="duplicate">Has duplicate</option>
                      <option value="mixed">Counted + duplicate</option>
                    </select>
                    <ChevronDown
                      size={16}
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </span>
                </label>
                <label className={trafficLabel}>
                  Event type
                  <span className="relative mt-1.5 block">
                    <select
                      value={trafficEvent}
                      onChange={(e) => setTrafficEvent(e.target.value)}
                      className={`${trafficControl} appearance-none pr-9`}
                    >
                      {trafficEventOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt === "all" ? "All events" : opt}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </span>
                </label>
                <label className={trafficLabel}>
                  Sort by
                  <span className="relative mt-1.5 block">
                    <select
                      value={trafficSort}
                      onChange={(e) =>
                        setTrafficSort(e.target.value as "latest" | "clicks")
                      }
                      className={`${trafficControl} appearance-none pr-9`}
                    >
                      <option value="latest">Latest first</option>
                      <option value="clicks">High clicks first</option>
                    </select>
                    <ChevronDown
                      size={16}
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </span>
                </label>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  {
                    label: "Total click",
                    value: String(trafficSummary.clicks),
                    Icon: MousePointerClick,
                    card: "border-slate-200 bg-slate-50",
                    icon: "bg-white text-slate-500 ring-slate-200",
                    text: "text-[#172b63]",
                    sub: "text-slate-500",
                  },
                  {
                    label: "Duplicate click",
                    value: String(trafficSummary.duplicates),
                    Icon: Copy,
                    card: "border-amber-200 bg-amber-50/70",
                    icon: "bg-white text-amber-600 ring-amber-200",
                    text: "text-amber-800",
                    sub: "text-amber-700/80",
                  },
                  {
                    label: "Payable",
                    value: String(trafficSummary.payable),
                    Icon: Check,
                    card: "border-emerald-200 bg-emerald-50/70",
                    icon: "bg-white text-emerald-600 ring-emerald-200",
                    text: "text-emerald-800",
                    sub: "text-emerald-700/80",
                  },
                  {
                    label: "Total earning",
                    value: formatMoney(
                      trafficSummary.earning,
                      String(data?.currency ?? "USD"),
                    ),
                    Icon: Wallet,
                    card: "border-violet-200 bg-violet-50/70",
                    icon: "bg-white text-violet-600 ring-violet-200",
                    text: "text-violet-800",
                    sub: "text-violet-700/80",
                  },
                ].map(({ label, value, Icon, card, icon, text, sub }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 ${card}`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${icon}`}
                    >
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`truncate text-[11px] font-semibold uppercase tracking-wide ${sub}`}
                      >
                        {label}
                      </p>
                      <p
                        className={`truncate text-2xl font-bold leading-tight tabular-nums ${text}`}
                      >
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {filteredTraffic.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm text-slate-500">
                    No traffic matches these filters.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[830px] table-fixed border-collapse text-left text-sm">
                      <colgroup>
                        <col />
                        <col className="w-[100px]" />
                        <col className="w-[130px]" />
                        <col className="w-[100px]" />
                        <col className="w-[130px]" />
                        <col className="w-[130px]" />
                      </colgroup>
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          <th scope="col" className="px-4 py-3">
                            Job
                          </th>
                          <th scope="col" className="px-4 py-3 text-right">
                            Total click
                          </th>
                          <th scope="col" className="px-4 py-3 text-right">
                            Duplicate click
                          </th>
                          <th scope="col" className="px-4 py-3 text-right">
                            Payable
                          </th>
                          <th scope="col" className="px-4 py-3 text-right">
                            Total earning
                          </th>
                          <th scope="col" className="px-4 py-3 text-right">
                            Link
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTraffic.map((row) => {
                          const rowKey = `${row.event_type}-${row.title}`;
                          const listingId = Number(
                            (row.listing as { id?: number } | undefined)?.id ??
                              0,
                          );
                          const copied = copiedKey === rowKey;
                          const busy = copyBusyKey === rowKey;
                          return (
                            <tr
                              key={rowKey}
                              className="transition-colors hover:bg-slate-50/70"
                            >
                              <td className="px-4 py-3.5 align-middle">
                                <p
                                  className="line-clamp-2 font-semibold leading-snug text-[#172b63]"
                                  title={row.title}
                                >
                                  {row.title}
                                </p>
                                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                                  <span
                                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${eventChipClass(
                                      row.event_type,
                                    )}`}
                                  >
                                    {row.event_type}
                                  </span>
                                  <span>
                                    {formatClickTime(
                                      row.meta?.clicked_at ?? row.created_at,
                                    )}
                                  </span>
                                </p>
                              </td>
                              <td className="px-4 py-3.5 text-right align-middle text-[15px] font-bold tabular-nums text-[#172b63]">
                                {row.click_count}
                              </td>
                              <td className="px-4 py-3.5 text-right align-middle">
                                {row.duplicate_count > 0 ? (
                                  <span className="inline-flex min-w-8 justify-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[15px] font-bold tabular-nums text-amber-700 ring-1 ring-amber-200">
                                    {row.duplicate_count}
                                  </span>
                                ) : (
                                  <span className="text-[15px] font-bold tabular-nums text-slate-300">
                                    0
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-right align-middle">
                                {row.counted_count > 0 ? (
                                  <span className="inline-flex min-w-8 justify-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[15px] font-bold tabular-nums text-emerald-700 ring-1 ring-emerald-200">
                                    {row.counted_count}
                                  </span>
                                ) : (
                                  <span className="text-[15px] font-bold tabular-nums text-slate-300">
                                    0
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-right align-middle text-[15px] font-bold tabular-nums text-violet-700">
                                {formatMoney(
                                  row.total_earning_usd,
                                  String(data?.currency ?? "USD"),
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-right align-middle">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void copyTrackedLink(rowKey, listingId)
                                  }
                                  disabled={listingId <= 0 || busy}
                                  title={
                                    listingId <= 0
                                      ? "No tracked link for this row"
                                      : "Copy your tracked share link"
                                  }
                                  className={`inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 disabled:cursor-not-allowed disabled:opacity-40 ${
                                    copied
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
                                  }`}
                                >
                                  {copied ? (
                                    <Check size={14} aria-hidden="true" />
                                  ) : (
                                    <Copy size={14} aria-hidden="true" />
                                  )}
                                  {copied
                                    ? "Copied"
                                    : busy
                                      ? "Copying…"
                                      : "Copy link"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-500">
                  <p>
                    Showing {filteredTraffic.length} of {recentTraffic.length}{" "}
                    job groups
                  </p>
                  {hasTrafficFilters ? (
                    <button
                      type="button"
                      onClick={clearTrafficFilters}
                      className="font-semibold text-violet-700 hover:underline"
                    >
                      Clear filters
                    </button>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          <div className="mt-8 dash-card bg-gradient-to-br from-white to-violet-50/40 p-5 sm:p-6">
            <h2 className="text-lg font-bold">Studio modules</h2>
            <p className="mt-1 text-sm text-slate-500">
              Jump to each part of your creator account.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {moduleLinks.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_18px_34px_-24px_rgba(10,95,207,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
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
            <div className="mt-8 dash-card p-5 sm:p-6">
              <h2 className="text-lg font-bold">Top listings by clicks</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {topListings.map((row, i) => {
                  const max = Math.max(...topListings.map((r) => Number(r.clicks) || 0), 1);
                  const pct = Math.max(4, Math.round(((Number(row.clicks) || 0) / max) * 100));
                  return (
                    <li key={row.listing_id} className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-xs font-bold text-violet-700">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="truncate font-medium text-[#0A2150]">
                            {row.listing?.title ?? `Listing #${row.listing_id}`}
                            {row.listing?.company_name ? (
                              <span className="font-normal text-slate-500">
                                {" · "}
                                {row.listing.company_name}
                              </span>
                            ) : null}
                          </span>
                          <span className="shrink-0 text-xs font-semibold tabular-nums text-violet-700">
                            {row.clicks} clicks
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
}
