"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchCreatorCampaigns,
  optInCampaign,
  optOutCampaign,
  type CreatorCampaignRow,
} from "@/lib/api/creator";

export default function CreatorCampaignsPage() {
  const [rows, setRows] = useState<CreatorCampaignRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = () => {
    fetchCreatorCampaigns()
      .then(setRows)
      .catch(() => setError("Sign in as a creator with completed onboarding."));
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (row: CreatorCampaignRow) => {
    setBusyId(row.program.id);
    try {
      if (row.joined) {
        await optOutCampaign(row.program.id);
      } else {
        await optInCampaign(row.program.id);
      }
      load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
          Employer programs
        </p>
        <h1 className="mt-1 text-3xl font-bold">Campaigns</h1>
        <p className="mt-2 max-w-2xl text-slate-500">
          Only campaigns that match your skills and audience location are shown.
          PPC and PPA earnings require an active opt-in.
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </p>
      ) : null}

      <div className="space-y-4">
        {rows.map((row) => {
          const p = row.program;
          const model = String(p.pricing_model).toUpperCase();
          return (
            <article
              key={p.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      {model}
                    </span>
                    {p.promotion_type ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                        {String(p.promotion_type)}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-2 font-bold">{p.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    ${Number(p.rate_usd).toFixed(2)} per{" "}
                    {p.pricing_model === "ppc"
                      ? "click"
                      : p.pricing_model === "ppr"
                        ? "registration"
                        : "application"}
                    · Budget ${Number(p.budget_total_usd).toFixed(0)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busyId === p.id}
                  onClick={() => toggle(row)}
                  className={`rounded-full px-5 py-2.5 text-sm font-bold ${
                    row.joined
                      ? "border border-slate-200 text-slate-600"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  }`}
                >
                  {busyId === p.id
                    ? "…"
                    : row.joined
                      ? "Leave campaign"
                      : "Join campaign"}
                </button>
              </div>
            </article>
          );
        })}
        {rows.length === 0 && !error ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <p className="font-semibold text-slate-800">No matching campaigns</p>
            <p className="mt-2 text-sm text-slate-500">
              Campaigns appear here when they match the skills and location in your
              job preferences.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/creator/job-preferences"
                className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-bold text-white"
              >
                Update job preferences
              </Link>
              <Link
                href="/employer/programs/new"
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700"
              >
                I&apos;m an employer — create a program
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
