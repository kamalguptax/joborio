"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  MousePointerClick,
  UserPlus,
  TrendingUp,
} from "lucide-react";
import PreferredJobsList from "@/components/job-preferences/PreferredJobsList";
import {
  fetchCreatorDashboard,
  fetchCreatorPreferredJobs,
} from "@/lib/api/creator";
import type { Listing } from "@/lib/api/types";
import { creatorProfilePath } from "@/lib/staticExport";
import { formatMoney } from "@/lib/money";

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

export default function CreatorDashboardPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preferredJobs, setPreferredJobs] = useState<Listing[]>([]);

  useEffect(() => {
    const load = () => {
      fetchCreatorDashboard()
        .then(setData)
        .catch(() =>
          setError("Could not load dashboard. Complete onboarding first."),
        );
      fetchCreatorPreferredJobs()
        .then(setPreferredJobs)
        .catch(() => setPreferredJobs([]));
    };
    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, []);

  const metrics = (data?.metrics ?? {}) as Record<string, number>;
  const earnings = (data?.earnings_usd ?? {}) as Record<string, number>;
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
  const recentTraffic = (data?.recent_traffic ?? []) as Array<{
    id: number;
    event_type: string;
    is_counted: boolean;
    fraud_status?: string;
    ip_address?: string | null;
    meta?: { duplicate_of_event_id?: number; title?: string; clicked_at?: string };
    created_at?: string;
    listing?: { title?: string };
  }>;
  const dedupMinutes = Number(data?.click_dedup_minutes ?? 10);

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
      desc: "Join employer PPC / PPR / PPA programs.",
      stat: `${modules.campaigns_joined ?? 0} joined`,
    },
    {
      href: "/creator/registrations",
      title: "Registrations",
      desc: "PPR signups and email verification status.",
      stat: `${metrics.registrations_pending ?? 0} awaiting verify`,
    },
    {
      href: "/creator/referrals",
      title: "Referrals",
      desc: "Invite creators — bonus + override earnings.",
      stat: "Growth program",
    },
    {
      href: "/creator/earnings",
      title: "Earnings",
      desc: "Ledger, holds, and campaign-wise earnings.",
      stat: `${formatMoney(Number(earnings.payable_usd ?? 0), String(data?.currency ?? "USD"))} payable`,
    },
    {
      href: "/creator/payout",
      title: "Payout account",
      desc: "UPI, bank, or PayPal where your earnings are sent.",
      stat: "Required before payout",
    },
    {
      href: "/creator/settings",
      title: "Settings",
      desc: "Profile, niches, payout method.",
      stat: modules.onboarding_complete ? "Profile complete" : "Finish profile",
    },
  ];

  const statCards = [
    {
      label: "Verified clicks",
      value: metrics.clicks ?? 0,
      icon: MousePointerClick,
      tone: "from-blue-500 to-blue-600",
    },
    {
      label: "Last 7 days",
      value: metrics.clicks_7d ?? 0,
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
      label: "Registrations",
      value: metrics.registrations ?? 0,
      icon: UserPlus,
      tone: "from-pink-500 to-pink-600",
    },
    {
      label: "Pending verify",
      value: metrics.registrations_pending ?? 0,
      icon: ArrowUpRight,
      tone: "from-slate-500 to-slate-600",
    },
  ];

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
          Performance
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-2 text-slate-500">
          Live clicks, registrations, and earnings from your shared links.
        </p>
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map(({ label, value, icon: Icon, tone }) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
              >
                <div
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tone} text-white`}
                >
                  <Icon size={20} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {label}
                </p>
                <p className="mt-1 text-3xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Preferred jobs</h2>
              <Link
                href="/creator/job-preferences"
                className="text-sm font-semibold text-purple-600"
              >
                Edit preferences →
              </Link>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Based on your niches, countries, and remote setting.
            </p>
            <div className="mt-4">
              <PreferredJobsList
                jobs={preferredJobs.slice(0, 5)}
                emptyHint="Set job preferences to see matching listings here."
              />
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Earnings ({String(data?.currency ?? "USD")})</h2>
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
              <div className="mt-8 border-t border-slate-100 pt-6">
                <h3 className="text-sm font-bold text-slate-700">
                  By earning type
                </h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {(["ppc", "ppr"] as const).map((type) => {
                    const bucket = earningsByType[type] ?? {};
                    const total =
                      Number(bucket.pending_usd ?? 0) +
                      Number(bucket.approved_usd ?? 0) +
                      Number(bucket.payable_usd ?? 0) +
                      Number(bucket.paid_usd ?? 0);
                    return (
                      <div
                        key={type}
                        className="rounded-xl bg-slate-50 px-4 py-3 text-sm"
                      >
                        <p className="text-xs font-semibold uppercase text-slate-400">
                          {type}
                        </p>
                        <p className="text-lg font-bold">
                          {formatMoney(total, String(data?.currency ?? "USD"))}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Pending {formatMoney(Number(bucket.pending_usd ?? 0), String(data?.currency ?? "USD"))} ·
                          Paid {formatMoney(Number(bucket.paid_usd ?? 0), String(data?.currency ?? "USD"))}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Creator accounts can earn PPC and PPR. Holds:{" "}
                  {pprMeta.hold_days ?? 3} days after verify.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-lg font-bold">Account type</h2>
              <p className="mt-2 text-2xl font-bold text-purple-700">Creator</p>
              <p className="mt-2 text-sm text-slate-600">
                Features follow your user type. Creators share opportunities and earn;
                employers launch campaigns and hire.
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

          {topListings.length > 0 ? (
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
