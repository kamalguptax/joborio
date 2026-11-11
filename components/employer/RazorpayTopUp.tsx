"use client";

import { useMemo, useState } from "react";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  type RazorpayConfig,
} from "@/lib/api/employer";
import { ApiClientError } from "@/lib/api/client";
import { openRazorpayCheckout } from "@/lib/payments/razorpay";

const PRESETS = [25, 50, 100, 250, 500];

type Props = {
  razorpay: RazorpayConfig | null;
  purpose: "wallet" | "program_budget";
  programId?: number;
  title?: string;
  description?: string;
  onSuccess?: (result: {
    prepaid_balance_usd: number;
    message: string;
  }) => void;
};

export default function RazorpayTopUp({
  razorpay,
  purpose,
  programId,
  title = "Add funds with Razorpay",
  description,
  onSuccess,
}: Props) {
  const [amountUsd, setAmountUsd] = useState(100);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const fx = razorpay?.usd_inr_rate ?? 83;
  const inrEstimate = useMemo(
    () => Math.round(Number(amountUsd || 0) * fx),
    [amountUsd, fx],
  );

  const enabled = Boolean(razorpay?.enabled && razorpay.key_id);

  const pay = async () => {
    setError(null);
    setMsg(null);
    const amount = Number(amountUsd);
    if (!Number.isFinite(amount) || amount < 1) {
      setError("Enter at least $1.00 USD.");
      return;
    }
    if (!enabled) {
      setError(
        "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the API server.",
      );
      return;
    }

    setBusy(true);
    try {
      const order = await createRazorpayOrder({
        amount_usd: amount,
        purpose,
        program_id: purpose === "program_budget" ? programId : undefined,
      });

      const checkout = await openRazorpayCheckout({
        key: order.key_id,
        orderId: order.order_id,
        amountPaise: order.amount_paise,
        currency: order.currency,
        name: order.name,
        description: order.description,
        prefill: order.prefill,
      });

      const verified = await verifyRazorpayPayment({
        razorpay_order_id: checkout.razorpay_order_id,
        razorpay_payment_id: checkout.razorpay_payment_id,
        razorpay_signature: checkout.razorpay_signature,
      });

      setMsg(verified.message || "Payment successful.");
      onSuccess?.(verified);
    } catch (err) {
      if (err instanceof Error && err.message === "Payment cancelled.") {
        setError("Payment cancelled.");
      } else {
        setError(
          err instanceof ApiClientError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Payment failed.",
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            {title}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {description ??
              (purpose === "program_budget"
                ? "Pay with Razorpay to increase this campaign’s PPC / PPR / PPA budget."
                : "Top up your prepaid wallet. Use funds for campaign budgets and PPC spend.")}
          </p>
        </div>
        {razorpay?.mode ? (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              razorpay.mode === "test"
                ? "bg-amber-50 text-amber-800"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            Razorpay {razorpay.mode}
          </span>
        ) : null}
      </div>

      {!enabled ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Razorpay test keys are not set on the server yet. Add{" "}
          <code className="font-mono text-xs">RAZORPAY_KEY_ID</code> /{" "}
          <code className="font-mono text-xs">RAZORPAY_KEY_SECRET</code> from the
          Razorpay Dashboard (Test mode), then retry.
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {PRESETS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmountUsd(value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  Number(amountUsd) === value
                    ? "bg-[#172b63] text-white"
                    : "border border-slate-200 text-slate-700"
                }`}
              >
                ${value}
              </button>
            ))}
          </div>

          <label className="mt-4 block text-sm font-semibold">
            Amount (USD)
            <input
              type="number"
              min={1}
              step={1}
              value={amountUsd}
              onChange={(e) => setAmountUsd(Number(e.target.value))}
              className="mt-1 w-full max-w-xs rounded-xl border border-slate-200 px-4 py-3"
            />
          </label>
          <p className="mt-2 text-sm text-slate-500">
            Approx. ₹{inrEstimate.toLocaleString("en-IN")} at ₹{fx}/USD
            (charged in INR via Razorpay).
          </p>

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          {msg ? <p className="mt-3 text-sm text-emerald-700">{msg}</p> : null}

          <button
            type="button"
            disabled={busy || !enabled}
            onClick={pay}
            className="mt-4 rounded-full bg-[#172b63] px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy ? "Opening Razorpay…" : "Pay with Razorpay"}
          </button>
        </>
      )}
    </section>
  );
}
