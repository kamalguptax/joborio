"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchPublisherDashboard,
  type PublisherDashboardRange,
} from "@/lib/api/publisher";
import type {
  PublisherDashboard,
  PublisherDashboardCommunity,
  PublisherRecentActivity,
} from "@/lib/api/publisherAuth";
import { ApiClientError } from "@/lib/api/client";
import { PageSkeleton } from "@/components/ui/Skeleton";

type Dash = PublisherDashboard & {
  communities?: PublisherDashboardCommunity[];
  recent_communities?: PublisherDashboardCommunity[];
  recent_activity?: PublisherRecentActivity[];
  range?: { key: string; label: string };
};

const RANGE_OPTIONS: Array<{ id: PublisherDashboardRange; label: string }> = [
  { id: "1d", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "3d", label: "Last 3 days" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "all", label: "All time" },
];

function relativeTime(iso: string | null | undefined) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

type StatCard = {
  label: string;
  value: string | number;
  href: string;
  hint?: string;
};

function money(n: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
}

export default function PublisherDashboardPage() {
  const [data, setData] = useState<Dash | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<PublisherDashboardRange>("1d");
  const [loading, setLoading] = useState(false);

  const load = useCallback((nextRange: PublisherDashboardRange) => {
    setLoading(true);
    setError(null);
    fetchPublisherDashboard(nextRange)
      .then(setData)
      .catch((err) =>
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load publisher dashboard.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(range);
  }, [load, range]);

  if (error && !data) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {error}
      </p>
    );
  }

  if (!data) {
    return <PageSkeleton />;
  }

  const {
    publisher,
    overview,
    membership,
    network,
    communities = [],
    recent_communities = [],
    recent_activity = [],
  } = data;
  const canFinance =
    membership.can_view_financials !== false && membership.role === "owner";
  const communityList =
    communities.length > 0 ? communities : recent_communities;
  const rangeLabel =
    RANGE_OPTIONS.find((opt) => opt.id === range)?.label ||
    data.range?.label ||
    "Today";

  const cards: StatCard[] = [
    {
      label: "Communities",
      value: overview.communities,
      href: "/publisher/communities",
      hint: "Manage communities",
    },
    {
      label: "Members",
      value: overview.members,
      href: "/publisher/network",
      hint: "View network",
    },
    {
      label: "Live campaigns",
      value: overview.live_campaigns ?? overview.active_campaigns,
      href: "/publisher/marketplace",
      hint: "Marketplace offers",
    },
    {
      label: "Running campaigns",
      value: overview.running_campaigns ?? overview.active_campaigns,
      href: "/publisher/marketplace",
      hint: "Assigned & active",
    },
    {
      label: "Pending invites",
      value: overview.pending_invites,
      href: "/publisher/network",
      hint: "Invite members",
    },
  ];

  if (canFinance) {
    cards.push({
      label: range === "all" ? "Overall earnings" : `Earnings · ${rangeLabel}`,
      value: money(overview.overall_earnings_usd),
      href: "/publisher/earnings",
      hint: range === "all" ? "Lifetime commercial net" : `Net in ${rangeLabel.toLowerCase()}`,
    });
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
            Overview
          </p>
          <h1 className="mt-1 text-3xl font-bold">
            Welcome, {publisher.display_name}
          </h1>
          <p className="mt-2 text-slate-500">
            {publisher.code} · @{publisher.username} · {membership.role}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            <Link
              href="/publisher/communities"
              className="rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-bold text-white"
            >
              Create community
            </Link>
            <Link
              href="/publisher/network"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Performance Team
            </Link>
            <Link
              href="/publisher/reports"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              View Reports
            </Link>
            {canFinance ? (
              <Link
                href="/publisher/earnings"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Earning
              </Link>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <label className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Date
              </span>
              <select
                value={range}
                onChange={(e) =>
                  setRange(e.target.value as PublisherDashboardRange)
                }
                disabled={loading}
                className="min-h-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-[#172b63] outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15 disabled:opacity-60"
              >
                {RANGE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            {loading ? (
              <span className="text-xs font-semibold text-slate-400">
                Updating…
              </span>
            ) : null}
            {error ? (
              <span className="text-xs font-semibold text-amber-700">
                {error}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {!publisher.is_activated ? (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="font-bold text-amber-900">Application under review</p>
          <p className="mt-1 text-sm text-amber-800">
            Status: {publisher.status_label}. You can still create communities and
            prepare invite links while review is in progress.
          </p>
        </div>
      ) : (
        <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="font-bold text-emerald-900">Publisher Network active</p>
          <p className="mt-1 text-sm text-emerald-800">
            Create communities, invite creators, view reports, and check your
            commission (10–15% of the creator pool after JobOrio’s 30% fee).
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-[#172b63] transition group-hover:text-violet-700">
              {card.value}
            </p>
            {card.hint ? (
              <p className="mt-2 text-xs font-semibold text-violet-600 opacity-0 transition group-hover:opacity-100">
                {card.hint} →
              </p>
            ) : null}
          </Link>
        ))}
      </div>

      {network ? (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold">Network earnings</h2>
              <p className="mt-1 text-sm text-slate-500">
                Results for {rangeLabel.toLowerCase()} across your communities.
              </p>
            </div>
            <Link
              href="/publisher/earnings"
              className="text-sm font-semibold text-violet-700"
            >
              Full earning →
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {canFinance ? (
              <>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                    Publisher earnings
                  </p>
                  <p className="mt-1 text-xl font-bold text-emerald-900">
                    {money(network.publisher_earnings_usd)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Payable
                  </p>
                  <p className="mt-1 text-xl font-bold text-[#172b63]">
                    {money(network.publisher_payable_usd)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Member settled
                  </p>
                  <p className="mt-1 text-xl font-bold text-[#172b63]">
                    {money(network.member_settled_usd)}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">
                    Member pending
                  </p>
                  <p className="mt-1 text-xl font-bold text-amber-900">
                    {money(network.member_pending_usd)}
                  </p>
                </div>
              </>
            ) : null}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Network clicks
              </p>
              <p className="mt-1 text-xl font-bold text-[#172b63]">
                {network.clicks ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Signups
              </p>
              <p className="mt-1 text-xl font-bold text-[#172b63]">
                {network.signups ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Applications
              </p>
              <p className="mt-1 text-xl font-bold text-[#172b63]">
                {network.applications ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Conversions
              </p>
              <p className="mt-1 text-xl font-bold text-[#172b63]">
                {network.conversions ?? 0}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">Recent activity</h2>
            <p className="mt-1 text-sm text-slate-500">
              Member clicks, signups, invites, and ledger events · {rangeLabel}.
            </p>
          </div>
          <Link
            href="/publisher/reports"
            className="text-sm font-semibold text-violet-700"
          >
            View reports →
          </Link>
        </div>
        {recent_activity.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No activity yet. Invite members and share opportunities to see
            clicks and joins here.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {recent_activity.map((ev) => (
              <li
                key={ev.id}
                className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        ev.kind === "invite_accepted"
                          ? "bg-emerald-100 text-emerald-800"
                          : ev.kind === "ledger"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-violet-100 text-violet-800"
                      }`}
                    >
                      {ev.label}
                    </span>
                    {ev.community_name ? (
                      <span className="text-xs text-slate-400">
                        {ev.community_name}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 font-semibold text-[#172b63]">
                    {ev.member_name
                      ? ev.member_name
                      : ev.title
                        ? ev.title
                        : ev.label}
                    {ev.member_name && ev.title ? (
                      <span className="font-normal text-slate-500">
                        {" "}
                        · {ev.title}
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {typeof ev.amount_usd === "number" ? (
                    <p className="text-sm font-bold text-emerald-700">
                      {money(ev.amount_usd)}
                    </p>
                  ) : null}
                  <p className="text-xs text-slate-400">
                    {relativeTime(ev.occurred_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">Communities</h2>
            <p className="mt-1 text-sm text-slate-500">
              Earnings, campaigns, and which network members are promoting in
              each community.
            </p>
          </div>
          <Link
            href="/publisher/communities"
            className="text-sm font-semibold text-violet-700"
          >
            Manage communities →
          </Link>
        </div>

        {communityList.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No communities yet.{" "}
            <Link
              href="/publisher/communities"
              className="font-semibold text-violet-700"
            >
              Create one
            </Link>
          </p>
        ) : (
          <ul className="mt-5 space-y-4">
            {communityList.map((c) => {
              const promoting = c.promoting ?? [];
              const promoters = c.promoting_members ?? [];
              return (
                <li
                  key={c.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-[#172b63]">{c.name}</h3>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                          {c.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {c.code}
                        {c.category ? ` · ${c.category}` : ""} ·{" "}
                        {c.active_members ?? 0} members
                        {c.xml_jobs_count
                          ? ` · ${c.xml_jobs_count} XML jobs`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-right text-xs">
                      <div>
                        <p className="font-bold uppercase tracking-wide text-slate-400">
                          Clicks
                        </p>
                        <p className="mt-0.5 text-base font-bold text-[#172b63]">
                          {c.clicks ?? 0}
                        </p>
                      </div>
                      {canFinance ? (
                        <>
                          <div>
                            <p className="font-bold uppercase tracking-wide text-slate-400">
                              Earnings
                            </p>
                            <p className="mt-0.5 text-base font-bold text-emerald-700">
                              {money(c.earnings_usd)}
                            </p>
                          </div>
                          <div>
                            <p className="font-bold uppercase tracking-wide text-slate-400">
                              Member pending
                            </p>
                            <p className="mt-0.5 text-base font-bold text-amber-700">
                              {money(c.member_pending_usd)}
                            </p>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Promoting
                      </p>
                      {promoting.length === 0 && !(c.xml_jobs_count ?? 0) ? (
                        <p className="mt-2 text-sm text-slate-500">
                          No campaigns assigned yet.{" "}
                          <Link
                            href="/publisher/marketplace"
                            className="font-semibold text-violet-700"
                          >
                            Assign from marketplace
                          </Link>
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-1.5">
                          {promoting.slice(0, 6).map((p) => (
                            <li
                              key={p.assignment_id}
                              className="flex items-center justify-between gap-2 rounded-lg border border-white bg-white px-3 py-2 text-sm"
                            >
                              <span className="truncate font-semibold text-[#172b63]">
                                {p.title}
                              </span>
                              <span className="shrink-0 text-[10px] font-bold uppercase text-violet-700">
                                {p.pricing_model || "campaign"}
                                {p.scope === "network" ? " · all" : ""}
                              </span>
                            </li>
                          ))}
                          {(c.xml_jobs_count ?? 0) > 0 ? (
                            <li className="rounded-lg border border-white bg-white px-3 py-2 text-sm font-semibold text-slate-600">
                              {c.xml_jobs_count} XML / syndicated jobs
                            </li>
                          ) : null}
                        </ul>
                      )}
                    </div>

                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Network members promoting
                      </p>
                      {promoters.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">
                          No active members in this community yet.{" "}
                          <Link
                            href="/publisher/network"
                            className="font-semibold text-violet-700"
                          >
                            Invite members
                          </Link>
                        </p>
                      ) : (
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {promoters.map((m) => (
                            <li
                              key={m.id}
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                m.is_promoting
                                  ? "bg-violet-100 text-violet-800"
                                  : "bg-white text-slate-600"
                              }`}
                              title={
                                m.is_promoting
                                  ? "Has recent share activity"
                                  : "Active member"
                              }
                            >
                              {m.name}
                              {m.is_promoting ? " · active" : ""}
                            </li>
                          ))}
                          {(c.promoting_members_total ?? 0) > promoters.length ? (
                            <li className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                              +
                              {(c.promoting_members_total ?? 0) -
                                promoters.length}{" "}
                              more
                            </li>
                          ) : null}
                        </ul>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">Network profile</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Country</dt>
            <dd className="font-semibold">{publisher.country_code}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Network type</dt>
            <dd className="font-semibold capitalize">{publisher.network_type}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Integration</dt>
            <dd className="font-semibold capitalize">
              {publisher.integration_preference}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Website</dt>
            <dd className="max-w-[60%] truncate font-semibold">
              <a
                href={publisher.website_url}
                target="_blank"
                rel="noreferrer"
                className="text-violet-700"
              >
                {publisher.website_url}
              </a>
            </dd>
          </div>
        </dl>
      </div>
    </>
  );
}
