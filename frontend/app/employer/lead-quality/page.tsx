"use client";

import { useCallback, useEffect, useState } from "react";
import {
  disputeEmployerLead,
  fetchEmployerLeads,
} from "@/lib/api/employer";
import { ApiClientError } from "@/lib/api/client";
import { toast } from "@/components/ui/Toast";

type Lead = {
  id: string;
  numeric_id: number;
  camp: string;
  campaign_title?: string;
  ev: string;
  ts: string;
  clk: string;
  src: string;
  ver: string;
  elig: string;
  status: string;
  reason: string;
  amt: number | null;
  can_dispute: boolean;
  program_id: number | null;
};

const DISP = [
  "Select dispute reason",
  "Wrong attribution",
  "Duplicate billed",
  "Not qualified",
  "Fake lead",
];

function pill(status: string) {
  if (status === "Approved") return "bg-emerald-50 text-emerald-700";
  if (status === "Verified") return "bg-violet-50 text-violet-700";
  if (status === "Rejected") return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

export default function EmployerLeadQualityPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [dispReason, setDispReason] = useState(DISP[0]);
  const [stats, setStats] = useState<Array<{ l: string; v: number }>>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchEmployerLeads({
      status: filter === "all" ? undefined : filter,
      q: q.trim() || undefined,
    })
      .then((d) => {
        setStats(d.stats ?? []);
        setLeads((d.leads as Lead[]) ?? []);
      })
      .catch(() => toast.error("Could not load leads."))
      .finally(() => setLoading(false));
  }, [filter, q]);

  useEffect(() => {
    const t = window.setTimeout(load, 200);
    return () => window.clearTimeout(t);
  }, [load]);

  const dispute = async (lead: Lead) => {
    if (!dispReason || dispReason === DISP[0]) {
      toast.error("Select a dispute reason first.");
      return;
    }
    try {
      await disputeEmployerLead(lead.numeric_id, dispReason);
      toast.success(`Dispute opened for ${lead.id}.`);
      load();
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : "Dispute failed.",
      );
    }
  };

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-[#0F1B3D]">
          Lead quality centre
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Received, verified and approved are different. Only Approved leads are
          billable.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((k) => (
          <div
            key={k.l}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase text-slate-400">
              {k.l}
            </p>
            <p className="mt-2 text-2xl font-bold text-[#0F1B3D]">{k.v}</p>
          </div>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            className="max-w-[220px] rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Search lead or click ID"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {["all", "received", "verified", "approved", "rejected"].map(
              (s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All statuses" : s}
                </option>
              ),
            )}
          </select>
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={dispReason}
            onChange={(e) => setDispReason(e.target.value)}
          >
            {DISP.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading leads…</p>
        ) : leads.length === 0 ? (
          <p className="text-sm text-slate-500">
            No leads yet. Approved partner conversions will appear here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  {[
                    "Lead",
                    "Campaign",
                    "Event",
                    "Time",
                    "Click ID",
                    "Source",
                    "Verification",
                    "Eligibility",
                    "Status",
                    "Reason",
                    "Billable",
                    "",
                  ].map((h) => (
                    <th key={h || "a"} className="px-2 py-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-b border-slate-100">
                    <td className="px-2 py-2 font-mono text-xs">{l.id}</td>
                    <td className="px-2 py-2 font-mono text-xs">{l.camp}</td>
                    <td className="px-2 py-2">{l.ev}</td>
                    <td className="px-2 py-2">{l.ts}</td>
                    <td className="px-2 py-2 font-mono text-xs">{l.clk}</td>
                    <td className="px-2 py-2">{l.src}</td>
                    <td className="px-2 py-2">{l.ver}</td>
                    <td className="px-2 py-2">{l.elig}</td>
                    <td className="px-2 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${pill(l.status)}`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="px-2 py-2">{l.reason}</td>
                    <td className="px-2 py-2">
                      {l.amt != null ? `$${Number(l.amt).toFixed(2)}` : "—"}
                    </td>
                    <td className="px-2 py-2">
                      {l.can_dispute ? (
                        <button
                          type="button"
                          onClick={() => dispute(l)}
                          className="rounded-full border border-slate-200 px-2 py-1 text-[11px] font-bold"
                        >
                          Dispute
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">
          Disputing needs a reason from the list. JobOrio ops review the
          evidence and may reverse the billable amount through a ledger
          adjustment.
        </p>
      </section>
    </>
  );
}
