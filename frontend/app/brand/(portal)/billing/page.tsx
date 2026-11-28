"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  fetchEmployerBilling,
  fetchEmployerWallet,
  type RazorpayConfig,
} from "@/lib/api/employer";
import RazorpayTopUp from "@/components/employer/RazorpayTopUp";
import { toast } from "@/components/ui/Toast";
import PageHeader from "@/components/layout/PageHeader";

const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n || 0);

export default function EmployerBillingPage() {
  const [canGoLive, setCanGoLive] = useState(false);
  const [missingLabels, setMissingLabels] = useState<string[]>([]);
  const [prepaidBalance, setPrepaidBalance] = useState(0);
  const [razorpay, setRazorpay] = useState<RazorpayConfig | null>(null);
  const [tiles, setTiles] = useState<Array<{ l: string; v: number; n: string }>>(
    [],
  );
  const [expenditure, setExpenditure] = useState<
    Array<{ id: number; name: string; budget: number; spent: number; pending: number }>
  >([]);
  const [ledger, setLedger] = useState<
    Array<{
      id: string;
      date: string | null;
      type: string;
      campaign: string;
      debit: number | null;
      credit: number | null;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fetchEmployerBilling(), fetchEmployerWallet()])
      .then(([billing, wallet]) => {
        setCanGoLive(Boolean(billing.can_go_live ?? wallet.can_go_live));
        setMissingLabels(
          billing.missing_labels ?? wallet.missing_labels ?? [],
        );
        setPrepaidBalance(
          Number(billing.prepaid_balance_usd ?? wallet.prepaid_balance_usd ?? 0),
        );
        setRazorpay(billing.razorpay ?? null);
        setTiles(wallet.tiles ?? []);
        setExpenditure(wallet.expenditure ?? []);
        setLedger(wallet.ledger ?? []);
      })
      .catch(() => toast.error("Could not load wallet."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#brand-add-fund") return;
    const t = window.setTimeout(() => {
      document
        .getElementById("brand-add-fund")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <>
      <PageHeader title="Billing and wallet" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mt-1 text-sm text-slate-500">
            Top up with Razorpay. Spend is tracked in an append-only ledger.
          </p>
          <p
            className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              canGoLive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-800"
            }`}
          >
            {canGoLive ? "Ready to go live" : "Complete Brand Profile + first top-up"}
          </p>
          {!canGoLive && missingLabels.length > 0 ? (
            <p className="mt-2 text-sm text-amber-900">
              Still needed on{" "}
              <Link
                href="/brand/profile"
                className="font-bold text-violet-700 underline"
              >
                Brand Profile
              </Link>
              : {missingLabels.join(", ")}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => {
            document
              .getElementById("brand-add-fund")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="rounded-full bg-violet-600 px-4 py-2 text-sm font-bold text-white"
        >
          Add funds
        </button>
      </div>

      <div id="brand-add-fund" className="mt-5 scroll-mt-24">
        <RazorpayTopUp
          razorpay={razorpay}
          purpose="wallet"
          title="Add funds with Razorpay"
          description="Pay by UPI, card, or netbanking inside Razorpay Checkout."
          onSuccess={(result) => {
            setPrepaidBalance(Number(result.prepaid_balance_usd ?? 0));
            load();
            window.dispatchEvent(new Event("joborio:wallet-updated"));
          }}
        />
      </div>

      {loading ? (
        <p className="mt-5 text-sm text-slate-500">Loading wallet…</p>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {(tiles.length
              ? tiles
              : [
                  {
                    l: "Available balance",
                    v: prepaidBalance,
                    n: "Prepaid wallet (USD)",
                  },
                ]
            ).map((k) => (
              <div
                key={k.l}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase text-slate-400">
                  {k.l}
                </p>
                <p className="mt-2 text-xl font-bold text-[#0A2150]">
                  {typeof k.v === "number" && k.l !== "Campaigns"
                    ? money(k.v)
                    : k.v}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">{k.n}</p>
              </div>
            ))}
          </div>

          <section className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#0A2150]">
              Campaign-wise expenditure
            </h2>
            {expenditure.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                No campaigns yet. Create a campaign to see spend here.
              </p>
            ) : (
              <table className="mt-3 min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2">Campaign</th>
                    <th className="px-3 py-2">Budget</th>
                    <th className="px-3 py-2">Spent (approved only)</th>
                    <th className="px-3 py-2">Pending value</th>
                  </tr>
                </thead>
                <tbody>
                  {expenditure.map((e) => (
                    <tr key={e.id} className="border-b border-slate-100">
                      <td className="px-3 py-2 font-medium text-[#0A2150]">
                        {e.name}
                      </td>
                      <td className="px-3 py-2">{money(e.budget)}</td>
                      <td className="px-3 py-2">{money(e.spent)}</td>
                      <td className="px-3 py-2">{money(e.pending)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#0A2150]">
              Transaction ledger
            </h2>
            {ledger.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                No ledger entries yet. Top up with Razorpay to create the first
                credit.
              </p>
            ) : (
              <table className="mt-3 min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2">Entry</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Campaign</th>
                    <th className="px-3 py-2">Debit</th>
                    <th className="px-3 py-2">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((l) => (
                    <tr key={l.id} className="border-b border-slate-100">
                      <td className="px-3 py-2 font-mono text-xs">{l.id}</td>
                      <td className="px-3 py-2">{l.date || "—"}</td>
                      <td className="px-3 py-2">{l.type}</td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {l.campaign}
                      </td>
                      <td className="px-3 py-2">
                        {l.debit != null ? money(l.debit) : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {l.credit != null ? money(l.credit) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/brand/support"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold"
              >
                Raise billing dispute
              </Link>
            </div>
          </section>
        </>
      )}
    </>
  );
}
