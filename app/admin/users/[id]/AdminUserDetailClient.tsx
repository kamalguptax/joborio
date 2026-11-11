"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TransactionHistory, type TransactionRow } from "@/components/payouts/TransactionHistory";
import { adminActivity, adminGetUser, adminPayoutTransactions, adminUpdateUser } from "@/lib/api/admin";
import { useResolvedParam } from "@/lib/hooks/useResolvedParam";
import { formatMoney } from "@/lib/money";

function formatClickTime(value?: string): string {
  if (!value) return "time unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-zinc-50">{value}</p>
    </div>
  );
}

type Tab = "activity" | "earnings" | "payouts" | "profile";

export default function AdminUserDetailClient() {
  const idParam = useResolvedParam("id", /^\/admin\/users\/([^/]+)/);
  const id = Number(idParam);
  const [payload, setPayload] = useState<Awaited<ReturnType<typeof adminGetUser>> | null>(null);
  const [tab, setTab] = useState<Tab>("activity");
  const [activityType, setActivityType] = useState<"clicks" | "signups">("clicks");
  const [clicks, setClicks] = useState<Array<Record<string, unknown>>>([]);
  const [clickPage, setClickPage] = useState(1);
  const [clickLastPage, setClickLastPage] = useState(1);
  const [clickTotal, setClickTotal] = useState(0);
  const [tx, setTx] = useState<TransactionRow[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txLastPage, setTxLastPage] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => {
    if (!Number.isFinite(id)) return;
    adminGetUser(id)
      .then(setPayload)
      .catch(() => setMsg("User not found"));
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t === "activity" || t === "earnings" || t === "payouts" || t === "profile") {
      setTab(t);
    }
  }, [id]);

  useEffect(() => {
    if (!Number.isFinite(id) || tab !== "activity") return;
    adminActivity({ type: activityType, user_id: id, page: clickPage })
      .then(({ data, meta }) => {
        setClicks(data);
        setClickLastPage(Number(meta.last_page ?? 1));
        setClickTotal(Number(meta.total ?? 0));
      })
      .catch(() => setClicks([]));
  }, [id, clickPage, activityType, tab]);

  useEffect(() => {
    if (!Number.isFinite(id) || tab !== "payouts") return;
    adminPayoutTransactions({ user_id: id, page: txPage })
      .then(({ data, meta }) => {
        setTx(data as TransactionRow[]);
        setTxLastPage(Number(meta.last_page ?? 1));
      })
      .catch(() => setTx([]));
  }, [id, txPage, tab]);

  const setTabAndUrl = (next: Tab) => {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState({}, "", `${url.pathname}?${url.searchParams.toString()}`);
  };

  const toggleActive = async () => {
    if (!payload?.user) return;
    setMsg(null);
    try {
      await adminUpdateUser(id, { is_active: !payload.user.is_active });
      load();
      setMsg("User updated");
    } catch {
      setMsg("Update failed");
    }
  };

  if (!payload && !msg) {
    return <p className="text-sm text-slate-400">Loading…</p>;
  }

  if (!payload) {
    return <p className="text-sm text-rose-300">{msg}</p>;
  }

  const u = payload.user;
  const activity = payload.activity_summary;
  const earnings = payload.earnings_summary;
  const byType = payload.earnings_by_type ?? {};
  const byCampaign = payload.earnings_by_campaign ?? [];
  const recentEarnings = payload.recent_earnings ?? [];
  const creator = u.creator as
    | {
        handle?: string;
        approval_status?: string;
        social_links?: Record<string, string>;
        niches?: Array<{ id: number; name: string }>;
      }
    | null
    | undefined;
  const employer = u.employer as { company_name?: string } | null | undefined;

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "activity", label: "Activity" },
    { id: "earnings", label: "Earnings" },
    { id: "payouts", label: "Payouts" },
    { id: "profile", label: "Profile" },
  ];

  return (
    <>
      <Link href="/admin/users" className="text-sm text-purple-300">
        ← Users
      </Link>
      <h1 className="mt-4 text-2xl font-bold">{u.name}</h1>
      <p className="text-slate-400">{u.email}</p>
      {u.public_code ? (
        <p className="mt-1 text-sm text-amber-200">Link id {String(u.public_code)}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-white/10 px-3 py-1">
          Roles:{" "}
          {(u.roles as Array<{ name: string }> | undefined)?.map((r) => r.name).join(", ") ||
            "none"}
        </span>
        <span className="rounded-full bg-white/10 px-3 py-1">
          {u.is_active ? "Active" : "Disabled"}
        </span>
        {creator ? (
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-200">
            @{creator.handle ?? "creator"} · {creator.approval_status ?? "pending"}
          </span>
        ) : null}
        {employer ? (
          <span className="rounded-full bg-sky-500/15 px-3 py-1 text-sky-200">
            Employer · {employer.company_name ?? "company"}
          </span>
        ) : null}
        <button
          type="button"
          onClick={toggleActive}
          className="rounded-lg border border-white/20 px-3 py-1"
        >
          {u.is_active ? "Disable account" : "Enable account"}
        </button>
      </div>
      {msg ? <p className="mt-2 text-sm text-amber-300">{msg}</p> : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Clicks" value={activity?.clicks_total ?? 0} />
        <StatCard label="Counted clicks" value={activity?.clicks_counted ?? 0} />
        <StatCard label="Signups / PPR" value={(activity?.signups_total ?? 0) + (activity?.ppr_total ?? 0)} />
        <StatCard
          label="Net earnings"
          value={earnings ? formatMoney(earnings.net_usd) : "—"}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTabAndUrl(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              tab === t.id
                ? "bg-amber-500 text-zinc-950"
                : "border border-white/15 bg-white/5 text-slate-300 hover:border-amber-400/40"
            }`}
          >
            {t.label}
          </button>
        ))}
        <Link
          href={`/admin/activity?user_id=${id}`}
          className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-slate-400 hover:text-amber-300"
        >
          Open activity page →
        </Link>
      </div>

      {tab === "activity" ? (
        <section className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold">User activity</h2>
            <div className="ml-auto flex gap-2">
              {(["clicks", "signups"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setActivityType(type);
                    setClickPage(1);
                  }}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                    activityType === type
                      ? "bg-emerald-500 text-zinc-950"
                      : "border border-white/20 text-slate-300"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {clickTotal} {activityType} · every tracked event for this user
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {clicks.length === 0 ? (
              <li className="text-slate-500">No {activityType} yet.</li>
            ) : (
              clicks.map((ev) => {
                const meta = ev.meta as
                  | { title?: string; clicked_at?: string; earning_net_usd?: number }
                  | undefined;
                const when = meta?.clicked_at || String(ev.created_at ?? "");
                return (
                  <li key={String(ev.id)} className="rounded-lg border border-white/10 px-3 py-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="font-medium">
                        {String(
                          (ev.listing as { title?: string })?.title ||
                            meta?.title ||
                            "Job / event",
                        )}
                      </span>
                      {meta?.earning_net_usd != null ? (
                        <span className="text-xs font-semibold text-emerald-300">
                          {formatMoney(Number(meta.earning_net_usd))}
                        </span>
                      ) : null}
                    </div>
                    <span className="block text-xs text-slate-400">
                      {formatClickTime(when)} · IP {String(ev.ip_address ?? "unknown")} ·{" "}
                      {String(ev.event_type)} ·{" "}
                      {ev.is_counted ? "counted" : String(ev.fraud_status ?? "not counted")}
                    </span>
                  </li>
                );
              })
            )}
          </ul>
          {clickLastPage > 1 ? (
            <div className="mt-3 flex gap-2 text-sm">
              <button
                type="button"
                disabled={clickPage <= 1}
                onClick={() => setClickPage((p) => p - 1)}
                className="rounded border border-white/20 px-3 py-1 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-slate-400">
                Page {clickPage} / {clickLastPage}
              </span>
              <button
                type="button"
                disabled={clickPage >= clickLastPage}
                onClick={() => setClickPage((p) => p + 1)}
                className="rounded border border-white/20 px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}

          <div className="mt-8">
            <h3 className="font-bold">PPR registrations</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {payload.ppr_registrations.length === 0 ? (
                <li className="text-slate-500">None</li>
              ) : (
                payload.ppr_registrations.map((r) => (
                  <li key={String(r.id)} className="rounded-lg border border-white/10 px-3 py-2">
                    {String(r.email)} · {String(r.status)}
                    <span className="block text-xs text-slate-400">{String(r.created_at)}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      ) : null}

      {tab === "earnings" ? (
        <section className="mt-6 space-y-6">
          {!creator ? (
            <p className="text-sm text-slate-500">
              This account has no creator profile, so there are no creator earnings.
            </p>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-bold">Earnings overview</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Pending" value={formatMoney(earnings?.pending_usd ?? 0)} />
                  <StatCard label="Approved" value={formatMoney(earnings?.approved_usd ?? 0)} />
                  <StatCard label="Payable" value={formatMoney(earnings?.payable_usd ?? 0)} />
                  <StatCard label="Paid" value={formatMoney(earnings?.paid_usd ?? 0)} />
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <StatCard label="Gross" value={formatMoney(earnings?.gross_usd ?? 0)} />
                  <StatCard label="Net" value={formatMoney(earnings?.net_usd ?? 0)} />
                  <StatCard label="Ledger rows" value={earnings?.ledger_count ?? 0} />
                </div>
              </div>

              <div>
                <h3 className="font-bold">By earning type</h3>
                <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="bg-white/5 text-[11px] uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2 text-right">Count</th>
                        <th className="px-3 py-2 text-right">Pending</th>
                        <th className="px-3 py-2 text-right">Paid</th>
                        <th className="px-3 py-2 text-right">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(byType).map(([type, row]) => (
                        <tr key={type} className="border-t border-white/5">
                          <td className="px-3 py-2 uppercase">{type}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{row.count}</td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {formatMoney(row.pending_usd)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {formatMoney(row.paid_usd)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums font-semibold">
                            {formatMoney(row.net_usd)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="font-bold">By campaign</h3>
                <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="bg-white/5 text-[11px] uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Campaign</th>
                        <th className="px-3 py-2">Model</th>
                        <th className="px-3 py-2 text-right">Events</th>
                        <th className="px-3 py-2 text-right">Net</th>
                        <th className="px-3 py-2 text-right">Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byCampaign.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                            No campaign earnings yet.
                          </td>
                        </tr>
                      ) : (
                        byCampaign.map((row) => (
                          <tr key={String(row.id ?? row.title)} className="border-t border-white/5">
                            <td className="px-3 py-2">{String(row.title)}</td>
                            <td className="px-3 py-2 uppercase text-slate-400">
                              {String(row.pricing_model ?? "—")}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {Number(row.earning_count ?? 0)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums font-semibold">
                              {formatMoney(Number(row.net_usd ?? 0))}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {formatMoney(Number(row.paid_usd ?? 0))}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="font-bold">Recent ledger</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {recentEarnings.length === 0 ? (
                    <li className="text-slate-500">No earnings yet.</li>
                  ) : (
                    recentEarnings.map((row) => (
                      <li
                        key={String(row.id)}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2"
                      >
                        <span>
                          <span className="uppercase text-amber-200">{String(row.earning_type)}</span>
                          {" · "}
                          <span className="text-slate-400">{String(row.state)}</span>
                        </span>
                        <span className="font-semibold text-emerald-300">
                          {formatMoney(Number(row.net_usd ?? 0))}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </>
          )}
        </section>
      ) : null}

      {tab === "payouts" ? (
        <section className="mt-6">
          <h2 className="text-lg font-bold">Payout history</h2>
          <p className="mt-1 mb-3 text-sm text-slate-400">
            Credits are earnings. Debits are payouts sent to this user.
          </p>
          <TransactionHistory rows={tx} tone="dark" empty="No payout activity yet." />
          {txLastPage > 1 ? (
            <div className="mt-3 flex gap-2 text-sm">
              <button
                type="button"
                disabled={txPage <= 1}
                onClick={() => setTxPage((p) => p - 1)}
                className="rounded border border-white/20 px-3 py-1 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-slate-400">
                Page {txPage} / {txLastPage}
              </span>
              <button
                type="button"
                disabled={txPage >= txLastPage}
                onClick={() => setTxPage((p) => p + 1)}
                className="rounded border border-white/20 px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "profile" ? (
        <section className="mt-6 space-y-6">
          {creator ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-bold">Creator profile</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setMsg(null);
                      try {
                        await adminUpdateUser(id, { creator_approval_status: "approved" });
                        load();
                        setMsg("Creator approved");
                      } catch {
                        setMsg("Approve failed");
                      }
                    }}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold"
                  >
                    Approve creator
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setMsg(null);
                      try {
                        await adminUpdateUser(id, { creator_approval_status: "rejected" });
                        load();
                        setMsg("Creator rejected");
                      } catch {
                        setMsg("Reject failed");
                      }
                    }}
                    className="rounded-lg border border-red-400/40 px-3 py-1.5 text-sm text-red-300"
                  >
                    Reject
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Handle <strong>@{creator.handle ?? "—"}</strong> · Approval{" "}
                <strong className="text-amber-200">{creator.approval_status ?? "pending"}</strong>
              </p>
              {creator.niches?.length ? (
                <p className="mt-2 text-sm text-slate-400">
                  Niches: {creator.niches.map((n) => n.name).join(", ")}
                </p>
              ) : null}
              {creator.social_links ? (
                <ul className="mt-3 space-y-1 text-sm text-slate-300">
                  {Object.entries(creator.social_links).map(([key, value]) => (
                    <li key={key}>
                      <span className="uppercase text-slate-500">{key}: </span>
                      <a
                        href={value}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-300 hover:underline"
                      >
                        {value}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No creator profile on this account.</p>
          )}

          {employer ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h2 className="font-bold">Employer profile</h2>
              <p className="mt-2 text-sm text-slate-300">
                Company: <strong>{employer.company_name ?? "—"}</strong>
              </p>
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
