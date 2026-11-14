"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiClientError } from "@/lib/api/client";
import {
  fetchPublisherPayments,
  type PublisherPaymentHistory,
} from "@/lib/api/publisher";

function money(n: number | string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
}

function when(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export default function PublisherPaymentsPage() {
  const [data, setData] = useState<PublisherPaymentHistory | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublisherPayments()
      .then(setData)
      .catch((err) =>
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load payment history.",
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
    return <p className="text-sm text-slate-500">Loading payment history…</p>;
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
            Payment History
          </p>
          <h1 className="mt-1 text-3xl font-bold">Settlements</h1>
          <p className="mt-2 max-w-2xl text-slate-500">{data.note}</p>
        </div>
        <Link
          href="/publisher/earnings"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Publisher earnings
        </Link>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {[
          ["Paid credits", data.summary.publisher_paid_credits_usd],
          ["Settlement debits", data.summary.publisher_settlement_debits_usd],
          ["Member settlements", data.summary.member_settlements_count],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
          >
            <p className="text-2xl font-bold text-[#172b63]">
              {typeof value === "number" && label !== "Member settlements"
                ? money(value)
                : value}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Publisher settlements</h2>
          {data.publisher_settlements.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No publisher settlement ledger rows yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {data.publisher_settlements.map((row) => (
                <li
                  key={`pub-${row.id}`}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold capitalize text-[#172b63]">
                        {row.entry_type} · {row.state}
                      </p>
                      <p className="text-xs text-slate-500">
                        {when(row.occurred_at)}
                        {row.community_name ? ` · ${row.community_name}` : ""}
                        {row.reference ? ` · ${row.reference}` : ""}
                      </p>
                    </div>
                    <p className="font-bold">{money(row.amount_usd)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Member settlement reconciliation</h2>
          <p className="mt-1 text-xs text-slate-500">
            Publisher-managed only — not exposed on member dashboards or member
            APIs.
          </p>
          {data.member_settlements.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No member settlement records yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {data.member_settlements.map((row) => (
                <li
                  key={`mem-${row.id}`}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#172b63]">
                        {row.member_name ?? "Member"}
                        <span className="ml-2 text-xs font-bold uppercase text-emerald-700">
                          {row.status}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {row.member_email ?? ""}
                        {row.period_label ? ` · ${row.period_label}` : ""}
                        {row.community_name ? ` · ${row.community_name}` : ""}
                      </p>
                      <p className="text-xs text-slate-400">
                        {row.settled_at
                          ? `Settled ${when(row.settled_at)}`
                          : `Created ${when(row.created_at)}`}
                      </p>
                    </div>
                    <p className="font-bold">{money(row.amount_usd)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
