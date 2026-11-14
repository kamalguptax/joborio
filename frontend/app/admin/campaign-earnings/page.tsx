"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
} from "@/components/admin/admin-ui";
import { formatMoney } from "@/lib/money";

function money(amount: number, currency: string) {
  return formatMoney(amount, currency);
}

export default function AdminCampaignEarningsPage() {
  const [data, setData] = useState<CampaignEarningsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminCampaignEarnings()
      .then(setData)
      .catch(() => setError("Could not load campaign earnings."));
  }, []);

  if (error) {
    return <AdminAlert tone="error">{error}</AdminAlert>;
  }

  if (!data) {
    return <p className="text-sm text-zinc-500">Loading campaign earnings…</p>;
  }

  const currency = data.currency || "USD";
  const rows: CampaignEarningRow[] = [
    ...data.campaigns,
    ...(data.organic.earning_count > 0 || data.organic.net_usd > 0
      ? [data.organic]
      : []),
  ];

  return (
    <>
      <AdminPageHeader
        title="Campaign earnings"
        description="Earnings broken down by employer campaign / program, plus organic XML jobs."
        actions={
          <Link
            href="/admin/programs"
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:border-amber-500/50"
          >
            Manage programs
          </Link>
        }
      />

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="Gross"
          value={money(data.totals.gross_usd, currency)}
          href="/admin/campaign-earnings"
        />
        <AdminStatCard
          label="Creator net"
          value={money(data.totals.net_usd, currency)}
          href="/admin/campaign-earnings"
        />
        <AdminStatCard
          label="Platform fee"
          value={money(data.totals.platform_fee_usd, currency)}
          href="/admin/campaign-earnings"
        />
        <AdminStatCard
          label="Paid out"
          value={money(data.totals.paid_usd, currency)}
          href="/admin/payouts"
        />
      </div>

      <div className="mt-8">
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
      </div>
    </>
  );
}
