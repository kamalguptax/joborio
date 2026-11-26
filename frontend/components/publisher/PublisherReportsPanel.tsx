"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiClientError } from "@/lib/api/client";
import {
  fetchPublisherReports,
  type PublisherReport,
} from "@/lib/api/publisher";
import { publisherCommunityPath } from "@/lib/staticExport";
import { PageSkeleton } from "@/components/ui/Skeleton";

function money(n: number | null | undefined) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(n));
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-center">
      <p className="text-lg font-bold tabular-nums text-[#172b63]">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
    </div>
  );
}

function statusClass(status: string) {
  const s = status.toLowerCase();
  if (s === "active") return "bg-emerald-50 text-emerald-700";
  if (s === "paused") return "bg-violet-50 text-violet-700";
  return "bg-slate-100 text-slate-600";
}

export default function PublisherReportsPanel() {
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
    return <PageSkeleton />;
  }

  const { summary, communities, assignments } = report;
  const showMoney = report.financials_visible !== false;

  const kpis: Array<[string, string | number]> = [
    ["Invites pending", summary.invites_pending],
    ["Invites accepted", summary.invites_accepted],
    ["Active campaigns", summary.campaigns_assigned_active],
    ["Confirmed actions", summary.confirmed_actions],
  ];

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#172b63]">
          Campaign & member performance
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Communities first, then campaigns. Open any card for the full
          dashboard — clicks, members, and earnings.
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

      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-[#172b63]">Communities</h3>
            <p className="mt-1 text-sm text-slate-500">
              {communities.length} community
              {communities.length === 1 ? "" : "ies"} · click a card to open
              the dashboard
            </p>
          </div>
          <Link
            href="/publisher/communities"
            className="text-sm font-semibold text-violet-700 hover:underline"
          >
            Manage communities
          </Link>
        </div>

        {communities.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
            No communities yet.{" "}
            <Link
              href="/publisher/communities"
              className="font-semibold text-violet-600 hover:underline"
            >
              Create one
            </Link>
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {communities.map((c) => (
              <Link
                key={c.id}
                href={publisherCommunityPath(c.id, { from: "reports" })}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-[#172b63] group-hover:text-violet-700">
                      {c.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {c.code}
                      {c.category ? ` · ${c.category}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${statusClass(c.status)}`}
                  >
                    {c.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Metric label="Clicks" value={c.clicks ?? 0} />
                  <Metric
                    label="Members"
                    value={c.members ?? c.active_members ?? 0}
                  />
                  <Metric
                    label="Earning"
                    value={showMoney ? money(c.earnings_usd) : "—"}
                  />
                </div>

                <p className="mt-4 text-xs font-semibold text-violet-700">
                  Open community dashboard →
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-[#172b63]">Campaigns</h3>
            <p className="mt-1 text-sm text-slate-500">
              {assignments.length} assignment
              {assignments.length === 1 ? "" : "s"} · click a card for campaign
              earning
            </p>
          </div>
          <Link
            href="/publisher/marketplace"
            className="text-sm font-semibold text-violet-700 hover:underline"
          >
            Campaign marketplace
          </Link>
        </div>

        {assignments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
            No campaign assignments yet. Rates lock when a campaign is assigned.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {assignments.map((a) => (
              <Link
                key={a.id}
                href={`/publisher/earnings?assignment=${a.id}&from=reports`}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-[#172b63] group-hover:text-violet-700">
                      {a.program_title ?? "Campaign"}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {a.community_name ?? "All members"}
                      {a.pricing_model ? ` · ${a.pricing_model}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${statusClass(a.status)}`}
                  >
                    {a.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Metric label="Clicks" value={a.clicks ?? 0} />
                  <Metric label="Members" value={a.members ?? 0} />
                  <Metric
                    label="Earning"
                    value={showMoney ? money(a.earnings_usd) : "—"}
                  />
                </div>

                {a.accepted_rate_usd != null && a.accepted_rate_usd !== "" ? (
                  <p className="mt-3 text-xs font-semibold text-slate-600">
                    Locked rate: ${Number(a.accepted_rate_usd).toFixed(2)}
                  </p>
                ) : null}

                <p className="mt-3 text-xs font-semibold text-violet-700">
                  Open campaign dashboard →
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
