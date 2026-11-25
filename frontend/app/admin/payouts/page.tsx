"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/ui/Toast";
import { TransactionHistory, type TransactionRow } from "@/components/payouts/TransactionHistory";
import {
  adminCompletePayoutBatch,
  adminCreatePayoutBatch,
  adminExportPayoutReport,
  adminListPayoutBatches,
  adminListWithdrawals,
  adminPayWithdrawal,
  adminPayoutPreview,
  adminPayoutTransactions,
  adminPublisherPayoutPreview,
  adminPublisherPayoutReleases,
  adminRejectWithdrawal,
  adminReleasePublisherPayout,
  type AdminPublisherPayoutRow,
  type AdminWithdrawalRow,
} from "@/lib/api/admin";

type PreviewCreator = {
  creator_id: number;
  handle: string;
  trust_tier: string;
  amount_usd: number;
  auto_payout_eligible: boolean;
  requires_manual_review: boolean;
};

export default function AdminPayoutsPage() {
  const [preview, setPreview] = useState<{
    min_payout_usd?: number;
    total_usd?: number;
    creators?: PreviewCreator[];
  } | null>(null);
  const [batch, setBatch] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<
    "history" | "users" | "batches" | "publishers" | "withdrawals"
  >("history");
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalRow[]>([]);
  const [wdStatus, setWdStatus] = useState("all");
  const [selectedWithdrawalId, setSelectedWithdrawalId] = useState<number | null>(
    null,
  );
  const [wdEvidenceFile, setWdEvidenceFile] = useState<File | null>(null);
  const [wdEvidenceNote, setWdEvidenceNote] = useState("");
  const [wdExternalRef, setWdExternalRef] = useState("");
  const [wdAdminNote, setWdAdminNote] = useState("");
  const [wdBusy, setWdBusy] = useState(false);
  const [tx, setTx] = useState<TransactionRow[]>([]);
  const [userRows, setUserRows] = useState<Array<Record<string, unknown>>>([]);
  const [txPage, setTxPage] = useState(1);
  const [txLastPage, setTxLastPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceNote, setEvidenceNote] = useState("");
  const [externalRef, setExternalRef] = useState("");
  const [completeBusy, setCompleteBusy] = useState(false);
  const [publisherPreview, setPublisherPreview] = useState<{
    publishers: AdminPublisherPayoutRow[];
    total_usd: number;
    count: number;
  } | null>(null);
  const [publisherReleases, setPublisherReleases] = useState<
    Array<Record<string, unknown>>
  >([]);
  const [selectedPublisherId, setSelectedPublisherId] = useState<number | null>(
    null,
  );
  const [pubEvidenceFile, setPubEvidenceFile] = useState<File | null>(null);
  const [pubEvidenceNote, setPubEvidenceNote] = useState("");
  const [pubExternalRef, setPubExternalRef] = useState("");
  const [pubBusy, setPubBusy] = useState(false);

  const downloadReport = async () => {
    setDownloadBusy(true);
    try {
      await adminExportPayoutReport({
        view: tab === "users" ? "users" : "transactions",
        user_id: tab === "history" && userId ? userId : undefined,
        search: tab === "history" ? query || undefined : undefined,
      });
      toast.success("Payout report downloaded.");
    } catch {
      toast.error("Could not download payout report.");
    } finally {
      setDownloadBusy(false);
    }
  };

  const loadHistory = () => {
    adminListPayoutBatches()
      .then(setHistory)
      .catch(() => setError("Could not load batch history."));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const loadPublisherPayouts = () => {
    Promise.all([adminPublisherPayoutPreview(), adminPublisherPayoutReleases()])
      .then(([previewRes, releasesRes]) => {
        setPublisherPreview(previewRes);
        setPublisherReleases(releasesRes.releases as Array<Record<string, unknown>>);
      })
      .catch(() => {
        setPublisherPreview({ publishers: [], total_usd: 0, count: 0 });
        setPublisherReleases([]);
      });
  };

  const [wdError, setWdError] = useState<string | null>(null);

  const loadWithdrawals = () => {
    setWdError(null);
    adminListWithdrawals({
      status: !wdStatus || wdStatus === "all" ? undefined : wdStatus,
      limit: 80,
    })
      .then((res) => setWithdrawals(res.withdrawals ?? []))
      .catch(() => {
        setWithdrawals([]);
        setWdError(
          "Could not load withdrawals. Check API and run migrations if needed.",
        );
      });
  };

  useEffect(() => {
    if (tab === "batches" || tab === "publishers" || tab === "withdrawals") return;
    adminPayoutTransactions({
      view: tab === "users" ? "users" : undefined,
      page: txPage,
      user_id: tab === "history" && userId ? userId : undefined,
      search: tab === "history" ? query || undefined : undefined,
    })
      .then(({ data, meta }) => {
        if (tab === "users") setUserRows(data);
        else setTx(data as TransactionRow[]);
        setTxLastPage(Number(meta.last_page ?? 1));
        setTxTotal(Number(meta.total ?? 0));
      })
      .catch(() => {
        setTx([]);
        setUserRows([]);
      });
  }, [tab, txPage, userId, query]);

  useEffect(() => {
    if (tab === "publishers") loadPublisherPayouts();
    if (tab === "withdrawals") loadWithdrawals();
  }, [tab, wdStatus]);

  const runPreview = async () => {
    setError(null);
    setPreview(
      (await adminPayoutPreview(mode === "auto" ? "auto" : "manual")) as typeof preview,
    );
  };

  const createBatch = async () => {
    setError(null);
    try {
      const created = await adminCreatePayoutBatch(mode);
      setBatch(created);
      toast.success("Payout batch created.");
      loadHistory();
    } catch {
      toast.error("Could not create the payout batch.");
    }
  };

  const complete = async () => {
    const id = batch?.id as number | undefined;
    if (!id) return;
    if (!evidenceFile) {
      toast.error("Upload payment evidence before marking the batch complete.");
      return;
    }
    setCompleteBusy(true);
    try {
      setBatch(
        await adminCompletePayoutBatch(id, {
          evidence: evidenceFile,
          evidence_note: evidenceNote || undefined,
          external_reference: externalRef || undefined,
        }),
      );
      toast.success("Creator payout batch released with evidence.");
      setEvidenceFile(null);
      setEvidenceNote("");
      setExternalRef("");
      loadHistory();
    } catch {
      toast.error("Could not complete the payout batch.");
    } finally {
      setCompleteBusy(false);
    }
  };

  const releasePublisher = async () => {
    if (!selectedPublisherId) {
      toast.error("Select a publisher first.");
      return;
    }
    if (!pubEvidenceFile) {
      toast.error("Upload payment evidence before releasing publisher payout.");
      return;
    }
    setPubBusy(true);
    try {
      const res = await adminReleasePublisherPayout(selectedPublisherId, {
        evidence: pubEvidenceFile,
        evidence_note: pubEvidenceNote || undefined,
        external_reference: pubExternalRef || undefined,
      });
      toast.success(
        `Released $${Number(res.released_usd).toFixed(2)} to ${res.display_name}.`,
      );
      setSelectedPublisherId(null);
      setPubEvidenceFile(null);
      setPubEvidenceNote("");
      setPubExternalRef("");
      loadPublisherPayouts();
    } catch {
      toast.error("Could not release publisher payout.");
    } finally {
      setPubBusy(false);
    }
  };

  const payWithdrawal = async () => {
    if (!selectedWithdrawalId) {
      toast.error("Select a withdrawal first.");
      return;
    }
    if (!wdEvidenceFile) {
      toast.error("Upload payment evidence before marking paid.");
      return;
    }
    setWdBusy(true);
    try {
      await adminPayWithdrawal(selectedWithdrawalId, {
        evidence: wdEvidenceFile,
        evidence_note: wdEvidenceNote || undefined,
        external_reference: wdExternalRef || undefined,
        admin_note: wdAdminNote || undefined,
      });
      toast.success("Withdrawal marked paid with evidence.");
      setSelectedWithdrawalId(null);
      setWdEvidenceFile(null);
      setWdEvidenceNote("");
      setWdExternalRef("");
      setWdAdminNote("");
      loadWithdrawals();
    } catch {
      toast.error("Could not pay withdrawal.");
    } finally {
      setWdBusy(false);
    }
  };

  const rejectWithdrawal = async (id: number) => {
    setWdBusy(true);
    try {
      await adminRejectWithdrawal(id, {
        admin_note: wdAdminNote || undefined,
      });
      toast.success("Withdrawal rejected.");
      if (selectedWithdrawalId === id) setSelectedWithdrawalId(null);
      loadWithdrawals();
    } catch {
      toast.error("Could not reject withdrawal.");
    } finally {
      setWdBusy(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Payouts</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Release payments to creators (batches) and publishers (payable commission),
        and pay user withdrawal requests. Evidence is required for every release.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["history", "All transactions"],
            ["users", "By creator"],
            ["batches", "Creator batches"],
            ["publishers", "Publishers"],
            ["withdrawals", "Withdrawals"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              setTxPage(1);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === id ? "bg-purple-600" : "border border-white/20"
            }`}
          >
            {label}
          </button>
        ))}
        {tab !== "batches" && tab !== "publishers" && tab !== "withdrawals" ? (
          <button
            type="button"
            disabled={downloadBusy}
            onClick={downloadReport}
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 disabled:opacity-60"
          >
            {downloadBusy ? "Downloading…" : "Download report (CSV)"}
          </button>
        ) : null}
      </div>

      {tab === "withdrawals" ? (
        <>
          <p className="mt-6 max-w-2xl text-sm text-slate-400">
            User-requested withdrawals from creator, publisher, and network wallets.
            Mark paid with evidence, or reject to free the hold.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <select
              value={wdStatus}
              onChange={(e) => setWdStatus(e.target.value)}
              className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              type="button"
              onClick={loadWithdrawals}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold"
            >
              Refresh
            </button>
            <button
              type="button"
              disabled={wdBusy || !selectedWithdrawalId}
              onClick={() => void payWithdrawal()}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {wdBusy ? "Working…" : "Pay selected"}
            </button>
          </div>

          {selectedWithdrawalId ? (
            <div className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-xs font-semibold text-slate-300">
                Payment evidence (required)
                <input
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  className="mt-1 block w-full text-xs text-slate-200"
                  onChange={(e) => setWdEvidenceFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <label className="text-xs font-semibold text-slate-300">
                Evidence note
                <input
                  value={wdEvidenceNote}
                  onChange={(e) => setWdEvidenceNote(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-semibold text-slate-300">
                External reference
                <input
                  value={wdExternalRef}
                  onChange={(e) => setWdExternalRef(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-semibold text-slate-300">
                Admin note
                <input
                  value={wdAdminNote}
                  onChange={(e) => setWdAdminNote(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
                />
              </label>
            </div>
          ) : null}

          {wdError ? (
            <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {wdError}
            </p>
          ) : null}

          <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Method</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Requested</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-slate-400">
                      No withdrawal requests for this filter.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((row) => (
                    <tr key={row.id} className="border-t border-white/10">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{row.user?.name || "—"}</p>
                        <p className="text-xs text-slate-400">{row.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {row.role.replace("_", " ")}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        ${Number(row.amount_usd).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <p>{row.payout_method}</p>
                        <p className="text-xs text-slate-400">
                          {Object.values(row.payout_details || {})
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </td>
                      <td className="px-4 py-3 capitalize">{row.status}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {row.created_at
                          ? new Date(row.created_at).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.status === "pending" ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              className="text-xs font-semibold text-emerald-300"
                              onClick={() => setSelectedWithdrawalId(row.id)}
                            >
                              Select
                            </button>
                            <button
                              type="button"
                              disabled={wdBusy}
                              className="text-xs font-semibold text-rose-300 disabled:opacity-50"
                              onClick={() => void rejectWithdrawal(row.id)}
                            >
                              Reject
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {tab === "history" ? (
        <div className="mt-6">
          <form
            className="mb-4 flex flex-wrap gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setQuery(search.trim());
              setTxPage(1);
            }}
          >
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="User, job, or status"
              className="rounded-lg border border-white/15 bg-black/20 px-3 py-1.5 text-sm"
            />
            <button type="submit" className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold">
              Search
            </button>
          </form>
          {userId ? (
            <p className="mb-3 text-sm text-amber-200">
              History for {userName || `user #${userId}`}
              <button
                type="button"
                className="ml-3 underline"
                onClick={() => {
                  setUserId(null);
                  setUserName("");
                  setTxPage(1);
                }}
              >
                Show every user
              </button>
            </p>
          ) : null}
          <p className="mb-3 text-sm text-slate-400">{txTotal} transactions</p>
          <TransactionHistory
            rows={tx}
            tone="dark"
            showUser
            onUser={(id, name) => {
              setUserId(id);
              setUserName(name);
              setTab("history");
              setTxPage(1);
            }}
            empty="No transactions yet."
          />
        </div>
      ) : null}

      {tab === "users" ? (
        <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Earned</th>
                <th className="px-4 py-3">On hold</th>
                <th className="px-4 py-3">Ready</th>
                <th className="px-4 py-3">Paid out</th>
                <th className="px-4 py-3">Last</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {userRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-slate-500">
                    No payout activity yet.
                  </td>
                </tr>
              ) : (
                userRows.map((row) => {
                  const user = row.user as TransactionRow["user"];
                  const name = user?.name || user?.email || (user?.handle ? `@${user.handle}` : "Unknown user");
                  return (
                    <tr key={String(row.creator_id)} className="border-t border-white/10">
                      <td className="px-4 py-3">
                        <span className="font-semibold">{name}</span>
                        <span className="block text-xs text-slate-400">
                          {user?.public_code || "—"}
                          {user?.email ? ` · ${user.email}` : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3">${Number(row.credits_usd ?? 0).toFixed(2)}</td>
                      <td className="px-4 py-3">${Number(row.pending_usd ?? 0).toFixed(2)}</td>
                      <td className="px-4 py-3">${Number(row.payable_usd ?? 0).toFixed(2)}</td>
                      <td className="px-4 py-3">${Number(row.paid_out_usd ?? 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {row.last_at ? new Date(String(row.last_at)).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {user?.id ? (
                          <button
                            type="button"
                            className="text-xs font-semibold text-purple-300"
                            onClick={() => {
                              setUserId(user.id as number);
                              setUserName(name);
                              setTab("history");
                              setTxPage(1);
                            }}
                          >
                            View history
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "publishers" ? (
        <>
          <p className="mt-6 max-w-2xl text-sm text-slate-400">
            Pay publishers their payable commission wallet balance. Upload
            bank/UPI evidence for each release.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadPublisherPayouts}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold"
            >
              Refresh payable publishers
            </button>
            <button
              type="button"
              disabled={pubBusy || !selectedPublisherId}
              onClick={() => void releasePublisher()}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {pubBusy ? "Releasing…" : "Release selected publisher"}
            </button>
          </div>

          {selectedPublisherId ? (
            <div className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:grid-cols-3">
              <label className="text-xs font-semibold text-slate-300">
                Payment evidence (required)
                <input
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  className="mt-1 block w-full text-xs text-slate-200"
                  onChange={(e) => setPubEvidenceFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <label className="text-xs font-semibold text-slate-300">
                Evidence note
                <input
                  value={pubEvidenceNote}
                  onChange={(e) => setPubEvidenceNote(e.target.value)}
                  placeholder="Bank UTR / transfer note"
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-semibold text-slate-300">
                External reference
                <input
                  value={pubExternalRef}
                  onChange={(e) => setPubExternalRef(e.target.value)}
                  placeholder="UTR / payout id"
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
                />
              </label>
            </div>
          ) : null}

          <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
            <div className="border-b border-white/10 bg-white/5 px-4 py-3 text-sm">
              <strong>{publisherPreview?.count ?? 0}</strong> publishers · payable
              total{" "}
              <strong>
                ${Number(publisherPreview?.total_usd ?? 0).toFixed(2)}
              </strong>
            </div>
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-2">Publisher</th>
                  <th className="px-4 py-2">Owner</th>
                  <th className="px-4 py-2">Payable</th>
                  <th className="px-4 py-2">Pending</th>
                  <th className="px-4 py-2">Paid</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {(publisherPreview?.publishers ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-slate-500">
                      No publishers with payable balance right now.
                    </td>
                  </tr>
                ) : (
                  (publisherPreview?.publishers ?? []).map((p) => {
                    const selected = selectedPublisherId === p.publisher_id;
                    return (
                      <tr
                        key={p.publisher_id}
                        className={`border-t border-white/5 ${
                          selected ? "bg-purple-500/10" : ""
                        }`}
                      >
                        <td className="px-4 py-2">
                          <span className="font-semibold">{p.display_name}</span>
                          <span className="block text-xs text-slate-400">
                            {p.code} · @{p.username}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-slate-300">
                          {p.owner_name || "—"}
                          {p.owner_email ? (
                            <span className="block text-xs text-slate-500">
                              {p.owner_email}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-2 font-semibold text-emerald-300">
                          ${p.payable_usd.toFixed(2)}
                        </td>
                        <td className="px-4 py-2">${p.pending_usd.toFixed(2)}</td>
                        <td className="px-4 py-2">${p.paid_usd.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            className="text-xs font-semibold text-purple-300"
                            onClick={() =>
                              setSelectedPublisherId(
                                selected ? null : p.publisher_id,
                              )
                            }
                          >
                            {selected ? "Selected" : "Select"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {publisherReleases.length > 0 ? (
            <div className="mt-10">
              <h2 className="text-lg font-semibold">Recent publisher releases</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {publisherReleases.map((r, idx) => (
                  <li
                    key={`${String(r.publisher_id)}-${idx}`}
                    className="flex flex-wrap justify-between gap-2 rounded-lg bg-white/5 px-4 py-2"
                  >
                    <span>
                      {String(r.display_name || r.code || "Publisher")} ·{" "}
                      {String(r.entries)} entries
                      {r.evidence &&
                      (r.evidence as { has_evidence?: boolean }).has_evidence
                        ? " · evidence on file"
                        : ""}
                    </span>
                    <span>
                      ${Number(r.amount_usd ?? 0).toFixed(2)}
                      {r.paid_at
                        ? ` · ${new Date(String(r.paid_at)).toLocaleString()}`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}

      {tab !== "batches" && tab !== "publishers" && txLastPage > 1 ? (
        <div className="mt-4 flex gap-2 text-sm">
          <button type="button" disabled={txPage <= 1} onClick={() => setTxPage((p) => p - 1)} className="rounded border border-white/20 px-3 py-1 disabled:opacity-40">
            Prev
          </button>
          <span className="text-slate-400">Page {txPage} / {txLastPage}</span>
          <button type="button" disabled={txPage >= txLastPage} onClick={() => setTxPage((p) => p + 1)} className="rounded border border-white/20 px-3 py-1 disabled:opacity-40">
            Next
          </button>
        </div>
      ) : null}

      {tab === "batches" ? (
      <>
      <p className="mt-6 max-w-2xl text-sm text-slate-400">
        Creator payouts: manual batches cover Nano/Micro creators or missing
        payout methods. Auto-eligible batches target Mid/Macro with a payout
        account on file. Use the Publishers tab to pay publishers.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as "manual" | "auto")}
          className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="manual">Manual review</option>
          <option value="auto">Auto-eligible</option>
        </select>
        <button
          type="button"
          onClick={runPreview}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={createBatch}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm"
        >
          Create batch
        </button>
        {batch?.id ? (
          <button
            type="button"
            disabled={completeBusy}
            onClick={complete}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {completeBusy ? "Releasing…" : "Mark completed"}
          </button>
        ) : null}
      </div>

      {batch?.id ? (
        <div className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:grid-cols-3">
          <label className="text-xs font-semibold text-slate-300">
            Payment evidence (required)
            <input
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              className="mt-1 block w-full text-xs text-slate-200"
              onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="text-xs font-semibold text-slate-300">
            Evidence note
            <input
              value={evidenceNote}
              onChange={(e) => setEvidenceNote(e.target.value)}
              placeholder="Bank UTR / transfer note"
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-slate-300">
            External reference
            <input
              value={externalRef}
              onChange={(e) => setExternalRef(e.target.value)}
              placeholder="UTR / payout id"
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
            />
          </label>
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-red-400">{error}</p>
      ) : null}

      {preview ? (
        <div className="mt-8 overflow-hidden rounded-xl border border-white/10">
          <div className="border-b border-white/10 bg-white/5 px-4 py-3 text-sm">
            <strong>{preview.creators?.length ?? 0}</strong> creators · total{" "}
            <strong>${Number(preview.total_usd ?? 0).toFixed(2)}</strong> · min $
            {Number(preview.min_payout_usd ?? 10).toFixed(2)}
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-2">Handle</th>
                <th className="px-4 py-2">Tier</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Auto</th>
              </tr>
            </thead>
            <tbody>
              {(preview.creators ?? []).map((c) => (
                <tr key={c.creator_id} className="border-t border-white/5">
                  <td className="px-4 py-2">@{c.handle}</td>
                  <td className="px-4 py-2 uppercase">{c.trust_tier}</td>
                  <td className="px-4 py-2 font-semibold">
                    ${c.amount_usd.toFixed(2)}
                  </td>
                  <td className="px-4 py-2">
                    {c.auto_payout_eligible ? "Yes" : "Manual"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      ) : null}

      {batch ? (
        <p className="mt-4 rounded-xl bg-black/40 p-4 text-xs">
          Active batch #{String(batch.id)} · status {String(batch.status)} · $
          {Number(batch.total_usd ?? 0).toFixed(2)}
        </p>
      ) : null}

      {history.length > 0 ? (
        <div className="mt-10">
          <h2 className="text-lg font-semibold">Recent batches</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {history.map((b) => {
              const evidence = b.evidence as
                | { has_evidence?: boolean; evidence_original_name?: string }
                | undefined;
              return (
              <li
                key={String(b.id)}
                className="flex flex-wrap justify-between gap-2 rounded-lg bg-white/5 px-4 py-2"
              >
                <span>
                  #{String(b.id)} · {String(b.source)} · {String(b.status)}
                  {evidence?.has_evidence
                    ? ` · evidence: ${evidence.evidence_original_name || "yes"}`
                    : ""}
                </span>
                <span>
                  ${Number(b.total_usd ?? 0).toFixed(2)} · {String(b.lines_count)}{" "}
                  lines
                </span>
              </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      </>
      ) : null}
    </>
  );
}
