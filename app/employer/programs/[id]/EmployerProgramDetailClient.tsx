"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchEmployerBilling,
  fetchEmployerProgramStats,
  pauseEmployerProgram,
  resumeEmployerProgram,
  syncEmployerProgramAds,
  type RazorpayConfig,
} from "@/lib/api/employer";
import { useResolvedParam } from "@/lib/hooks/useResolvedParam";
import RazorpayTopUp from "@/components/employer/RazorpayTopUp";

export default function EmployerProgramDetailClient() {
  const idParam = useResolvedParam("id", /^\/employer\/programs\/([^/]+)/);
  const programId = Number(idParam);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [razorpay, setRazorpay] = useState<RazorpayConfig | null>(null);
  const [adsBusy, setAdsBusy] = useState(false);
  const [adsMsg, setAdsMsg] = useState<string | null>(null);

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
  const adSyncs = (Array.isArray(data?.ad_syncs) ? data.ad_syncs : []) as Array<
    Record<string, unknown>
  >;
  const adsConfig = (data?.ads_config ?? {}) as Record<string, unknown>;

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
        {program.pricing_model === "ppe" ||
        program.promotion_type === "post_promote" ? (
          <Link
            href={`/employer/programs/${programId}/post-promote`}
            className="rounded-full border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-700"
          >
            Post promote reviews
          </Link>
        ) : null}
      </div>

      {program.post_url ? (
        <p className="mt-4 text-sm text-slate-600">
          Promoting post:{" "}
          <a
            href={String(program.post_url)}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-purple-700 underline"
          >
            {String(program.post_url)}
          </a>
        </p>
      ) : null}

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

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#172b63]">Platform ads sync</h2>
            <p className="mt-1 text-sm text-slate-500">
              Auto-create matching Meta & LinkedIn campaigns when this JobOrio campaign is live.
            </p>
          </div>
          {status === "active" ? (
            <button
              type="button"
              disabled={adsBusy}
              className="rounded-full bg-[#172b63] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              onClick={() => {
                setAdsBusy(true);
                setAdsMsg(null);
                syncEmployerProgramAds(programId)
                  .then((r) => {
                    setAdsMsg(r.message ?? "Sync complete.");
                    load();
                  })
                  .catch(() => setAdsMsg("Ads sync failed. Check API credentials."))
                  .finally(() => setAdsBusy(false));
              }}
            >
              {adsBusy ? "Syncing…" : "Sync Meta + LinkedIn now"}
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
            <p className="font-semibold text-slate-800">Meta Ads API</p>
            <p className="mt-1 text-slate-500">
              {adsConfig.meta_configured ? "Configured" : "Needs META_ADS_* env on API"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
            <p className="font-semibold text-slate-800">LinkedIn Ads API</p>
            <p className="mt-1 text-slate-500">
              {adsConfig.linkedin_configured
                ? "Configured"
                : "Needs LINKEDIN_ADS_* env on API"}
            </p>
          </div>
        </div>

        {adSyncs.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {adSyncs.map((row) => (
              <li
                key={String(row.platform)}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-4 py-3 text-sm"
              >
                <span className="font-semibold capitalize text-slate-800">
                  {String(row.platform)}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase text-slate-600">
                  {String(row.status)}
                </span>
                {row.external_campaign_id ? (
                  <span className="w-full font-mono text-xs text-slate-500">
                    ID: {String(row.external_campaign_id)}
                  </span>
                ) : null}
                {row.last_error ? (
                  <span className="w-full text-xs text-amber-800">{String(row.last_error)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            No platform sync yet. Enable Meta/LinkedIn on launch, or sync after go-live.
          </p>
        )}
        {adsMsg ? <p className="mt-3 text-sm text-slate-600">{adsMsg}</p> : null}
      </section>

      <p className="mt-6 text-sm text-slate-500">
        Creators see this program in Campaigns when they match your niche and audience countries
        (Module H). Performance events flow through tracked links (Module D).
      </p>
    </>
  );
}
