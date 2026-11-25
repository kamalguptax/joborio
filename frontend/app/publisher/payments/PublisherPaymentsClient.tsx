"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "@/components/ui/Toast";
import { ApiClientError } from "@/lib/api/client";
import {
  fetchPublisherPayments,
  releasePublisherSettlement,
  type PublisherPaymentHistory,
} from "@/lib/api/publisher";
import { PageSkeleton } from "@/components/ui/Skeleton";
import BackButton from "@/components/ui/BackButton";
import { useSearchParams } from "next/navigation";

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

export default function PublisherPaymentsClient() {
  const search = useSearchParams();
  const from = (search.get("from") || "").trim();
  const backHref =
    from === "earnings" ? "/publisher/earnings" : "/publisher/wallet";
  const backLabel =
    from === "earnings" ? "Back to earning" : "Back to wallet";
  const [data, setData] = useState<PublisherPaymentHistory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [releasingId, setReleasingId] = useState<number | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceNote, setEvidenceNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    fetchPublisherPayments()
      .then(setData)
      .catch((err) =>
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load payment history.",
        ),
      );

  useEffect(() => {
    void load();
  }, []);

  const release = async (settlementId: number) => {
    if (!evidenceFile) {
      toast.error("Upload payment evidence (PDF or image) before releasing.");
      return;
    }
    setBusy(true);
    try {
      await releasePublisherSettlement(settlementId, {
        evidence: evidenceFile,
        evidence_note: evidenceNote || undefined,
      });
      toast.success("Payment released from wallet with evidence.");
      setReleasingId(null);
      setEvidenceFile(null);
      setEvidenceNote("");
      await load();
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Could not release payment.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {error}
      </p>
    );
  }

  if (!data) {
    return <PageSkeleton />;
  }

  const walletAvailable = Number(data.summary.wallet_available_usd ?? 0);
  const memberPending = Number(data.summary.member_pending_usd ?? 0);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <BackButton href={backHref} label={backLabel} />
          <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-violet-600">
            Payment History
          </p>
          <h1 className="mt-1 text-3xl font-bold">Settlements</h1>
          <p className="mt-2 max-w-2xl text-slate-500">{data.note}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/publisher/wallet"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Wallet
          </Link>
          <Link
            href="/publisher/earnings?from=payments"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Publisher earnings
          </Link>
        </div>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Wallet available", walletAvailable],
          ["Member pending", memberPending],
          ["Paid credits", data.summary.publisher_paid_credits_usd],
          ["Settlement debits", data.summary.publisher_settlement_debits_usd],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
          >
            <p className="text-2xl font-bold text-[#172b63]">{money(value)}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {label}
            </p>
          </div>
        ))}
      </div>

      {walletAvailable <= 0 ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Your wallet has no payable commission yet. Member payments can be
          released only when <strong>Wallet available</strong> covers the
          settlement amount.
        </div>
      ) : null}

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
                      {row.evidence?.has_evidence ? (
                        <p className="mt-1 text-xs font-semibold text-emerald-700">
                          Evidence on file
                        </p>
                      ) : null}
                    </div>
                    <p className="font-bold">{money(row.amount_usd)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Member payment release</h2>
          <p className="mt-1 text-xs text-slate-500">
            Select a member, pay to their saved bank/UPI account, upload
            evidence. Funds then appear in the member wallet for withdrawal.
          </p>
          {data.member_settlements.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No member settlement records yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {data.member_settlements.map((row) => {
                const canRelease = Boolean(row.can_release);
                const shortfall = Number(row.wallet_shortfall_usd ?? 0);
                const account = row.payout_account;
                const method = String(account?.payout_method || "").replace(
                  "_",
                  " ",
                );
                return (
                  <li
                    key={`mem-${row.id}`}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
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

                        {row.has_payout_account ? (
                          <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                              Pay to this account
                            </p>
                            <p className="mt-0.5 text-xs font-semibold capitalize text-emerald-950">
                              {method || "Payout"}
                            </p>
                            <p className="text-xs text-emerald-900">
                              {account?.summary || "Saved payout details"}
                            </p>
                            {account?.payout_method === "upi" ? (
                              <p className="mt-1 text-[11px] text-emerald-800">
                                Holder: {account.payout_holder_name || "—"} · UPI:{" "}
                                {account.payout_upi_id || "—"}
                              </p>
                            ) : null}
                            {account?.payout_method === "bank_transfer" ? (
                              <p className="mt-1 text-[11px] text-emerald-800">
                                {account.payout_holder_name || "—"} ·{" "}
                                {account.payout_bank_name || "—"} · A/C{" "}
                                {account.payout_account_number || "—"} · IFSC{" "}
                                {account.payout_ifsc || "—"}
                              </p>
                            ) : null}
                            {account?.payout_method === "paypal" ? (
                              <p className="mt-1 text-[11px] text-emerald-800">
                                PayPal: {account.payout_paypal_email || "—"}
                              </p>
                            ) : null}
                          </div>
                        ) : row.status === "pending" ? (
                          <p className="mt-2 text-xs font-semibold text-amber-700">
                            Member has not added bank/UPI details in their wallet
                            yet.
                          </p>
                        ) : null}

                        {row.evidence?.has_evidence ? (
                          <p className="mt-1 text-xs font-semibold text-emerald-700">
                            Evidence · {row.evidence.evidence_original_name}
                          </p>
                        ) : null}
                        {row.status === "pending" && !canRelease ? (
                          <p className="mt-1 text-xs font-semibold text-amber-700">
                            {row.release_block_reason ||
                              (shortfall > 0
                                ? `Need ${money(shortfall)} more in wallet to release.`
                                : "Cannot release yet.")}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{money(row.amount_usd)}</p>
                        {row.status === "pending" ? (
                          <button
                            type="button"
                            disabled={!canRelease}
                            className="mt-2 text-xs font-bold text-violet-700 disabled:cursor-not-allowed disabled:text-slate-400"
                            onClick={() =>
                              setReleasingId(
                                releasingId === row.id ? null : row.id,
                              )
                            }
                          >
                            {!canRelease
                              ? "Blocked"
                              : releasingId === row.id
                                ? "Cancel"
                                : "Select & pay"}
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {releasingId === row.id && canRelease ? (
                      <div className="mt-3 space-y-2 rounded-xl border border-violet-100 bg-white p-3">
                        <p className="text-xs font-semibold text-[#172b63]">
                          Pay {money(row.amount_usd)} to the account above, then
                          upload transfer evidence.
                        </p>
                        <p className="text-xs text-slate-500">
                          Will debit {money(row.amount_usd)} from your wallet
                          available ({money(walletAvailable)}). Member can then
                          withdraw from their wallet.
                        </p>
                        <label className="block text-xs font-semibold text-slate-600">
                          Payment evidence (PDF / JPG / PNG)
                          <input
                            type="file"
                            accept=".pdf,image/jpeg,image/png,image/webp"
                            className="mt-1 block w-full text-xs"
                            onChange={(e) =>
                              setEvidenceFile(e.target.files?.[0] ?? null)
                            }
                          />
                        </label>
                        <input
                          value={evidenceNote}
                          onChange={(e) => setEvidenceNote(e.target.value)}
                          placeholder="UTR / transfer note (optional)"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void release(row.id)}
                          className="rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                        >
                          {busy ? "Releasing…" : "Confirm paid + credit member wallet"}
                        </button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
