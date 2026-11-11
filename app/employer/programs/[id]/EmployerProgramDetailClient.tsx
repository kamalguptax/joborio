"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchEmployerBilling,
  fetchEmployerProgramStats,
  pauseEmployerProgram,
  resumeEmployerProgram,
  type RazorpayConfig,
} from "@/lib/api/employer";
import { useResolvedParam } from "@/lib/hooks/useResolvedParam";
import RazorpayTopUp from "@/components/employer/RazorpayTopUp";

export default function EmployerProgramDetailClient() {
  const idParam = useResolvedParam("id", /^\/employer\/programs\/([^/]+)/);
  const programId = Number(idParam);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [razorpay, setRazorpay] = useState<RazorpayConfig | null>(null);

  const load = () => {
    fetchEmployerProgramStats(programId).then(setData).catch(() => setData(null));
  };

  useEffect(() => {
    if (!Number.isFinite(programId)) return;
    load();
  }, [programId]);

  useEffect(() => {
    fetchEmployerBilling()
      .then((d) => setRazorpay(d.razorpay ?? null))
      .catch(() => setRazorpay(null));
  }, []);

  const program = (data?.program ?? {}) as Record<string, unknown>;
  const match = (data?.match_preview ?? {}) as Record<string, unknown>;
  const status = String(program.status ?? "");
  const budgetTotal = Number(program.budget_total_usd ?? 0);
  const budgetSpent = Number(program.budget_spent_usd ?? 0);

  return (
    <>
      <Link href="/employer/programs" className="text-sm font-semibold text-purple-600">
        ← Programs
      </Link>
      <h1 className="mt-4 text-2xl font-bold">{String(program.title ?? "Program")}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {String(program.pricing_model ?? "").toUpperCase()} · {status} · Budget $
        {budgetTotal.toFixed(0)} (spent ${budgetSpent.toFixed(2)})
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {status === "active" ? (
          <button
            type="button"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold"
            onClick={() => pauseEmployerProgram(programId).then(load)}
          >
            Pause program
          </button>
        ) : null}
        {status === "paused" ? (
          <button
            type="button"
            className="rounded-full bg-purple-600 px-4 py-2 text-sm font-bold text-white"
            onClick={() => resumeEmployerProgram(programId).then(load)}
          >
            Resume program
          </button>
        ) : null}
        {program.pricing_model === "ppa" ? (
          <Link
            href={`/employer/programs/${programId}/applications`}
            className="rounded-full border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-700"
          >
            PPA applications
          </Link>
        ) : null}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase text-slate-400">Matched creators</p>
          <p className="mt-2 text-2xl font-bold">{Number(match.matched_count ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase text-slate-400">Avg fit score</p>
          <p className="mt-2 text-2xl font-bold">{Number(match.avg_fit_score ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase text-slate-400">Creators opted in</p>
          <p className="mt-2 text-2xl font-bold">{Number(data?.creators_opted_in ?? 0)}</p>
        </div>
      </div>

      <div className="mt-8">
        <RazorpayTopUp
          razorpay={razorpay}
          purpose="program_budget"
          programId={programId}
          title="Add campaign budget"
          description="Pay with Razorpay to increase this campaign’s budget for PPC, PPR, or PPA spend."
          onSuccess={() => load()}
        />
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Creators see this program in Campaigns when they match your niche and audience countries
        (Module H). Performance events flow through tracked links (Module D).
      </p>
    </>
  );
}
