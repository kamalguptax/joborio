"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "@/components/ui/Toast";
import { ApiClientError } from "@/lib/api/client";
import {
  cancelWalletWithdrawal,
  requestWalletWithdrawal,
  saveWalletPayoutAccount,
  type AccountWallet,
  type WalletRelease,
  type WalletStatementRow,
  type WithdrawalRow,
} from "@/lib/api/wallet";

function money(n: number | null | undefined) {
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

function maskAccount(value?: string | null) {
  if (!value) return "—";
  if (value.length <= 4) return value;
  return `****${value.slice(-4)}`;
}

function accountSummary(input: {
  method: "upi" | "bank_transfer" | "paypal";
  holderName: string;
  upiId: string;
  paypalEmail: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
}) {
  if (input.method === "upi") {
    return [input.holderName, input.upiId].filter(Boolean).join(" · ") || "UPI details incomplete";
  }
  if (input.method === "paypal") {
    return input.paypalEmail || "PayPal email missing";
  }
  return [
    input.holderName,
    input.bankName,
    maskAccount(input.accountNumber),
    input.ifsc,
  ]
    .filter(Boolean)
    .join(" · ") || "Bank details incomplete";
}

function ReleaseList({
  title,
  rows,
}: {
  title: string;
  rows: WalletRelease[];
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No releases yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="font-semibold text-[#172b63]">{row.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {[row.member_name, row.community_name, row.period_label, row.reference]
                    .filter(Boolean)
                    .join(" · ") || row.status}
                </p>
                {row.evidence?.has_evidence ? (
                  <p className="mt-1 text-xs font-semibold text-emerald-700">
                    Evidence on file
                    {row.evidence.evidence_original_name
                      ? ` · ${row.evidence.evidence_original_name}`
                      : ""}
                  </p>
                ) : null}
              </div>
              <div className="text-right">
                <p className="font-bold text-[#172b63]">{money(row.amount_usd)}</p>
                <p className="text-xs text-slate-400">{when(row.occurred_at)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatementList({ rows }: { rows: WalletStatementRow[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold">Transaction statement</h2>
      <p className="mt-1 text-sm text-slate-500">
        Credits, settlements, and withdrawals on this account.
      </p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No transactions yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="font-semibold text-[#172b63]">{row.label}</p>
                <p className="mt-0.5 text-xs capitalize text-slate-500">
                  {[row.kind, row.status, row.reference].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`font-bold ${
                    row.direction === "debit" ? "text-rose-700" : "text-emerald-700"
                  }`}
                >
                  {row.direction === "debit" ? "−" : "+"}
                  {money(row.amount_usd)}
                </p>
                <p className="text-xs text-slate-400">{when(row.occurred_at)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AccountWalletView({
  wallet,
  eyebrow,
  title,
  releaseHref,
  onChanged,
}: {
  wallet: AccountWallet;
  eyebrow: string;
  title: string;
  releaseHref?: string;
  onChanged?: () => void;
}) {
  const minPayout = wallet.min_payout_usd ?? 10;
  const available = wallet.balances.available_usd ?? 0;
  const defaultAccount = wallet.account;

  const initialMethod =
    defaultAccount?.payout_method === "bank_transfer" ||
    defaultAccount?.payout_method === "paypal" ||
    defaultAccount?.payout_method === "upi"
      ? defaultAccount.payout_method
      : "upi";

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"upi" | "bank_transfer" | "paypal">(initialMethod);
  const [holderName, setHolderName] = useState(
    String(defaultAccount?.payout_holder_name ?? ""),
  );
  const [upiId, setUpiId] = useState(String(defaultAccount?.payout_upi_id ?? ""));
  const [paypalEmail, setPaypalEmail] = useState(
    String(defaultAccount?.payout_paypal_email ?? ""),
  );
  const [bankName, setBankName] = useState(String(defaultAccount?.payout_bank_name ?? ""));
  const [accountNumber, setAccountNumber] = useState(
    String(defaultAccount?.payout_account_number ?? ""),
  );
  const [ifsc, setIfsc] = useState(String(defaultAccount?.payout_ifsc ?? ""));
  const [note, setNote] = useState("");
  const [saveAsDefault, setSaveAsDefault] = useState(!defaultAccount?.has_default);
  const [busy, setBusy] = useState(false);
  const [cancelBusyId, setCancelBusyId] = useState<number | null>(null);

  useEffect(() => {
    const nextMethod =
      defaultAccount?.payout_method === "bank_transfer" ||
      defaultAccount?.payout_method === "paypal" ||
      defaultAccount?.payout_method === "upi"
        ? defaultAccount.payout_method
        : "upi";
    setMethod(nextMethod);
    setHolderName(String(defaultAccount?.payout_holder_name ?? ""));
    setUpiId(String(defaultAccount?.payout_upi_id ?? ""));
    setPaypalEmail(String(defaultAccount?.payout_paypal_email ?? ""));
    setBankName(String(defaultAccount?.payout_bank_name ?? ""));
    setAccountNumber(String(defaultAccount?.payout_account_number ?? ""));
    setIfsc(String(defaultAccount?.payout_ifsc ?? ""));
    setSaveAsDefault(!defaultAccount?.has_default);
  }, [defaultAccount]);

  const cards = [
    { label: "Available", value: available, hint: "Ready to withdraw" },
    { label: "Pending", value: wallet.balances.pending_usd, hint: "Not yet payable" },
    { label: "Paid out", value: wallet.balances.paid_usd, hint: "Already paid / withdrawn" },
    {
      label: "Lifetime",
      value: wallet.balances.lifetime_earned_usd,
      hint: "All-time account total",
    },
  ];

  if (typeof wallet.balances.member_pending_usd === "number") {
    cards.push({
      label: "Member pending",
      value: wallet.balances.member_pending_usd,
      hint: "Owed to performance team",
    });
  }

  const pendingWithdrawals = useMemo(
    () => (wallet.withdrawals ?? []).filter((w) => w.status === "pending"),
    [wallet.withdrawals],
  );

  const summary = accountSummary({
    method,
    holderName,
    upiId,
    paypalEmail,
    bankName,
    accountNumber,
    ifsc,
  });
  const amountValue = Number(amount);
  const amountLabel = Number.isFinite(amountValue) && amountValue > 0
    ? money(amountValue)
    : "Enter amount";

  const payoutPayload = () => ({
    payout_method: method,
    holder_name: holderName || undefined,
    upi_id: upiId || undefined,
    paypal_email: paypalEmail || undefined,
    bank_name: bankName || undefined,
    account_number: accountNumber || undefined,
    ifsc: ifsc || undefined,
  });

  const saveDefaultAccountOnly = async () => {
    setBusy(true);
    try {
      await saveWalletPayoutAccount(wallet.role, payoutPayload());
      toast.success("Default payout account saved.");
      onChanged?.();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("joborio:wallet-updated"));
      }
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Could not save payout account.",
      );
    } finally {
      setBusy(false);
    }
  };

  const submitWithdraw = async (event: FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid withdrawal amount.");
      return;
    }
    if (value < minPayout) {
      toast.error(`Minimum withdrawal is ${money(minPayout)}.`);
      return;
    }
    if (value > available) {
      toast.error(`Available balance is ${money(available)}.`);
      return;
    }

    setBusy(true);
    try {
      await requestWalletWithdrawal(wallet.role, {
        amount_usd: value,
        ...payoutPayload(),
        user_note: note || undefined,
        save_as_default: saveAsDefault,
      });
      toast.success(
        saveAsDefault
          ? "Withdrawal requested and account saved as default."
          : "Withdrawal requested. Admin will review and pay.",
      );
      setAmount("");
      setNote("");
      onChanged?.();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("joborio:wallet-updated"));
      }
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Could not submit withdrawal.",
      );
    } finally {
      setBusy(false);
    }
  };

  const cancelWithdrawal = async (row: WithdrawalRow) => {
    setCancelBusyId(row.id);
    try {
      await cancelWalletWithdrawal(wallet.role, row.id);
      toast.success("Withdrawal cancelled.");
      onChanged?.();
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Could not cancel withdrawal.",
      );
    } finally {
      setCancelBusyId(null);
    }
  };

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-3xl font-bold">{title}</h1>
        {wallet.note ? (
          <p className="mt-2 max-w-2xl text-slate-500">{wallet.note}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-[#172b63]">
              {money(card.value)}
            </p>
            <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={submitWithdraw}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold">Withdraw funds</h2>
          <p className="mt-1 text-sm text-slate-500">
            Available {money(available)}. Minimum {money(minPayout)}.
          </p>

          {defaultAccount?.has_default ? (
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Default account
              </p>
              <p className="mt-1 font-semibold text-emerald-950">
                {String(defaultAccount.payout_method || "").replace("_", " ").toUpperCase()}
              </p>
              <p className="mt-0.5 text-emerald-800">
                {defaultAccount.summary || "Saved payout details"}
              </p>
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Add payout account details below. You can save them as your default.
            </p>
          )}

          <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-slate-400">
            Amount (USD)
            <input
              type="number"
              min={minPayout}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-[#172b63]"
              placeholder={String(minPayout)}
            />
          </label>

          <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-slate-400">
            Payout method
            <select
              value={method}
              onChange={(e) =>
                setMethod(e.target.value as "upi" | "bank_transfer" | "paypal")
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-[#172b63]"
            >
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="paypal">PayPal</option>
            </select>
          </label>

          {method === "upi" ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-400">
                Holder name
                <input
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-400">
                UPI ID
                <input
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            </div>
          ) : null}

          {method === "paypal" ? (
            <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-slate-400">
              PayPal email
              <input
                type="email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          ) : null}

          {method === "bank_transfer" ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-400">
                Holder name
                <input
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-400">
                Bank name
                <input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-400">
                Account number
                <input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-400">
                IFSC
                <input
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            </div>
          ) : null}

          <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-slate-400">
            Note (optional)
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>

          <label className="mt-4 flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={saveAsDefault}
              onChange={(e) => setSaveAsDefault(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <span className="font-semibold text-[#172b63]">Make default account</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Also save these details when you request a withdrawal.
              </span>
            </span>
          </label>

          <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/70 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
              Withdrawal summary
            </p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">Amount</p>
                <p className="text-xl font-bold text-[#172b63]">{amountLabel}</p>
              </div>
              <div className="text-right">
                <p className="text-xs capitalize text-slate-500">
                  {method.replace("_", " ")}
                </p>
                <p className="max-w-xs text-sm font-semibold text-[#172b63]">{summary}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveDefaultAccountOnly()}
              className="rounded-full border border-emerald-300 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save as default account"}
            </button>
            <button
              type="submit"
              disabled={busy || available < minPayout}
              className="rounded-full bg-[#172b63] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Submitting…" : "Request withdrawal"}
            </button>
          </div>
        </form>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Withdrawal requests</h2>
          {(wallet.withdrawals?.length ?? 0) === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No withdrawal requests yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 text-sm">
              {(wallet.withdrawals ?? []).map((row) => {
                const details = Object.values(row.payout_details || {})
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-start justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="font-semibold text-[#172b63]">
                        {money(row.amount_usd)} · {row.payout_method || "payout"}
                      </p>
                      {details ? (
                        <p className="mt-0.5 text-xs text-slate-500">{details}</p>
                      ) : null}
                      <p className="mt-0.5 text-xs capitalize text-slate-500">
                        {row.status}
                        {row.created_at ? ` · ${when(row.created_at)}` : ""}
                      </p>
                      {row.admin_note ? (
                        <p className="mt-1 text-xs text-amber-700">{row.admin_note}</p>
                      ) : null}
                    </div>
                    {row.status === "pending" ? (
                      <button
                        type="button"
                        disabled={cancelBusyId === row.id}
                        onClick={() => cancelWithdrawal(row)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 disabled:opacity-50"
                      >
                        {cancelBusyId === row.id ? "Cancelling…" : "Cancel"}
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          {pendingWithdrawals.length > 0 ? (
            <p className="mt-3 text-xs text-amber-700">
              Pending requests hold funds until paid, rejected, or cancelled.
            </p>
          ) : null}
        </div>
      </div>

      {(wallet.pending_member_settlements?.length ?? 0) > 0 ? (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold">Pending member payments</h2>
              <p className="mt-1 text-sm text-slate-500">
                Release when Available covers the amount (with payment evidence).
              </p>
            </div>
            {releaseHref ? (
              <Link
                href={releaseHref}
                className="text-sm font-semibold text-violet-700"
              >
                Open payout status →
              </Link>
            ) : null}
          </div>
          <ul className="mt-4 divide-y divide-slate-100 text-sm">
            {wallet.pending_member_settlements?.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-semibold text-[#172b63]">
                    {row.member_name || "Member"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {[row.community_name, row.period_label]
                      .filter(Boolean)
                      .join(" · ") || "Pending settlement"}
                  </p>
                  {row.can_release ? (
                    <p className="mt-1 text-xs font-semibold text-emerald-700">
                      Ready to release from wallet
                    </p>
                  ) : (
                    <p className="mt-1 text-xs font-semibold text-amber-700">
                      Need {money(row.wallet_shortfall_usd)} more available
                    </p>
                  )}
                </div>
                <p className="font-bold text-[#172b63]">{money(row.amount_usd)}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-8 space-y-6">
        <StatementList rows={wallet.statement ?? []} />
        <ReleaseList title="Payment releases" rows={wallet.releases ?? []} />
        {wallet.member_releases ? (
          <ReleaseList
            title="Member payment releases"
            rows={wallet.member_releases}
          />
        ) : null}
      </div>
    </>
  );
}
