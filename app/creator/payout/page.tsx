"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { TransactionHistory, type TransactionRow } from "@/components/payouts/TransactionHistory";
import { fetchCreatorTransactions, fetchPayoutAccount, savePayoutAccount } from "@/lib/api/creator";
import { ApiClientError } from "@/lib/api/client";
import { CURRENCIES, formatMoney, isCurrencyCode } from "@/lib/money";

const methods = [
  { id: "upi", label: "UPI", hint: "PhonePe, Google Pay, Paytm" },
  { id: "bank_transfer", label: "Bank account", hint: "NEFT / IMPS to an Indian account" },
  { id: "paypal", label: "PayPal", hint: "Paid in USD to your PayPal email" },
] as const;

type Method = (typeof methods)[number]["id"];

export default function CreatorPayoutPage() {
  const [method, setMethod] = useState<Method>("upi");
  const [currency, setCurrency] = useState("USD");
  const [holder, setHolder] = useState("");
  const [upi, setUpi] = useState("");
  const [paypal, setPaypal] = useState("");
  const [bank, setBank] = useState("");
  const [account, setAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [minUsd, setMinUsd] = useState(10);
  const [feePercent, setFeePercent] = useState(30);
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<TransactionRow[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLastPage, setHistoryLastPage] = useState(1);

  useEffect(() => {
    fetchPayoutAccount()
      .then((account) => {
        if (
          account.payout_method === "upi" ||
          account.payout_method === "bank_transfer" ||
          account.payout_method === "paypal"
        ) {
          setMethod(account.payout_method);
        }
        setHolder(account.payout_holder_name ?? "");
        setUpi(account.payout_upi_id ?? "");
        setPaypal(account.payout_paypal_email ?? "");
        setBank(account.payout_bank_name ?? "");
        setAccount(account.payout_account_number ?? "");
        setIfsc(account.payout_ifsc ?? "");
        setCurrency(
          account.payout_currency && isCurrencyCode(account.payout_currency)
            ? account.payout_currency
            : "USD",
        );
        setMinUsd(Number(account.min_payout_usd ?? 10));
        setFeePercent(Number(account.platform_fee_percent ?? 30));
        setSaved(Boolean(account.payout_method));
      })
      .catch(() => setError("Sign in as a creator to add a payout account."));
  }, []);

  useEffect(() => {
    fetchCreatorTransactions(historyPage)
      .then(({ data, meta }) => {
        setHistory(data);
        setHistoryLastPage(Number(meta.last_page ?? 1));
      })
      .catch(() => setHistory([]));
  }, [historyPage]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      await savePayoutAccount({
        payout_method: method,
        payout_currency: currency,
        payout_holder_name: holder || null,
        payout_upi_id: upi || null,
        payout_paypal_email: paypal || null,
        payout_bank_name: bank || null,
        payout_account_number: account || null,
        payout_ifsc: ifsc || null,
      });
      setSaved(true);
      setMsg("Payout account saved. Earnings are sent here once they are payable.");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not save the payout account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
          Get paid
        </p>
        <h1 className="mt-1 text-3xl font-bold">Payout account</h1>
        <p className="mt-2 max-w-2xl text-slate-500">
          This is the account JobOrio uses when your payable balance reaches {formatMoney(minUsd, currency, 0)}.
        </p>
      </div>

      <section className="mb-6 rounded-3xl border border-indigo-100 bg-indigo-50/60 p-6">
        <h2 className="font-bold text-[#0F1536]">How you earn</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600">
          <li>Sign up as a creator and open a job from Opportunities.</li>
          <li>Copy your tracked link and share it with your audience.</li>
          <li>
            A counted click earns the click rate set by JobOrio.
            JobOrio keeps a {feePercent}% fee, so your net is about {100 - feePercent}% of that rate.
          </li>
          <li>
            A verified signup (PPR) or a confirmed application (PPA) earns a higher rate on campaigns you join.
          </li>
          <li>
            Money starts as pending, becomes approved after the hold, then payable. At {formatMoney(minUsd, currency, 0)} payable it is paid to this account.
          </li>
        </ol>
        <Link href="/creator/earnings" className="mt-4 inline-block text-sm font-semibold text-indigo-700">
          Open the full transaction history →
        </Link>
      </section>

      {saved ? (
        <p className="mb-4 text-sm font-semibold text-emerald-700">
          A payout account is on file.
        </p>
      ) : null}
      {msg ? (
        <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{msg}</p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="mb-5 block text-sm font-semibold">
          Currency
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal"
          >
            {CURRENCIES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend className="text-sm font-bold">Where should we pay you?</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {methods.map((item) => (
              <label
                key={item.id}
                className={`cursor-pointer rounded-2xl border p-4 ${
                  method === item.id ? "border-indigo-500 bg-indigo-50" : "border-slate-200"
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  className="sr-only"
                  checked={method === item.id}
                  onChange={() => setMethod(item.id)}
                />
                <span className="block font-semibold">{item.label}</span>
                <span className="mt-1 block text-xs text-slate-500">{item.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {method !== "paypal" ? (
          <label className="mt-5 block text-sm font-semibold">
            Account holder name
            <input
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal"
              placeholder="Name on the account"
            />
          </label>
        ) : null}

        {method === "upi" ? (
          <label className="mt-4 block text-sm font-semibold">
            UPI ID
            <input
              value={upi}
              onChange={(e) => setUpi(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal"
              placeholder="name@oksbi"
            />
          </label>
        ) : null}

        {method === "paypal" ? (
          <label className="mt-5 block text-sm font-semibold">
            PayPal email
            <input
              type="email"
              value={paypal}
              onChange={(e) => setPaypal(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal"
              placeholder="you@email.com"
            />
          </label>
        ) : null}

        {method === "bank_transfer" ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold sm:col-span-2">
              Bank name
              <input
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal"
              />
            </label>
            <label className="text-sm font-semibold">
              Account number
              <input
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                required
                inputMode="numeric"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal"
              />
            </label>
            <label className="text-sm font-semibold">
              IFSC
              <input
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal"
                placeholder="SBIN0001234"
              />
            </label>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {loading ? "Saving…" : "Save payout account"}
        </button>
      </form>

      <section className="mt-10">
        <h2 className="text-lg font-bold">Transaction history</h2>
        <p className="mt-1 mb-4 text-sm text-slate-500">
          Credits are earnings from clicks. Debits are payouts sent to this account.
        </p>
        <TransactionHistory rows={history} currency={currency} />
        {historyLastPage > 1 ? (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <button
              type="button"
              disabled={historyPage <= 1}
              onClick={() => setHistoryPage((p) => p - 1)}
              className="rounded border border-slate-200 px-3 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-slate-500">
              Page {historyPage} / {historyLastPage}
            </span>
            <button
              type="button"
              disabled={historyPage >= historyLastPage}
              onClick={() => setHistoryPage((p) => p + 1)}
              className="rounded border border-slate-200 px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </section>
    </>
  );
}
