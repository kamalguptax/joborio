"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchPublisherDashboard } from "@/lib/api/publisher";
import type { PublisherDashboard } from "@/lib/api/publisherAuth";
import { ApiClientError } from "@/lib/api/client";

type Dash = PublisherDashboard & {
  recent_communities?: Array<{
    id: number;
    code: string;
    name: string;
    category?: string | null;
    status: string;
  }>;
};

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

  useEffect(() => {
    fetchPublisherDashboard()
      .then(setData)
      .catch((err) =>
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load publisher dashboard.",
        ),
      );
  }, []);

  if (error) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {error}
      </p>
    );
  }

  if (!data) {
    return <p className="text-sm text-slate-500">Loading publisher overview…</p>;
  }

  const { publisher, overview, membership, recent_communities = [] } = data;
  const canFinance = membership.can_view_financials !== false && membership.role === "owner";

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
    cards.push(
      {
        label: "Overall earnings",
        value: money(overview.overall_earnings_usd),
        href: "/publisher/earnings",
        hint: "Lifetime commercial net",
      },
      {
        label: "Total payout",
        value: money(overview.total_payout_usd),
        href: "/publisher/payments",
        hint: "Paid to date",
      },
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
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
        <div className="flex flex-wrap gap-2">
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
            Invite members
          </Link>
        </div>
      </div>

      {!publisher.is_activated ? (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="font-bold text-amber-900">Application under review</p>
          <p className="mt-1 text-sm text-amber-800">
            Status: {publisher.status_label}. You can still set up communities and invite
            links while review is in progress.
          </p>
        </div>
      ) : (
        <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="font-bold text-emerald-900">Publisher account active</p>
          <p className="mt-1 text-sm text-emerald-800">
            Manage communities, invite members, and assign campaigns.
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

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Recent communities</h2>
            <Link
              href="/publisher/communities"
              className="text-sm font-semibold text-violet-600"
            >
              View all →
            </Link>
          </div>
          {recent_communities.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No communities yet.{" "}
              <Link href="/publisher/communities" className="font-semibold text-violet-700">
                Create one
              </Link>
            </p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {recent_communities.map((c) => (
                <li key={c.id}>
                  <Link
                    href="/publisher/communities"
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 transition hover:border-violet-200 hover:bg-violet-50/50"
                  >
                    <div>
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-xs text-slate-500">
                        {c.code}
                        {c.category ? ` · ${c.category}` : ""}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-slate-500">
                      {c.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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
      </div>
    </>
  );
}
