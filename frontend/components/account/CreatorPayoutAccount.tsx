"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/account/AccountCard";
import { authField, authLabel } from "@/components/auth/authStyles";
import { TransactionHistory, type TransactionRow } from "@/components/payouts/TransactionHistory";
import { toast } from "@/components/ui/Toast";
import { ApiClientError } from "@/lib/api/client";
import {
  fetchCreatorTransactions,
  fetchPayoutAccount,
  savePayoutAccount,
} from "@/lib/api/creator";
import { CURRENCIES, formatMoney, isCurrencyCode } from "@/lib/money";

const methods = [
  { id: "upi", label: "UPI", hint: "PhonePe, Google Pay, Paytm" },
  { id: "bank_transfer", label: "Bank account", hint: "NEFT / IMPS to an Indian account" },
  { id: "paypal", label: "PayPal", hint: "Paid in USD to your PayPal email" },
] as const;

type Method = (typeof methods)[number]["id"];

/**
 * Payout account + how earnings work + transaction history, for the profile page's
 * "Payout account" tab. Renders grid children (the parent is a 2-column grid).
 */
export default function CreatorPayoutAccount() {
  const [method, setMethod] = useState<Method>("upi");
  const [currency, setCurrency] = useState("USD");
  const [holder, setHolder] = useState("");
  const [upi, setUpi] = useState("");
  const [paypal, setPaypal] = useState("");
  const [bank, setBank] = useState("");
  const [account, setAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [minUsd, setMinUsd] = useState(10);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<TransactionRow[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLastPage, setHistoryLastPage] = useState(1);

  useEffect(() => {
    fetchPayoutAccount()
      .then((acc) => {
        if (
          acc.payout_method === "upi" ||
          acc.payout_method === "bank_transfer" ||
          acc.payout_method === "paypal"
        ) {
          setMethod(acc.payout_method);
        }
        setHolder(acc.payout_holder_name ?? "");
        setUpi(acc.payout_upi_id ?? "");
        setPaypal(acc.payout_paypal_email ?? "");
        setBank(acc.payout_bank_name ?? "");
        setAccount(acc.payout_account_number ?? "");
        setIfsc(acc.payout_ifsc ?? "");
        setCurrency(
          acc.payout_currency && isCurrencyCode(acc.payout_currency) ? acc.payout_currency : "USD",
        );
        setMinUsd(Number(acc.min_payout_usd ?? 10));
        setSaved(Boolean(acc.payout_method));
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
      toast.success("Payout account saved. Earnings are sent here once they are payable.");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not save the payout account.");
    } finally {
      setLoading(false);
    }
  };

  const primaryBtn =
    "inline-flex items-center justify-center rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <>
      <Card
        title="Payout account"
        badge={
          saved ? (
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
              On file
            </span>
          ) : null
        }
      >
        <p className="mb-4 text-sm text-slate-500">
          This is the account Upclift uses when your payable balance reaches{" "}
          {formatMoney(minUsd, currency, 0)}.
        </p>
        {error ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label htmlFor="po-currency" className={authLabel}>Currency</label>
            <select
              id="po-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={authField}
            >
              {CURRENCIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className="text-sm font-bold text-[#0A2150]">Where should we pay you?</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {methods.map((item) => (
                <label
                  key={item.id}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    method === item.id
                      ? "border-violet-500 bg-violet-50"
                      : "border-slate-200 hover:border-violet-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    className="sr-only"
                    checked={method === item.id}
                    onChange={() => setMethod(item.id)}
                  />
                  <span className="block text-sm font-semibold text-[#0A2150]">{item.label}</span>
                  <span className="mt-1 block text-xs text-slate-500">{item.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {method !== "paypal" ? (
            <div>
              <label htmlFor="po-holder" className={authLabel}>Account holder name</label>
              <input
                id="po-holder"
                value={holder}
                onChange={(e) => setHolder(e.target.value)}
                required
                className={authField}
                placeholder="Name on the account"
              />
            </div>
          ) : null}

          {method === "upi" ? (
            <div>
              <label htmlFor="po-upi" className={authLabel}>UPI ID</label>
              <input
                id="po-upi"
                value={upi}
                onChange={(e) => setUpi(e.target.value)}
                required
                className={authField}
                placeholder="name@oksbi"
              />
            </div>
          ) : null}

          {method === "paypal" ? (
            <div>
              <label htmlFor="po-paypal" className={authLabel}>PayPal email</label>
              <input
                id="po-paypal"
                type="email"
                value={paypal}
                onChange={(e) => setPaypal(e.target.value)}
                required
                className={authField}
                placeholder="you@email.com"
              />
            </div>
          ) : null}

          {method === "bank_transfer" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="po-bank" className={authLabel}>Bank name</label>
                <input
                  id="po-bank"
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  required
                  className={authField}
                />
              </div>
              <div>
                <label htmlFor="po-account" className={authLabel}>Account number</label>
                <input
                  id="po-account"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  required
                  inputMode="numeric"
                  className={authField}
                />
              </div>
              <div>
                <label htmlFor="po-ifsc" className={authLabel}>IFSC</label>
                <input
                  id="po-ifsc"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  required
                  className={authField}
                  placeholder="SBIN0001234"
                />
              </div>
            </div>
          ) : null}

          <div className="pt-1">
            <button type="submit" disabled={loading} className={primaryBtn}>
              {loading ? "Saving…" : "Save payout account"}
            </button>
          </div>
        </form>
      </Card>

      <div className="lg:col-span-2">
        <Card title="Transaction history">
          <p className="mb-4 text-sm text-slate-500">
            Credits are earnings from clicks. Debits are payouts sent to your payout account.
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
        </Card>
      </div>
    </>
  );
}
