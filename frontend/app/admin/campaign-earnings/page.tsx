"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  adminCampaignEarnings,
  type CampaignEarningRow,
  type CampaignEarningsOverview,
} from "@/lib/api/admin";
import {
  AdminAlert,
  AdminPageHeader,
  AdminStatCard,
  AdminTableWrap,
  AdminLinkButton,
} from "@/components/admin/admin-ui";
import { adminPath } from "@/lib/adminNav";
import { formatMoney } from "@/lib/money";
import { PageSkeleton } from "@/components/ui/Skeleton";

function money(amount: number, currency: string) {
  return formatMoney(amount, currency);
}

function sharePct(part: number, total: number): string {
  if (!total || total <= 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

export default function AdminCampaignEarningsPage() {
  const [data, setData] = useState<CampaignEarningsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminCampaignEarnings()
      .then(setData)
      .catch(() => setError("Could not load campaign earnings."));
  }, []);

  const rows: CampaignEarningRow[] = useMemo(() => {
    if (!data) return [];
    return [
      ...data.campaigns,
      ...(data.organic.earning_count > 0 || data.organic.net_usd > 0
        ? [data.organic]
        : []),
    ];
  }, [data]);

  const ranked = useMemo(
    () => [...rows].sort((a, b) => b.net_usd - a.net_usd || b.gross_usd - a.gross_usd),
    [rows],
  );

  if (error) {
    return <AdminAlert tone="error">{error}</AdminAlert>;
  }

  if (!data) {
    return <PageSkeleton />;
  }

  const currency = data.currency || "USD";
  const grossTotal = Number(data.totals.gross_usd ?? 0);

  return (
    <>
      <AdminPageHeader
        title="Campaign earnings dashboard"
        description="Earnings by campaign / program (PPC, PPR, PPA) plus organic XML jobs."
        actions={
          <>
            <AdminLinkButton href={adminPath("/admin/programs")}>
              Programs
            </AdminLinkButton>
            <AdminLinkButton href={adminPath("/admin/payouts")} variant="primary">
              Payouts
            </AdminLinkButton>
          </>
        }
      />

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <AdminStatCard
          label="Campaigns"
          value={data.campaigns.length}
          href={adminPath("/admin/programs")}
        />
        <AdminStatCard
          label="Gross"
          value={money(data.totals.gross_usd, currency)}
        />
        <AdminStatCard
          label="Creator net"
          value={money(data.totals.net_usd, currency)}
        />
        <AdminStatCard
          label="Pending"
          value={money(data.totals.pending_usd, currency)}
        />
        <AdminStatCard
          label="Paid out"
          value={money(data.totals.paid_usd, currency)}
          href={adminPath("/admin/payouts")}
        />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">
              Campaign-wise earnings
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Each card is one campaign. Sorted by creator net.
            </p>
          </div>
        </div>

        {ranked.length === 0 ? (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-8 text-center text-sm text-zinc-500">
            No campaign earnings yet. When creators earn on programs or XML jobs,
            totals appear here.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {ranked.map((row) => {
              const key = String(row.id ?? "organic");
              const href =
                row.id != null
                  ? adminPath("/admin/programs")
                  : adminPath("/admin/syndication-feeds");
              return (
                <Link
                  key={key}
                  href={href}
                  className="group block rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 transition hover:border-amber-500/50 hover:bg-zinc-800"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-50">
                        {row.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {row.employer ? `${row.employer} · ` : ""}
                        <span className="uppercase">{row.pricing_model ?? "—"}</span>
                        {" · "}
                        {row.status ?? "—"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                      {sharePct(row.gross_usd, grossTotal)} of gross
                    </span>
                  </div>

                  <p className="mt-3 text-2xl font-bold tabular-nums text-emerald-400">
                    {money(row.net_usd, currency)}
                  </p>
                  <p className="text-xs text-zinc-500">Creator net</p>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg bg-zinc-950/60 px-2 py-1.5">
                      <p className="text-zinc-500">Gross</p>
                      <p className="font-semibold tabular-nums text-zinc-200">
                        {money(row.gross_usd, currency)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-zinc-950/60 px-2 py-1.5">
                      <p className="text-zinc-500">Pending</p>
                      <p className="font-semibold tabular-nums text-amber-300">
                        {money(row.pending_usd, currency)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-zinc-950/60 px-2 py-1.5">
                      <p className="text-zinc-500">Paid</p>
                      <p className="font-semibold tabular-nums text-zinc-200">
                        {money(row.paid_usd, currency)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                    <span>PPC {money(row.ppc_usd, currency)}</span>
                    <span>PPR {money(row.ppr_usd, currency)}</span>
                    <span>PPA {money(row.ppa_usd, currency)}</span>
                    <span>{row.earning_count} entries</span>
                  </div>

                  {row.budget_total_usd != null ? (
                    <p className="mt-2 text-[11px] text-zinc-600">
                      Budget {money(Number(row.budget_total_usd), currency)}
                      {row.budget_spent_usd != null
                        ? ` · spent ${money(Number(row.budget_spent_usd), currency)}`
                        : ""}
                    </p>
                  ) : null}

                  <p className="mt-3 text-xs font-semibold text-amber-500/80 opacity-80 group-hover:opacity-100">
                    Open →
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold text-zinc-200">Detail table</h2>
        <AdminTableWrap>
          <thead className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Campaign</th>
              <th className="px-4 py-2.5 font-semibold">Model</th>
              <th className="px-4 py-2.5 font-semibold">Entries</th>
              <th className="px-4 py-2.5 font-semibold">Gross</th>
              <th className="px-4 py-2.5 font-semibold">Net</th>
              <th className="px-4 py-2.5 font-semibold">Pending</th>
              <th className="px-4 py-2.5 font-semibold">Paid</th>
              <th className="px-4 py-2.5 font-semibold">PPC / PPR / PPA</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-sm text-zinc-500">
                  No campaign earnings yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={String(row.id ?? "organic")}
                  className="border-t border-zinc-800 align-top"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-zinc-100">{row.title}</p>
                    <p className="text-xs text-zinc-500">
                      {row.employer ? `${row.employer} · ` : ""}
                      {row.status ?? "—"}
                      {row.budget_total_usd != null
                        ? ` · budget ${money(Number(row.budget_total_usd), currency)}`
                        : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 uppercase text-zinc-400">
                    {row.pricing_model ?? "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{row.earning_count}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {money(row.gross_usd, currency)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-emerald-400">
                    {money(row.net_usd, currency)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-amber-300">
                    {money(row.pending_usd, currency)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {money(row.paid_usd, currency)}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {money(row.ppc_usd, currency)} / {money(row.ppr_usd, currency)} /{" "}
                    {money(row.ppa_usd, currency)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </AdminTableWrap>
      </section>
    </>
  );
}
