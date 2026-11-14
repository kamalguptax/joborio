"use client";

import { useEffect, useState } from "react";
import { ApiClientError } from "@/lib/api/client";
import {
  fetchNetworkDashboard,
  leaveNetworkMembership,
  type NetworkDashboard,
} from "@/lib/api/network";

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
    return <p className="text-sm text-slate-500">Loading activity…</p>;
  }

  const communityLabel =
    data.communities.map((c) => c.name).filter(Boolean).join(", ") ||
    "No community assigned yet";
  const canLeave = data.lifecycle?.can_leave ?? data.member.status_code === "active";

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
            Member portal
          </p>
          <h1 className="mt-1 text-3xl font-bold">Welcome, {data.member.name}</h1>
          <p className="mt-2 text-slate-500">
            {data.member.status} · Publisher: {data.publisher.name ?? "—"} ·{" "}
            {communityLabel}
          </p>
        </div>
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total clicks", data.activity.clicks_total],
          ["Valid clicks", data.activity.clicks_valid],
          ["Signups", data.activity.signups],
          ["Applications", data.activity.applications],
          ["Leads", data.activity.leads],
          ["Conversions", data.activity.conversions],
          ["Approved actions", data.activity.actions_approved],
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
        <h2 className="text-lg font-bold">Assigned campaigns</h2>
        <p className="mt-1 text-sm text-slate-500">
          Campaign names and status only — rates and payouts are hidden for
          members.
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
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm"
              >
                <span className="font-semibold">{c.name}</span>
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
