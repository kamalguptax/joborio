"use client";

import { useEffect, useState } from "react";
import { TransactionHistory, type TransactionRow } from "@/components/payouts/TransactionHistory";
import {
  adminCompletePayoutBatch,
  adminCreatePayoutBatch,
  adminListPayoutBatches,
  adminPayoutPreview,
  adminPayoutTransactions,
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
  const [tab, setTab] = useState<"history" | "users" | "batches">("history");
  const [tx, setTx] = useState<TransactionRow[]>([]);
  const [userRows, setUserRows] = useState<Array<Record<string, unknown>>>([]);
  const [txPage, setTxPage] = useState(1);
  const [txLastPage, setTxLastPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const loadHistory = () => {
    adminListPayoutBatches()
      .then(setHistory)
      .catch(() => setError("Could not load batch history."));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (tab === "batches") return;
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

  const runPreview = async () => {
    setError(null);
    setPreview(
      (await adminPayoutPreview(mode === "auto" ? "auto" : "manual")) as typeof preview,
    );
  };

  const createBatch = async () => {
    setError(null);
    const created = await adminCreatePayoutBatch(mode);
    setBatch(created);
    loadHistory();
  };

  const complete = async () => {
    const id = batch?.id as number | undefined;
    if (!id) return;
    setBatch(await adminCompletePayoutBatch(id));
    loadHistory();
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Payouts</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Transaction history for every user. A credit is an earning. A debit is a payout sent.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["history", "All transactions"],
            ["users", "By user"],
            ["batches", "Batches"],
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
      </div>

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

      {tab !== "batches" && txLastPage > 1 ? (
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
        Manual batches cover Nano/Micro creators or missing payout methods.
        Auto-eligible batches target Mid/Macro with a payout account on file.
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
            onClick={complete}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold"
          >
            Mark completed
          </button>
        ) : null}
      </div>

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
          <table className="w-full text-left text-sm">
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
          </table>
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
            {history.map((b) => (
              <li
                key={String(b.id)}
                className="flex flex-wrap justify-between gap-2 rounded-lg bg-white/5 px-4 py-2"
              >
                <span>
                  #{String(b.id)} · {String(b.source)} · {String(b.status)}
                </span>
                <span>
                  ${Number(b.total_usd ?? 0).toFixed(2)} · {String(b.lines_count)}{" "}
                  lines
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      </>
      ) : null}
    </>
  );
}
