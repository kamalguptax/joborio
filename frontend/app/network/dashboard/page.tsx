"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiClientError } from "@/lib/api/client";
import {
  fetchNetworkDashboard,
  leaveNetworkMembership,
  type NetworkDashboard,
} from "@/lib/api/network";
import { formatMoney } from "@/lib/money";
import { PageSkeleton } from "@/components/ui/Skeleton";

function formatJoined(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function NetworkDashboardPage() {
  const [data, setData] = useState<NetworkDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    fetchNetworkDashboard()
      .then(setData)
      .catch((err) =>
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load member dashboard.",
        ),
      );
  };

  useEffect(() => {
    load();
  }, []);

  async function onLeave() {
    if (
      !window.confirm(
        "Leave this publisher network? Your activity history is kept, but Creator registration stays blocked until the publisher formally releases you.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await leaveNetworkMembership();
      setMessage(res.message);
      load();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not leave the network.",
      );
    } finally {
      setBusy(false);
    }
  }

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

  const canLeave =
    data.lifecycle?.can_leave ?? data.member.status_code === "active";
  const earningTotal = data.earning_total;

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
            Member portal
          </p>
          <h1 className="mt-1 text-3xl font-bold">Welcome, {data.member.name}</h1>
          <p className="mt-2 text-slate-500">
            {data.member.status} · Publisher: {data.publisher.name ?? "—"}
            {data.member.joined_at
              ? ` · Joined ${formatJoined(data.member.joined_at)}`
              : ""}
          </p>
          {data.member.public_code ? (
            <p className="mt-2 text-xs font-semibold text-violet-700">
              Tracking id: {data.member.public_code}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/network/opportunities"
            className="rounded-full bg-[#172b63] px-4 py-2 text-sm font-semibold text-white"
          >
            Share opportunities
          </Link>
          {canLeave ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onLeave()}
              className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
            >
              Leave network
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message || data.lifecycle?.message ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {message ?? data.lifecycle?.message}
        </p>
      ) : null}

      <div className="mb-2">
        <h2 className="text-lg font-bold">Your earnings activity</h2>
        <p className="text-sm text-slate-500">
          Clicks and actions from your shared links. CPC rates stay with your
          publisher — settlement earning is shown per community below.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [
            "Total earning",
            earningTotal
              ? formatMoney(Number(earningTotal.total_usd), "USD")
              : "—",
          ],
          ["Total clicks", data.activity.clicks_total],
          ["Valid clicks", data.activity.clicks_valid],
          ["PPR / Signups", data.activity.signups],
          ["Applications", data.activity.applications],
          ["Leads", data.activity.leads],
          ["Conversions", data.activity.conversions],
          ["Pending actions", data.activity.actions_pending],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">Your communities</h2>
        <p className="mt-1 text-sm text-slate-500">
          All communities you joined, join date, and earning for each community.
        </p>
        {data.communities.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No community assigned yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.communities.map((c, idx) => (
              <li
                key={c.id ?? `${c.code ?? "c"}-${idx}`}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[#172b63]">{c.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {c.code}
                      {c.status ? ` · ${c.status}` : ""}
                      {" · Joined "}
                      {formatJoined(c.joined_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Community earning
                    </p>
                    <p className="mt-0.5 text-lg font-bold text-emerald-700">
                      {formatMoney(Number(c.earning?.total_usd ?? 0), "USD")}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Settled{" "}
                      {formatMoney(Number(c.earning?.settled_usd ?? 0), "USD")} ·
                      Pending{" "}
                      {formatMoney(Number(c.earning?.pending_usd ?? 0), "USD")}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                  <span className="rounded-full bg-white px-3 py-1">
                    {c.clicks_total ?? 0} clicks
                  </span>
                  <span className="rounded-full bg-white px-3 py-1">
                    {c.ppr ?? 0} PPR
                  </span>
                  <span className="rounded-full bg-white px-3 py-1">
                    {(c.campaigns ?? []).length} campaigns
                  </span>
                </div>
                {(c.campaigns ?? []).length > 0 ? (
                  <ul className="mt-3 space-y-1">
                    {(c.campaigns ?? []).slice(0, 6).map((camp, i) => (
                      <li
                        key={`${camp.name ?? "camp"}-${i}`}
                        className="flex items-center justify-between rounded-lg border border-white bg-white px-3 py-2 text-sm"
                      >
                        <span className="font-semibold text-[#172b63]">
                          {camp.name}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-slate-500">
                          {camp.status ?? "active"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">Recent track</h2>
            <p className="mt-1 text-sm text-slate-500">
              Latest clicks from your shared opportunities.
            </p>
          </div>
          <Link
            href="/network/opportunities"
            className="text-sm font-semibold text-violet-700"
          >
            Open opportunities →
          </Link>
        </div>
        {(data.recent_activity ?? []).length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No clicks yet. Share a job or PPC link from Opportunities.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {(data.recent_activity ?? []).map((ev) => (
              <li
                key={ev.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <span className="font-semibold text-[#172b63]">
                  {ev.activity_type}
                  {ev.title ? ` · ${ev.title}` : ""}
                </span>
                <span className="text-xs text-slate-400">
                  {ev.occurred_at
                    ? new Date(ev.occurred_at).toLocaleString()
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">Assigned campaigns</h2>
        <p className="mt-1 text-sm text-slate-500">
          Campaign names by community — CPC rates stay hidden.
        </p>
        {data.assigned_campaigns.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No campaigns assigned yet. Your publisher will assign eligible
            campaigns.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.assigned_campaigns.map((c, idx) => (
              <li
                key={`${c.name ?? "c"}-${idx}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm"
              >
                <div>
                  <span className="font-semibold">{c.name}</span>
                  {c.community_name ? (
                    <p className="mt-0.5 text-xs text-slate-500">
                      {c.community_name}
                    </p>
                  ) : null}
                </div>
                <span className="text-xs font-bold uppercase text-slate-500">
                  {c.status ?? "active"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
