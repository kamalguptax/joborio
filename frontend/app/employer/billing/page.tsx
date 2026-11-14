"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  fetchEmployerBilling,
  fetchEmployerPaymentHistory,
  saveEmployerBilling,
  type EmployerBillingPayload,
  type RazorpayConfig,
} from "@/lib/api/employer";
import { ApiClientError } from "@/lib/api/client";
import RazorpayTopUp from "@/components/employer/RazorpayTopUp";

export default function EmployerBillingPage() {
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [countryCode, setCountryCode] = useState("IN");
  const [businessEmail, setBusinessEmail] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<EmployerBillingPayload["payment_method"]>("upi");
  const [upiId, setUpiId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [canGoLive, setCanGoLive] = useState(false);
  const [prepaidBalance, setPrepaidBalance] = useState(0);
  const [razorpay, setRazorpay] = useState<RazorpayConfig | null>(null);
  const [orders, setOrders] = useState<Array<Record<string, unknown>>>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadHistory = useCallback(() => {
    fetchEmployerPaymentHistory()
      .then((data) => {
        setOrders(data.orders ?? []);
        setPrepaidBalance(Number(data.prepaid_balance_usd ?? 0));
      })
      .catch(() => null);
  }, []);

  const loadBilling = useCallback(() => {
    fetchEmployerBilling()
      .then((data) => {
        const e = data.employer;
        setCompanyName(String(e.company_name ?? ""));
        setWebsite(String(e.website ?? ""));
        setCountryCode(String(e.country_code ?? "IN"));
        setBusinessEmail(String(e.business_email ?? ""));
        setGstNumber(String(e.gst_number ?? ""));
        setBillingAddress(String(e.billing_address ?? ""));
        setPaymentMethod(
          (e.payment_method as EmployerBillingPayload["payment_method"]) ||
            "upi",
        );
        setUpiId(String(e.payment_upi_id ?? ""));
        setAccountName(String(e.payment_account_name ?? ""));
        setBankName(String(e.payment_bank_name ?? ""));
        setAccountNumber(String(e.payment_account_number ?? ""));
        setIfsc(String(e.payment_ifsc ?? ""));
        setCanGoLive(Boolean(data.can_go_live));
        setPrepaidBalance(Number(data.prepaid_balance_usd ?? 0));
        setRazorpay(data.razorpay ?? null);
      })
      .catch(() => setError("Could not load billing details."));
  }, []);

  useEffect(() => {
    loadBilling();
    loadHistory();
  }, [loadBilling, loadHistory]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const result = await saveEmployerBilling({
        company_name: companyName.trim(),
        website: website.trim() || undefined,
        country_code: countryCode.trim().toUpperCase() || undefined,
        business_email: businessEmail.trim(),
        gst_number: gstNumber.trim().toUpperCase(),
        billing_address: billingAddress.trim(),
        payment_method: paymentMethod,
        payment_upi_id: upiId.trim() || undefined,
        payment_account_name: accountName.trim() || undefined,
        payment_bank_name: bankName.trim() || undefined,
        payment_account_number: accountNumber.trim() || undefined,
        payment_ifsc: ifsc.trim().toUpperCase() || undefined,
      });
      setCanGoLive(Boolean(result.can_go_live));
      setMsg(
        result.can_go_live
          ? "Billing saved. You can take campaigns live now."
          : "Saved, but some required details are still missing.",
      );
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not save billing details.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Company & payment</h1>
        <p className="mt-2 text-sm text-slate-500">
          Required before any campaign goes live: company details, GST, business
          email, and payment method. Add Razorpay funds for PPC and campaign
          budgets.
        </p>
        <p
          className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            canGoLive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          {canGoLive ? "Ready to go live" : "Billing incomplete"}
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Prepaid wallet
          </p>
          <p className="mt-2 text-3xl font-bold text-[#172b63]">
            ${prepaidBalance.toFixed(2)}
          </p>
          <p className="mt-1 text-sm text-slate-500">USD available for campaigns</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            How it works
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Pay via Razorpay Checkout (test or live). Wallet credits stay on your
            employer account; campaign top-ups increase that program’s budget
            directly.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <RazorpayTopUp
          razorpay={razorpay}
          purpose="wallet"
          onSuccess={(result) => {
            setPrepaidBalance(Number(result.prepaid_balance_usd ?? 0));
            loadHistory();
          }}
        />
      </div>

      <form
        onSubmit={submit}
        className="max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Company details
        </h2>
        <label className="block text-sm font-semibold">
          Company name
          <input
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
          />
        </label>
        <label className="block text-sm font-semibold">
          Business email
          <input
            required
            type="email"
            value={businessEmail}
            onChange={(e) => setBusinessEmail(e.target.value)}
            placeholder="billing@company.com"
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
          />
        </label>
        <label className="block text-sm font-semibold">
          GST number
          <input
            required
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
            placeholder="22AAAAA0000A1Z5"
            maxLength={15}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 font-mono uppercase"
          />
        </label>
        <label className="block text-sm font-semibold">
          Billing address
          <textarea
            required
            rows={3}
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Website
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
            />
          </label>
          <label className="block text-sm font-semibold">
            Country
            <input
              maxLength={2}
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
            />
          </label>
        </div>

        <h2 className="pt-4 text-sm font-bold uppercase tracking-wider text-slate-400">
          Payment details
        </h2>
        <label className="block text-sm font-semibold">
          Payment method
          <select
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(
                e.target.value as EmployerBillingPayload["payment_method"],
              )
            }
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
          >
            <option value="upi">UPI</option>
            <option value="bank">Bank transfer</option>
            <option value="card">Card</option>
            <option value="invoice">Invoice</option>
          </select>
        </label>
        {paymentMethod === "upi" ? (
          <label className="block text-sm font-semibold">
            UPI ID
            <input
              required
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="company@upi"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
            />
          </label>
        ) : null}
        {paymentMethod === "bank" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold sm:col-span-2">
              Account holder name
              <input
                required
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="block text-sm font-semibold">
              Bank name
              <input
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="block text-sm font-semibold">
              IFSC
              <input
                required
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="block text-sm font-semibold sm:col-span-2">
              Account number
              <input
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </label>
          </div>
        ) : null}
        {paymentMethod === "card" || paymentMethod === "invoice" ? (
          <p className="text-sm text-slate-500">
            Invoices and card charges will be sent to the business email above.
            Campaign funds are still collected through Razorpay Checkout above.
          </p>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-[#172b63] px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save billing details"}
          </button>
          <Link
            href="/employer/programs/new"
            className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700"
          >
            Create campaign
          </Link>
        </div>
      </form>

      {orders.length > 0 ? (
        <section className="mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Recent Razorpay payments
          </h2>
          <ul className="mt-4 divide-y divide-slate-100">
            {orders.slice(0, 10).map((order) => (
              <li
                key={String(order.id)}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-slate-800">
                    ${Number(order.amount_usd ?? 0).toFixed(2)} ·{" "}
                    {String(order.purpose ?? "wallet").replace("_", " ")}
                  </p>
                  <p className="text-xs text-slate-500">
                    {String(order.razorpay_payment_id ?? order.razorpay_order_id ?? "")}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    order.status === "paid"
                      ? "bg-emerald-50 text-emerald-700"
                      : order.status === "failed"
                        ? "bg-red-50 text-red-700"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {String(order.status ?? "created")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
