"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiClientError } from "@/lib/api/client";
import {
  fetchPublisherReports,
  type PublisherReport,
} from "@/lib/api/publisher";

function money(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export default function PublisherReportsPage() {
  const [report, setReport] = useState<PublisherReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublisherReports()
      .then(setReport)
      .catch((err) =>
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load performance reports.",
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

  if (!report) {
    return <p className="text-sm text-slate-500">Loading performance reports…</p>;
  }

  const { summary, communities, assignments } = report;

  const kpis: Array<[string, string | number]> = [
    ["Communities", summary.communities_total],
    ["Active communities", summary.communities_active],
    ["Active members", summary.members_active],
    ["Total members", summary.members_total],
    ["Invites pending", summary.invites_pending],
    ["Invites accepted", summary.invites_accepted],
    ["Active campaigns", summary.campaigns_assigned_active],
    ["Confirmed actions", summary.confirmed_actions],
  ];

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
            Performance Reports
          </p>
          <h1 className="mt-1 text-3xl font-bold">Network performance</h1>
          <p className="mt-2 text-slate-500">
            Publisher-level view of communities, members, invites, and campaign
            assignments. Confirmed partner actions appear after tracking is live.
          </p>
        </div>
        <Link
          href="/publisher/marketplace"
          className="rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-bold text-white"
        >
          Assign campaigns
        </Link>
      </div>

      <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Estimated publisher revenue
        </p>
        <p className="mt-1 text-2xl font-bold text-emerald-900">
          {money(summary.estimated_publisher_revenue_usd)}
        </p>
        <p className="mt-1 text-sm text-emerald-800">
          Updates when partner-confirmed actions post to the ledger.
        </p>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
          >
            <p className="text-2xl font-bold text-[#172b63]">{value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Communities</h2>
          {communities.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No communities yet.{" "}
              <Link
                href="/publisher/communities"
                className="font-semibold text-violet-600 hover:underline"
              >
                Create one
              </Link>
            </p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {communities.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div>
                    <p className="font-semibold text-[#172b63]">{c.name}</p>
                    <p className="text-xs text-slate-500">
                      {c.code}
                      {c.category ? ` · ${c.category}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase text-emerald-700">
                      {c.status}
                    </p>
                    <p className="text-xs text-slate-500">
                      {c.active_members} active
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Campaign assignments</h2>
          {assignments.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No assignments yet. Rates lock when a campaign is assigned.
            </p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {assignments.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#172b63]">
                        {a.program_title ?? "Campaign"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {a.community_name ?? "All members"}
                        {a.pricing_model ? ` · ${a.pricing_model}` : ""}
                      </p>
                    </div>
                    <span className="text-xs font-bold uppercase text-violet-700">
                      {a.status}
                    </span>
                  </div>
                  {a.accepted_rate_usd != null && a.accepted_rate_usd !== "" ? (
                    <p className="mt-1 text-xs font-semibold text-slate-600">
                      Locked rate: ${Number(a.accepted_rate_usd).toFixed(2)}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
