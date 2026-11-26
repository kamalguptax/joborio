"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import {
  fetchEmployerBilling,
  type RazorpayConfig,
} from "@/lib/api/employer";
import RazorpayTopUp from "@/components/employer/RazorpayTopUp";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export default function BrandWalletCard() {
  const [balance, setBalance] = useState<number | null>(null);
  const [razorpay, setRazorpay] = useState<RazorpayConfig | null>(null);
  const [showAddFund, setShowAddFund] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchEmployerBilling()
      .then((data) => {
        setBalance(Number(data.prepaid_balance_usd ?? 0));
        setRazorpay(data.razorpay ?? null);
        setError(null);
      })
      .catch(() => {
        setError("Could not load wallet.");
        setBalance(null);
      });
  }, []);

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    window.addEventListener("joborio:wallet-updated", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("joborio:wallet-updated", onFocus);
    };
  }, [load]);

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Wallet size={20} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Wallet
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-[#0F1B3D]">
              {balance == null ? "…" : money.format(balance)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Prepaid balance for campaign spend
            </p>
            {error ? (
              <p className="mt-2 text-xs font-semibold text-amber-700">{error}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowAddFund((v) => !v)}
            className="rounded-full bg-violet-600 px-4 py-2 text-sm font-bold text-white"
          >
            {showAddFund ? "Hide add fund" : "Add fund"}
          </button>
          <Link
            href="/employer/billing"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Billing & Wallet
          </Link>
        </div>
      </div>

      {showAddFund ? (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <RazorpayTopUp
            razorpay={razorpay}
            purpose="wallet"
            title="Add fund"
            description="Top up your brand wallet with Razorpay. Credits stay on your employer account for campaign spend."
            onSuccess={(result) => {
              setBalance(Number(result.prepaid_balance_usd ?? 0));
              window.dispatchEvent(new Event("joborio:wallet-updated"));
              setShowAddFund(false);
            }}
          />
        </div>
      ) : null}
    </section>
  );
}
