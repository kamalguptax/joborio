"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Landmark, Shield } from "lucide-react";
import { TransactionHistory, type TransactionRow } from "@/components/payouts/TransactionHistory";
import { fetchCreatorDashboard, fetchCreatorTransactions } from "@/lib/api/creator";
import { formatMoney } from "@/lib/money";

export default function CreatorEarningsPage() {
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [byType, setByType] = useState<Record<string, Record<string, number>>>(
    {},
  );
  const [byCampaign, setByCampaign] = useState<
    Array<{
      id: number | null;
      title: string;
      pricing_model?: string;
      status?: string;
      earning_count: number;
      net_usd: number;
      pending_usd: number;
      paid_usd: number;
      ppc_usd: number;
      ppr_usd: number;
      ppa_usd: number;
    }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    fetchCreatorDashboard()
      .then((dash) => {
        setByType(
          (dash.earnings_by_type as Record<string, Record<string, number>>) ??
            {},
        );
        setByCampaign(
          (dash.earnings_by_campaign as typeof byCampaign) ?? [],
        );
        if (typeof dash.currency === "string") setCurrency(dash.currency);
      })
      .catch(() => setError("Could not load earnings."));
  }, []);

  useEffect(() => {
    fetchCreatorTransactions(page)
      .then(({ data, meta }) => {
        setRows(data);
        setLastPage(Number(meta.last_page ?? 1));
      })
      .catch(() => setError("Could not load earnings."));
  }, [page]);

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
          {currency} ledger
        </p>
        <h1 className="mt-1 text-3xl font-bold">Earnings</h1>
        <p className="mt-2 text-slate-500">
          Each click adds a credit. A payout is a debit once it is sent. Holds apply before approval.
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/creator/trust-tier"
          className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-purple-200 hover:shadow-md"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <Shield size={20} />
          </span>
          <span>
            <span className="block font-bold text-[#172b63]">Account features</span>
            <span className="mt-0.5 block text-sm text-slate-500">
              What you can unlock as a creator — PPC, PPR, campaigns, and more.
            </span>
          </span>
        </Link>
        <Link
          href="/creator/payout"
          className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-purple-200 hover:shadow-md"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Landmark size={20} />
          </span>
          <span>
            <span className="block font-bold text-[#172b63]">Payout account</span>
            <span className="mt-0.5 block text-sm text-slate-500">
              Add UPI, bank, or PayPal so approved earnings can be paid out.
            </span>
          </span>
        </Link>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {Object.keys(byType).length > 0 ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {(["ppc", "ppr", "ppa"] as const).map((type) => {
            const b = byType[type] ?? {};
            const sum =
              Number(b.pending_usd ?? 0) +
              Number(b.approved_usd ?? 0) +
              Number(b.payable_usd ?? 0) +
              Number(b.paid_usd ?? 0);
            return (
              <div
                key={type}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-xs font-bold uppercase text-slate-400">
                  {type}
                </p>
                <p className="text-2xl font-bold">{formatMoney(sum, currency)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Pending {formatMoney(Number(b.pending_usd ?? 0), currency)}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}

      {byCampaign.length > 0 ? (
        <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-bold text-slate-800">
              Earnings by campaign
            </h2>
            <p className="text-xs text-slate-500">
              Net amounts grouped by the campaign / program you promoted.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-2 font-semibold">Campaign</th>
                  <th className="px-4 py-2 font-semibold">Entries</th>
                  <th className="px-4 py-2 font-semibold">Net</th>
                  <th className="px-4 py-2 font-semibold">Pending</th>
                  <th className="px-4 py-2 font-semibold">Paid</th>
                </tr>
              </thead>
              <tbody>
                {byCampaign.map((row) => (
                  <tr
                    key={String(row.id ?? row.title)}
                    className="border-t border-slate-100"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{row.title}</p>
                      <p className="text-xs text-slate-400">
                        {(row.pricing_model ?? "ppc").toUpperCase()} ·{" "}
                        {row.status ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{row.earning_count}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-emerald-600">
                      {formatMoney(row.net_usd, currency)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-amber-600">
                      {formatMoney(row.pending_usd, currency)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatMoney(row.paid_usd, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <TransactionHistory
        rows={rows}
        currency={currency}
        empty="No earnings yet. Share a live job to start a transaction."
      />
      {lastPage > 1 ? (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border border-slate-200 px-3 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-slate-500">
            Page {page} / {lastPage}
          </span>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-slate-200 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </>
  );
}
