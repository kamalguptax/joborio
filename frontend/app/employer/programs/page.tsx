"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  fetchEmployerPrograms,
  goLiveEmployerProgram,
  pauseEmployerProgram,
  resumeEmployerProgram,
} from "@/lib/api/employer";
import { ApiClientError } from "@/lib/api/client";
import { toast } from "@/components/ui/Toast";
import PageHeader from "@/components/layout/PageHeader";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

type Row = {
  id: string;
  numericId?: number;
  name: string;
  cat: string;
  modelU: string;
  status: string;
  budget: number;
  spent: number;
  clicks: number;
  raw: number;
  appr: number;
  price: number;
  start: string;
  end: string;
  ver: number;
  live: boolean;
};

function statusPill(status: string) {
  const s = status.toLowerCase();
  if (s === "active") return "bg-emerald-50 text-emerald-700";
  if (s === "paused") return "bg-amber-50 text-amber-800";
  if (s.includes("pending") || s === "submitted") return "bg-violet-50 text-violet-700";
  if (s === "draft") return "bg-slate-100 text-slate-600";
  return "bg-slate-100 text-slate-600";
}

function mapLive(p: Record<string, unknown>): Row {
  const budgetUsd = Number(p.budget_total_usd ?? 0);
  const spentUsd = Number(p.budget_spent_usd ?? 0);
  const rateUsd = Number(p.rate_usd ?? 0);
  const clicks = Number(p.clicks ?? 0);
  const raw = Number(p.raw_conversions ?? 0);
  const appr = Number(p.approved_conversions ?? 0);
  return {
    id: `JO-C-${p.id}`,
    numericId: Number(p.id),
    name: String(p.title ?? "Untitled"),
    cat: String(p.brand_category ?? p.promotion_type ?? "Jobs"),
    modelU: String(p.conversion_model_code ?? p.pricing_model ?? "ppc").toUpperCase(),
    status: String(p.status ?? "draft").replace(/_/g, " "),
    budget: budgetUsd * 83,
    spent: spentUsd * 83,
    clicks,
    raw: raw || Math.round(clicks * 0.06),
    appr: appr || Math.round(clicks * 0.04),
    price: rateUsd * 83,
    start: p.starts_at ? String(p.starts_at).slice(0, 10) : "—",
    end: p.ends_at ? String(p.ends_at).slice(0, 10) : "—",
    ver: 1,
    live: true,
  };
}

