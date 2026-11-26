"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ApiClientError } from "@/lib/api/client";
import {
  fetchPublisherCommission,
  fetchPublisherEarnings,
  updatePublisherCommission,
  type PublisherEarnings,
  type PublisherEarningsEntry,
} from "@/lib/api/publisher";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";
import BackButton from "@/components/ui/BackButton";

function money(n: number | string | null | undefined) {
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

type DetailView =
  | { kind: "model"; model: string }
  | { kind: "balance"; key: string; label: string }
  | { kind: "assignment"; assignmentId: number }
  | { kind: "entry"; entry: PublisherEarningsEntry }
  | null;

const modelMeta: Record<
  string,
  { title: string; hint: string; tone: string; activeTone: string }
> = {
  ppc: {
    title: "PPC",
    hint: "Pay Per Click",
    tone: "border-sky-200 bg-sky-50/70",
    activeTone: "border-sky-400 ring-2 ring-sky-200",
  },
  ppr: {
    title: "PPR",
    hint: "Pay Per Registration",
    tone: "border-blue-200 bg-blue-50/70",
    activeTone: "border-blue-400 ring-2 ring-blue-200",
  },
  ppa: {
    title: "PPA",
    hint: "Pay Per Action",
    tone: "border-amber-200 bg-amber-50/70",
    activeTone: "border-amber-400 ring-2 ring-amber-200",
  },
  ppe: {
    title: "PPE",
    hint: "Pay Per Engagement",
    tone: "border-rose-200 bg-rose-50/70",
    activeTone: "border-rose-400 ring-2 ring-rose-200",
  },
  other: {
    title: "Other",
    hint: "Other models",
    tone: "border-slate-200 bg-slate-50",
    activeTone: "border-slate-400 ring-2 ring-slate-200",
  },
};

function EntryList({
  rows,
  onSelect,
}: {
  rows: PublisherEarningsEntry[];
  onSelect?: (e: PublisherEarningsEntry) => void;
}) {
  if (rows.length === 0) {
    return <p className="mt-3 text-sm text-slate-500">No ledger rows in this view.</p>;
  }
  return (
    <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto text-sm">
      {rows.map((e) => (
        <li key={e.id}>
          <button
            type="button"
            onClick={() => onSelect?.(e)}
            className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-left transition hover:border-violet-300 hover:bg-violet-50/50"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold capitalize text-[#172b63]">
                  {e.entry_type} · {e.state}
                </p>
                <p className="text-xs text-slate-500">
                  {[e.program_title, e.pricing_model?.toUpperCase(), e.community_name, e.reference]
                    .filter(Boolean)
                    .join(" · ") || e.source}
                </p>
                <p className="text-[11px] text-slate-400">{when(e.occurred_at || e.created_at)}</p>
              </div>
              <p className="font-bold text-[#172b63]">{money(e.net_usd)}</p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function PublisherEarningsClient() {
  const search = useSearchParams();
  const [data, setData] = useState<PublisherEarnings | null>(null);
  const [permitted, setPermitted] = useState<number[]>([10, 11, 12, 13, 14, 15]);
  const [selectedPct, setSelectedPct] = useState<number>(12);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [detailStack, setDetailStack] = useState<NonNullable<DetailView>[]>([]);
  const detail = detailStack[detailStack.length - 1] ?? null;

  const from = (search.get("from") || "").trim();
  const backHref =
    from === "reports"
      ? "/publisher/network?tab=reports"
      : from === "payments"
        ? "/publisher/payments"
        : "/publisher/dashboard";
  const backLabel =
    from === "reports"
      ? "Back to reports"
      : from === "payments"
        ? "Back to payments"
        : "Back to dashboard";

  const pushDetail = (next: NonNullable<DetailView>) => {
    setDetailStack((prev) => {
      const top = prev[prev.length - 1];
      if (
        top &&
        top.kind === next.kind &&
        JSON.stringify(top) === JSON.stringify(next)
      ) {
        return prev.slice(0, -1);
      }
      return [...prev, next];
    });
  };

  const popDetail = () => {
    setDetailStack((prev) => prev.slice(0, -1));
  };

  const clearDetail = () => setDetailStack([]);

  const load = () => {
    Promise.all([fetchPublisherEarnings(), fetchPublisherCommission()])
      .then(([earnings, commissionCfg]) => {
        setData(earnings);
        const allowed =
          commissionCfg.permitted_percentages?.length
            ? commissionCfg.permitted_percentages
            : earnings.permitted_percentages ?? [10, 11, 12, 13, 14, 15];
        setPermitted(allowed);
        const current = commissionCfg.commission
          ? Number(commissionCfg.commission.commission_percent)
          : allowed.includes(12)
            ? 12
            : allowed[0] ?? 12;
        setSelectedPct(current);
      })
      .catch((err) =>
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load publisher earnings.",
        ),
      );
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!data) return;
    const assignmentId = Number(search.get("assignment") || 0);
    if (!Number.isFinite(assignmentId) || assignmentId <= 0) return;
    const exists = (data.by_assignment ?? []).some(
      (a) => a.assignment_id === assignmentId,
    );
    if (!exists) return;
    setDetailStack([{ kind: "assignment", assignmentId }]);
  }, [data, search]);

  async function onSaveCommission() {
    setBusy(true);
    try {
      const res = await updatePublisherCommission({
        commission_percent: selectedPct,
      });
      toast.success(res.message);
      load();
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Could not update commission.",
      );
    } finally {
      setBusy(false);
    }
  }

  const byAssignment = data?.by_assignment ?? [];
  const recentEntries = data?.recent_entries ?? [];

  const byModel = useMemo(() => {
    if (!data) return [];
    return (
      data.by_model ??
      (["ppc", "ppr", "ppa", "ppe", "other"] as const).map((model) => {
        const rows = byAssignment.filter(
          (a) => String(a.pricing_model ?? "other").toLowerCase() === model,
        );
        return {
          pricing_model: model,
          label: model.toUpperCase(),
          credited_net_usd: rows.reduce(
            (s, r) => s + Number(r.credited_net_usd || 0),
            0,
          ),
          pending_usd: rows.reduce((s, r) => s + Number(r.pending_usd || 0), 0),
          assignment_count: rows.length,
        };
      })
    );
  }, [data, byAssignment]);

  const detailPanel = useMemo(() => {
    if (!data || !detail) return null;

    if (detail.kind === "model") {
      const campaigns = byAssignment.filter(
        (a) =>
          String(a.pricing_model ?? "other").toLowerCase() === detail.model,
      );
      const entries = recentEntries.filter(
        (e) => String(e.pricing_model ?? "").toLowerCase() === detail.model,
      );
      const meta = modelMeta[detail.model] ?? modelMeta.other;
      const credited = campaigns.reduce(
        (s, r) => s + Number(r.credited_net_usd || 0),
        0,
      );
      const pending = campaigns.reduce(
        (s, r) => s + Number(r.pending_usd || 0),
        0,
      );
      return {
        title: `${meta.title} earnings detail`,
        subtitle: `${meta.hint} · ${campaigns.length} campaign${campaigns.length === 1 ? "" : "s"} · credited ${money(credited)} · pending ${money(pending)}`,
        campaigns,
        entries,
      };
    }

    if (detail.kind === "balance") {
      const stateMap: Record<string, string[]> = {
        pending_usd: ["pending"],
        approved_usd: ["approved"],
        payable_usd: ["payable"],
        paid_usd: ["paid"],
        reversed_usd: ["reversed"],
        lifetime_net_usd: ["pending", "approved", "payable", "paid"],
      };
      const states = stateMap[detail.key] ?? [];
      const entries = recentEntries.filter((e) =>
        states.includes(String(e.state).toLowerCase()),
      );
      const byModelBreak = ["ppc", "ppr", "ppa", "ppe", "other"].map((model) => {
        const rows = entries.filter(
          (e) => String(e.pricing_model ?? "other").toLowerCase() === model,
        );
        return {
          model,
          total: rows.reduce((s, r) => s + Number(r.net_usd || 0), 0),
          count: rows.length,
        };
      }).filter((r) => r.count > 0 || r.total !== 0);
      return {
        title: `${detail.label} detail`,
        subtitle: `Ledger rows in ${detail.label.toLowerCase()} · ${entries.length} entries`,
        campaigns: [] as typeof byAssignment,
        entries,
        byModelBreak,
      };
    }

    if (detail.kind === "assignment") {
      const a = byAssignment.find((x) => x.assignment_id === detail.assignmentId);
      if (!a) return null;
      const entries =
        a.entries && a.entries.length > 0
          ? a.entries
          : recentEntries.filter(
              (e) => e.campaign_assignment_id === a.assignment_id,
            );
      return {
        title: a.program_title ?? "Campaign",
        subtitle: `${a.community_name ?? "All members"}${a.pricing_model ? ` · ${String(a.pricing_model).toUpperCase()}` : ""} · credited ${money(a.credited_net_usd)} · pending ${money(a.pending_usd)}`,
        campaigns: [a],
        entries,
      };
    }

    if (detail.kind === "entry") {
      const e = detail.entry;
      return {
        title: `${e.entry_type} · ${e.state}`,
        subtitle: [e.program_title, e.pricing_model?.toUpperCase(), e.community_name, e.reference]
          .filter(Boolean)
          .join(" · "),
        campaigns: [] as typeof byAssignment,
        entries: [e],
        singleEntry: e,
      };
    }

    return null;
  }, [data, detail, byAssignment, recentEntries]);

  if (error && !data) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {error}
      </p>
    );
  }

  if (!data) {
    return <PageSkeleton />;
  }

  const { balances, commission } = data;

  const cards: Array<[string, number, string]> = [
    ["Lifetime net", balances.lifetime_net_usd, "lifetime_net_usd"],
    ["Pending", balances.pending_usd, "pending_usd"],
    ["Approved", balances.approved_usd, "approved_usd"],
    ["Payable", balances.payable_usd, "payable_usd"],
    ["Paid", balances.paid_usd, "paid_usd"],
    ["Reversed", balances.reversed_usd, "reversed_usd"],
  ];

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <BackButton href={backHref} label={backLabel} />
          <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-violet-600">
            Earning
          </p>
          <h1 className="mt-1 text-3xl font-bold">Commission & payouts</h1>
          <p className="mt-2 max-w-2xl text-slate-500">{data.note}</p>
          <p className="mt-1 text-sm text-slate-500">
            Click any amount, model, or campaign to see which PPC / PPR / PPA /
            PPE campaigns contributed. Use Back to return one step.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/publisher/network?tab=reports"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            View reports
          </Link>
          <Link
            href="/publisher/payments?from=earnings"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Payout status
          </Link>
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mb-6 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
          Publisher commission (of creator pool)
        </p>
        {commission ? (
          <p className="mt-1 text-xl font-bold text-violet-950">
            {Number(commission.commission_percent).toFixed(0)}% of pool · v
            {commission.version}
          </p>
        ) : (
          <p className="mt-1 text-sm font-semibold text-violet-950">
            No active rate yet — choose 10–15% below.
          </p>
        )}
        <p className="mt-1 text-sm text-violet-800">
          JobOrio keeps {(data.platform_fee_percent ?? 30).toFixed(0)}% platform
          fee. Your rate is 10–15% of the remaining pool; creators get the rest.
        </p>
        {data.example_split ? (
          <p className="mt-2 rounded-xl bg-white/70 px-3 py-2 text-xs text-violet-900">
            Example on ${Number(data.example_split.campaign_earnings_usd).toFixed(0)}:{" "}
            JobOrio {money(data.example_split.platform_fee_usd)} · you{" "}
            {money(data.example_split.publisher_usd)} · creators{" "}
            {money(data.example_split.creators_usd)}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {permitted.map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => setSelectedPct(pct)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                selectedPct === pct
                  ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white"
                  : "border border-violet-200 bg-white text-violet-800"
              }`}
            >
              {pct}%
            </button>
          ))}
          <button
            type="button"
            disabled={busy}
            onClick={() => void onSaveCommission()}
            className="rounded-full bg-[#172b63] px-4 py-1.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save commission"}
          </button>
        </div>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value, key]) => {
          const active =
            detail?.kind === "balance" && detail.key === key;
          const isLifetimeNet = key === "lifetime_net_usd";
          return (
            <button
              key={label}
              type="button"
              onClick={() =>
                pushDetail({ kind: "balance", key, label })
              }
              className={`rounded-2xl border bg-white px-4 py-4 text-left shadow-sm transition hover:border-violet-300 ${
                active ? "border-violet-400 ring-2 ring-violet-200" : "border-slate-200"
              }`}
            >
              <p className="text-2xl font-bold text-[#172b63]">{money(value)}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {label}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-[11px] font-semibold text-violet-700">
                  View breakdown →
                </span>
                {isLifetimeNet ? (
                  <Link
                    href="/publisher/wallet"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[11px] font-semibold text-emerald-700 hover:underline"
                  >
                    Withdraw →
                  </Link>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold text-[#172b63]">Earning by model</h2>
        <p className="mt-1 text-sm text-slate-500">
          Click PPC / PPR / PPA / PPE to see which campaigns made that earning.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {byModel
            .filter(
              (m) =>
                m.pricing_model !== "other" ||
                m.credited_net_usd > 0 ||
                m.pending_usd > 0,
            )
            .map((m) => {
              const meta = modelMeta[m.pricing_model] ?? modelMeta.other;
              const active =
                detail?.kind === "model" && detail.model === m.pricing_model;
              return (
                <button
                  key={m.pricing_model}
                  type="button"
                  onClick={() =>
                    pushDetail({ kind: "model", model: m.pricing_model })
                  }
                  className={`rounded-2xl border px-4 py-4 text-left shadow-sm transition ${meta.tone} ${
                    active ? meta.activeTone : ""
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {meta.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{meta.hint}</p>
                  <p className="mt-3 text-2xl font-bold text-[#172b63]">
                    {money(m.credited_net_usd)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-600">
                    Credited / payable
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
                    <span>
                      Pending{" "}
                      <strong className="text-[#172b63]">
                        {money(m.pending_usd)}
                      </strong>
                    </span>
                    <span>
                      Campaigns{" "}
                      <strong className="text-[#172b63]">
                        {m.assignment_count}
                      </strong>
                    </span>
                  </div>
                  <p className="mt-3 text-[11px] font-semibold text-violet-700">
                    Campaign breakdown →
                  </p>
                </button>
              );
            })}
        </div>
      </div>

      {detailPanel ? (
        <div className="mb-8 rounded-3xl border border-violet-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
                Earning detail
              </p>
              <h2 className="mt-1 text-xl font-bold text-[#172b63]">
                {detailPanel.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{detailPanel.subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <BackButton
                label={detailStack.length > 1 ? "Back" : "Back to overview"}
                onClick={popDetail}
              />
              {detailStack.length > 1 ? (
                <button
                  type="button"
                  onClick={clearDetail}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
                >
                  Close all
                </button>
              ) : null}
            </div>
          </div>

          {"byModelBreak" in detailPanel && detailPanel.byModelBreak ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {detailPanel.byModelBreak.map((row) => (
                <button
                  key={row.model}
                  type="button"
                  onClick={() => pushDetail({ kind: "model", model: row.model })}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-left hover:border-violet-300"
                >
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    {row.model}
                  </p>
                  <p className="mt-1 text-lg font-bold text-[#172b63]">
                    {money(row.total)}
                  </p>
                  <p className="text-xs text-slate-500">{row.count} entries</p>
                </button>
              ))}
            </div>
          ) : null}

          {"singleEntry" in detailPanel && detailPanel.singleEntry ? (
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              {[
                ["Gross", money(detailPanel.singleEntry.gross_usd)],
                ["Platform fee", money(detailPanel.singleEntry.platform_fee_usd)],
                ["Net", money(detailPanel.singleEntry.net_usd)],
                ["State", detailPanel.singleEntry.state],
                ["Source", detailPanel.singleEntry.source],
                ["Campaign", detailPanel.singleEntry.program_title || "—"],
                ["Model", detailPanel.singleEntry.pricing_model?.toUpperCase() || "—"],
                ["Community", detailPanel.singleEntry.community_name || "—"],
                ["Reference", detailPanel.singleEntry.reference || "—"],
                ["When", when(detailPanel.singleEntry.occurred_at || detailPanel.singleEntry.created_at)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <dt className="text-[10px] font-bold uppercase text-slate-400">{k}</dt>
                  <dd className="mt-0.5 font-semibold text-[#172b63]">{v}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {detailPanel.campaigns.length > 0 ? (
            <div className="mt-5">
              <h3 className="text-sm font-bold text-[#172b63]">
                Campaigns in this earning
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {detailPanel.campaigns.map((a) => (
                  <li key={a.assignment_id}>
                    <button
                      type="button"
                      onClick={() =>
                        pushDetail({
                          kind: "assignment",
                          assignmentId: a.assignment_id,
                        })
                      }
                      className="flex w-full items-start justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-left hover:border-violet-300"
                    >
                      <div>
                        <p className="font-semibold text-[#172b63]">
                          {a.program_title ?? "Campaign"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {a.community_name}
                          {a.pricing_model
                            ? ` · ${String(a.pricing_model).toUpperCase()}`
                            : ""}
                          {a.accepted_rate_usd != null
                            ? ` · locked $${Number(a.accepted_rate_usd).toFixed(2)}`
                            : ""}
                          {` · ${a.status}`}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Pending {money(a.pending_usd)}
                          {typeof a.payable_usd === "number"
                            ? ` · Payable ${money(a.payable_usd)}`
                            : ""}
                          {typeof a.paid_usd === "number"
                            ? ` · Paid ${money(a.paid_usd)}`
                            : ""}
                        </p>
                      </div>
                      <p className="font-bold text-emerald-700">
                        {money(a.credited_net_usd)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-5">
            <h3 className="text-sm font-bold text-[#172b63]">Ledger entries</h3>
            <EntryList
              rows={detailPanel.entries}
              onSelect={(e) => pushDetail({ kind: "entry", entry: e })}
            />
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">By campaign assignment</h2>
          <p className="mt-1 text-sm text-slate-500">
            Click a campaign to see its earning ledger.
          </p>
          {byAssignment.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No assignments yet.{" "}
              <Link
                href="/publisher/marketplace"
                className="font-semibold text-violet-600 hover:underline"
              >
                Open marketplace
              </Link>
            </p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {byAssignment.map((a) => {
                const active =
                  detail?.kind === "assignment" &&
                  detail.assignmentId === a.assignment_id;
                return (
                  <li key={a.assignment_id}>
                    <button
                      type="button"
                      onClick={() =>
                        pushDetail({
                          kind: "assignment",
                          assignmentId: a.assignment_id,
                        })
                      }
                      className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                        active
                          ? "border-violet-300 bg-violet-50"
                          : "border-slate-100 bg-slate-50 hover:border-violet-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[#172b63]">
                            {a.program_title ?? "Campaign"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {a.community_name}
                            {a.pricing_model
                              ? ` · ${String(a.pricing_model).toUpperCase()}`
                              : ""}
                            {a.accepted_rate_usd != null
                              ? ` · locked $${Number(a.accepted_rate_usd).toFixed(2)}`
                              : ""}
                          </p>
                        </div>
                        <p className="font-bold text-emerald-700">
                          {money(a.credited_net_usd)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {data.member_settlements_pending > 0 ? (
            <p className="mt-4 text-xs text-slate-500">
              {data.member_settlements_pending} member settlement
              {data.member_settlements_pending === 1 ? "" : "s"} pending
              (tracked separately from publisher earnings).
            </p>
          ) : null}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Recent ledger entries</h2>
          <p className="mt-1 text-sm text-slate-500">
            Click an entry for full amounts and campaign source.
          </p>
          {recentEntries.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No ledger entries yet. Credits appear after partner-confirmed
              actions; reversals are new linked rows, never overwrites.
            </p>
          ) : (
            <EntryList
              rows={recentEntries.slice(0, 20)}
              onSelect={(e) => pushDetail({ kind: "entry", entry: e })}
            />
          )}
        </div>
      </div>
    </>
  );
}
