"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiClientError } from "@/lib/api/client";
import {
  fetchPublisherCommission,
  fetchPublisherEarnings,
  updatePublisherCommission,
  type PublisherEarnings,
} from "@/lib/api/publisher";

function money(n: number | string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
}

export default function PublisherEarningsPage() {
  const [data, setData] = useState<PublisherEarnings | null>(null);
  const [permitted, setPermitted] = useState<number[]>([10, 15, 20, 25, 30]);
  const [selectedPct, setSelectedPct] = useState<number>(20);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    Promise.all([fetchPublisherEarnings(), fetchPublisherCommission()])
      .then(([earnings, commissionCfg]) => {
        setData(earnings);
        setPermitted(commissionCfg.permitted_percentages);
        const current = commissionCfg.commission
          ? Number(commissionCfg.commission.commission_percent)
          : commissionCfg.permitted_percentages[0] ?? 20;
        setSelectedPct(current);
      })
      .catch((err) =>
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load publisher earnings.",
        ),
      );
  };

  useEffect(() => {
    load();
  }, []);

  async function onSaveCommission() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await updatePublisherCommission({
        commission_percent: selectedPct,
      });
      setMessage(res.message);
      load();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not update commission.",
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
    return <p className="text-sm text-slate-500">Loading publisher earnings…</p>;
  }

  const { balances, commission, by_assignment, recent_entries } = data;

  const cards: Array<[string, number]> = [
    ["Lifetime net", balances.lifetime_net_usd],
    ["Pending", balances.pending_usd],
    ["Approved", balances.approved_usd],
    ["Payable", balances.payable_usd],
    ["Paid", balances.paid_usd],
    ["Reversed", balances.reversed_usd],
  ];

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
            Publisher Earnings
          </p>
          <h1 className="mt-1 text-3xl font-bold">Commercial earnings</h1>
          <p className="mt-2 max-w-2xl text-slate-500">{data.note}</p>
        </div>
        <Link
          href="/publisher/payments"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Payment history
        </Link>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      <div className="mb-6 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
          Commercial commission
        </p>
        {commission ? (
          <p className="mt-1 text-xl font-bold text-violet-950">
            {Number(commission.commission_percent).toFixed(2)}% publisher
            commission · v{commission.version}
          </p>
        ) : (
          <p className="mt-1 text-sm font-semibold text-violet-950">
            No active commission yet — choose a permitted rate below.
          </p>
        )}
        <p className="mt-1 text-sm text-violet-800">
          Only permitted percentages can be selected. JobOrio platform fee is
          never distributed to the publisher.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {permitted.map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => setSelectedPct(pct)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                selectedPct === pct
                  ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white"
                  : "border border-violet-200 bg-white text-violet-800"
              }`}
            >
              {pct}%
            </button>
          ))}
          <button
            type="button"
            disabled={busy}
            onClick={() => void onSaveCommission()}
            className="rounded-full bg-[#172b63] px-4 py-1.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save commission"}
          </button>
        </div>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
          >
            <p className="text-2xl font-bold text-[#172b63]">{money(value)}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">By campaign assignment</h2>
          {by_assignment.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No assignments yet.{" "}
              <Link
                href="/publisher/marketplace"
                className="font-semibold text-violet-600 hover:underline"
              >
                Open marketplace
              </Link>
            </p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {by_assignment.map((a) => (
                <li
                  key={a.assignment_id}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#172b63]">
                        {a.program_title ?? "Campaign"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {a.community_name}
                        {a.pricing_model ? ` · ${a.pricing_model}` : ""}
                        {a.accepted_rate_usd != null
                          ? ` · locked $${Number(a.accepted_rate_usd).toFixed(2)}`
                          : ""}
                      </p>
                    </div>
                    <p className="font-bold text-emerald-700">
                      {money(a.credited_net_usd)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {data.member_settlements_pending > 0 ? (
            <p className="mt-4 text-xs text-slate-500">
              {data.member_settlements_pending} member settlement
              {data.member_settlements_pending === 1 ? "" : "s"} pending
              (tracked separately from publisher earnings).
            </p>
          ) : null}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Recent ledger entries</h2>
          {recent_entries.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No ledger entries yet. Credits appear after partner-confirmed
              actions; reversals are new linked rows, never overwrites.
            </p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {recent_entries.map((e) => (
                <li
                  key={e.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold capitalize text-[#172b63]">
                        {e.entry_type} · {e.state}
                      </p>
                      <p className="text-xs text-slate-500">
                        {e.source}
                        {e.community_name ? ` · ${e.community_name}` : ""}
                        {e.reference ? ` · ${e.reference}` : ""}
                        {e.reverses_ledger_id
                          ? ` · reverses #${e.reverses_ledger_id}`
                          : ""}
                      </p>
                    </div>
                    <p className="font-bold">{money(e.net_usd)}</p>
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