export default function EmployerProgramsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [log, setLog] = useState<Array<{ txt: string; t: string; who: string }>>([
    { txt: "Campaign created", t: "24 Nov 10:12", who: "You" },
    { txt: "Submitted for approval", t: "24 Nov 10:40", who: "You" },
  ]);

  const load = () => {
    fetchEmployerPrograms()
      .then((programs) => {
        setRows((programs ?? []).map(mapLive));
      })
      .catch(() => {
        setRows([]);
        toast.error("Could not load campaigns.");
      });
  };

  useEffect(() => {
    load();
  }, []);

  const sel = useMemo(
    () => rows.find((r) => r.id === selId) ?? null,
    [rows, selId],
  );

  const runAction = async (
    row: Row,
    action: "pause" | "resume" | "live",
  ) => {
    if (!row.numericId) {
      toast.info("Sample campaign — action preview only.");
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? {
                ...r,
                status:
                  action === "pause"
                    ? "Paused"
                    : action === "resume" || action === "live"
                      ? "Active"
                      : r.status,
              }
            : r,
        ),
      );
      return;
    }
    setBusyId(row.id);
    try {
      if (action === "pause") await pauseEmployerProgram(row.numericId);
      else if (action === "resume") await resumeEmployerProgram(row.numericId);
      else await goLiveEmployerProgram(row.numericId);
      toast.success(
        action === "pause"
          ? "Campaign paused."
          : action === "resume"
            ? "Campaign resumed."
            : "Campaign taken live.",
      );
      load();
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : "Action failed.",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHeader title="My campaigns" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mt-1 text-sm text-slate-500">
            Every status change is logged. You cannot edit partner assignments or
            contact partners.
          </p>
        </div>
        <Link
          href="/employer/programs/new"
          className="rounded-full bg-violet-600 px-4 py-2 text-sm font-bold text-white"
        >
          Create campaign
        </Link>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
              {[
                "Campaign",
                "Category",
                "Model",
                "Status",
                "Budget",
                "Spent",
                "Remaining",
                "Clicks",
                "Raw",
                "Approved",
                "Approval",
                "Eff. cost",
                "Dates",
                "Actions",
              ].map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const rem = Math.max(0, c.budget - c.spent);
              const rate = c.raw ? `${Math.round((c.appr / c.raw) * 100)}%` : "—";
              const ecp = c.appr ? inr.format(c.spent / c.appr) : "—";
              const st = c.status.toLowerCase();
              return (
                <tr key={c.id} className="border-b border-slate-100">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-[#0F1B3D]">{c.name}</p>
                    <p className="font-mono text-[11px] text-slate-400">{c.id}</p>
                  </td>
                  <td className="px-3 py-3">{c.cat}</td>
                  <td className="px-3 py-3">{c.modelU}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${statusPill(c.status)}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">{inr.format(c.budget)}</td>
                  <td className="px-3 py-3">{inr.format(c.spent)}</td>
                  <td className="px-3 py-3">{inr.format(rem)}</td>
                  <td className="px-3 py-3">{c.clicks.toLocaleString("en-IN")}</td>
                  <td className="px-3 py-3">{c.raw.toLocaleString("en-IN")}</td>
                  <td className="px-3 py-3">{c.appr.toLocaleString("en-IN")}</td>
                  <td className="px-3 py-3">{rate}</td>
                  <td className="px-3 py-3">{ecp}</td>
                  <td className="px-3 py-3 text-xs">
                    {c.start}
                    <br />
                    {c.end}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-nowrap gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelId(c.id);
                          setConfirmCancel(false);
                        }}
                        className="rounded-full border border-slate-200 px-2 py-1 text-[11px] font-bold"
                      >
                        View
                      </button>
                      {st === "active" ? (
                        <button
                          type="button"
                          disabled={busyId === c.id}
                          onClick={() => void runAction(c, "pause")}
                          className="rounded-full border border-slate-200 px-2 py-1 text-[11px] font-bold"
                        >
                          Pause
                        </button>
                      ) : null}
                      {st === "paused" || st.includes("pending") ? (
                        <button
                          type="button"
                          disabled={busyId === c.id}
                          onClick={() =>
                            void runAction(
                              c,
                              st.includes("pending") ? "live" : "resume",
                            )
                          }
                          className="rounded-full border border-slate-200 px-2 py-1 text-[11px] font-bold"
                        >
                          {st.includes("pending") ? "Go live" : "Resume"}
                        </button>
                      ) : null}
                      <Link
                        href="/employer/reports"
                        className="rounded-full border border-slate-200 px-2 py-1 text-[11px] font-bold"
                      >
                        Report issue
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sel ? (
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-lg font-bold text-[#0F1B3D]">
              {sel.name}{" "}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${statusPill(sel.status)}`}
              >
                {sel.status}
              </span>
            </h2>
            <button
              type="button"
              onClick={() => setSelId(null)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold"
            >
              Close
            </button>
          </div>
          <dl className="mt-4 grid gap-2 sm:grid-cols-2 text-sm">
            {[
              ["Campaign ID", sel.id],
              [
                "Model and price",
                `${sel.modelU} at ${inr.format(sel.price)} (version v${sel.ver})`,
              ],
              [
                "Budget",
                `${inr.format(sel.budget)}, spent ${inr.format(sel.spent)}`,
              ],
              ["Schedule", `${sel.start} to ${sel.end}`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-slate-50 px-3 py-2">
                <dt className="text-[10px] font-bold uppercase text-slate-400">
                  {k}
                </dt>
                <dd className="font-semibold text-[#0F1B3D]">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setRows((prev) =>
                  prev.map((r) =>
                    r.id === sel.id ? { ...r, budget: r.budget + 10000 } : r,
                  ),
                );
                setLog((l) => [
                  {
                    txt: "Budget increased by ₹10,000",
                    t: "Just now",
                    who: "You",
                  },
                  ...l,
                ]);
                toast.success("Budget increased by ₹10,000 (preview).");
              }}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold"
            >
              Increase budget by 10,000
            </button>
            <button
              type="button"
              onClick={() => toast.info("Extend by 7 days (preview).")}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold"
            >
              Extend by 7 days
            </button>
            <Link
              href="/employer/programs/new"
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold"
            >
              Duplicate
            </Link>
            <button
              type="button"
              onClick={() => toast.info("Report download started (preview).")}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold"
            >
              Download report
            </button>
            <Link
              href="/employer/support"
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold"
            >
              Request support
            </Link>
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700"
            >
              Cancel campaign
            </button>
          </div>
          <div className="mt-3 flex max-w-md flex-wrap gap-2">
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="New price (INR)"
              className="min-w-[140px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                if (!newPrice) {
                  toast.error("Enter a new price.");
                  return;
                }
                toast.success("Price change requested (preview).");
                setLog((l) => [
                  {
                    txt: `Price change requested to ₹${newPrice}`,
                    t: "Just now",
                    who: "You",
                  },
                  ...l,
                ]);
              }}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold"
            >
              Request price change
            </button>
          </div>
          {confirmCancel ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              Cancel this campaign? Distribution stops, unspent reserved budget
              returns to your wallet, and approved conversions stay billable.
              This cannot be undone.
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRows((prev) =>
                      prev.map((r) =>
                        r.id === sel.id ? { ...r, status: "Cancelled" } : r,
                      ),
                    );
                    setConfirmCancel(false);
                    toast.info("Campaign cancelled (preview).");
                  }}
                  className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-bold text-white"
                >
                  Yes, cancel campaign
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold"
                >
                  Keep campaign
                </button>
              </div>
            </div>
          ) : null}
          <h3 className="mt-5 text-sm font-bold text-[#0F1B3D]">Change history</h3>
          <ul className="mt-2 space-y-2">
            {log.map((a, i) => (
              <li
                key={`${a.txt}-${i}`}
                className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
              >
                {a.txt}
                <span className="mt-0.5 block text-[11px] text-slate-400">
                  {a.t} · {a.who}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
