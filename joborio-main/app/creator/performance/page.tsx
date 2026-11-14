"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  fetchCreatorCampaigns,
  fetchCreatorDashboard,
  fetchCreatorRegistrations,
  type CreatorCampaignRow,
  type CreatorRegistrationRow,
} from "@/lib/api/creator";
import { formatMoney } from "@/lib/money";

type PromoteId = "all" | "ppc" | "ppr" | "ppa" | "ppe";

const PROMOTE_TYPES = [
  {
    id: "ppc" as const,
    label: "Pay per click (PPC)",
    desc: "Tracked job / listing clicks from your share links.",
  },
  {
    id: "ppr" as const,
    label: "Pay per registration (PPR)",
    desc: "Email-verified signups attributed to your link.",
  },
  {
    id: "ppa" as const,
    label: "Pay per application (PPA)",
    desc: "Employer-confirmed applications from campaigns.",
  },
  {
    id: "ppe" as const,
    label: "Pay per engagement (PPE)",
    desc: "Approved like / comment / repost on post-promote campaigns.",
  },
];

const REG_STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "pending_verification", label: "Pending verify" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

function campaignModel(row: Record<string, unknown> | CreatorCampaignRow): string {
  if ("program" in row && row.program) {
    return String(row.program.pricing_model ?? row.program.promotion_type ?? "").toLowerCase();
  }
  return String(row.pricing_model ?? row.promotion_type ?? "").toLowerCase();
}

function campaignTitle(row: Record<string, unknown> | CreatorCampaignRow): string {
  if ("program" in row && row.program) {
    return String(row.program.title ?? "Campaign");
  }
  return String(row.title ?? "Campaign");
}

function campaignId(row: Record<string, unknown> | CreatorCampaignRow): number | null {
  if ("program" in row && row.program) {
    const id = Number(row.program.id);
    return Number.isFinite(id) && id > 0 ? id : null;
  }
  const id = Number(row.id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export default function CreatorPerformancePage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [joinedCampaigns, setJoinedCampaigns] = useState<CreatorCampaignRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [promoteFilter, setPromoteFilter] = useState<PromoteId>("all");
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [regStatus, setRegStatus] = useState("");
  const [registrations, setRegistrations] = useState<CreatorRegistrationRow[]>([]);
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    try {
      const tab = new URLSearchParams(window.location.search).get("tab");
      if (tab === "ppr" || tab === "ppc" || tab === "ppa" || tab === "ppe") {
        setPromoteFilter(tab);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchCreatorDashboard()
      .then(setData)
      .catch(() => setError("Could not load performance. Sign in as a creator."));
    fetchCreatorCampaigns()
      .then((rows) => setJoinedCampaigns(rows.filter((r) => r.joined)))
      .catch(() => setJoinedCampaigns([]));
  }, []);

  const earningsByType = (data?.earnings_by_type ?? {}) as Record<
    string,
    Record<string, number>
  >;
  const metrics = (data?.metrics ?? {}) as Record<string, number>;
  const earningsCampaigns = (data?.earnings_by_campaign ?? []) as Array<
    Record<string, unknown>
  >;
  const currency = String(data?.currency ?? "USD");

  const pprCampaignOptions = useMemo(() => {
    const fromJoined = joinedCampaigns.filter(
      (row) => campaignModel(row) === "ppr",
    );
    const fromEarnings = earningsCampaigns.filter(
      (row) => campaignModel(row) === "ppr" && campaignId(row) != null,
    );

    const map = new Map<number, { id: number; title: string; net_usd?: number }>();
    for (const row of fromEarnings) {
      const id = campaignId(row);
      if (id == null) continue;
      map.set(id, {
        id,
        title: campaignTitle(row),
        net_usd: Number(row.net_usd ?? row.gross_usd ?? 0),
      });
    }
    for (const row of fromJoined) {
      const id = campaignId(row);
      if (id == null || map.has(id)) continue;
      map.set(id, { id, title: campaignTitle(row), net_usd: 0 });
    }
    return Array.from(map.values());
  }, [joinedCampaigns, earningsCampaigns]);

  const filteredCampaigns = useMemo(() => {
    if (promoteFilter === "all") return earningsCampaigns;
    return earningsCampaigns.filter((row) => campaignModel(row) === promoteFilter);
  }, [earningsCampaigns, promoteFilter]);

  useEffect(() => {
    if (promoteFilter !== "ppr") {
      setSelectedProgramId(null);
      setRegistrations([]);
      setRegError(null);
      return;
    }
    if (selectedProgramId == null && pprCampaignOptions.length === 1) {
      setSelectedProgramId(pprCampaignOptions[0].id);
    }
  }, [promoteFilter, pprCampaignOptions, selectedProgramId]);

  useEffect(() => {
    if (promoteFilter !== "ppr" || selectedProgramId == null) {
      setRegistrations([]);
      return;
    }
    setRegLoading(true);
    setRegError(null);
    fetchCreatorRegistrations({
      program_id: selectedProgramId,
      ...(regStatus ? { status: regStatus } : {}),
    })
      .then(({ data: rows }) => setRegistrations(rows))
      .catch(() => {
        setRegistrations([]);
        setRegError("Could not load registrations for this campaign.");
      })
      .finally(() => setRegLoading(false));
  }, [promoteFilter, selectedProgramId, regStatus]);

  const selectedPpr = pprCampaignOptions.find((c) => c.id === selectedProgramId);

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
          Analytics
        </p>
        <h1 className="mt-1 text-3xl font-bold">Performance</h1>
        <p className="mt-2 max-w-2xl text-slate-500">
          See which promote link types are earning — PPC, PPR, PPA, and post-promote
          PPE. Open a PPR campaign to view its registrations.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {!data && !error ? <p className="text-sm text-slate-500">Loading…</p> : null}

      {data ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {(
              [
                { id: "all", label: "All" },
                ...PROMOTE_TYPES.map((t) => ({ id: t.id, label: t.id.toUpperCase() })),
              ] as Array<{ id: PromoteId; label: string }>
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPromoteFilter(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  promoteFilter === tab.id
                    ? "bg-purple-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {PROMOTE_TYPES.filter(
              (type) => promoteFilter === "all" || promoteFilter === type.id,
            ).map((type) => {
              const bucket = earningsByType[type.id] ?? {};
              const total =
                Number(bucket.pending_usd ?? 0) +
                Number(bucket.approved_usd ?? 0) +
                Number(bucket.payable_usd ?? 0) +
                Number(bucket.paid_usd ?? 0);
              return (
                <article
                  key={type.id}
                  className={`rounded-2xl border bg-white p-5 shadow-sm ${
                    type.id === "ppr" && promoteFilter === "ppr"
                      ? "border-purple-300 ring-1 ring-purple-200"
                      : "border-slate-200"
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                    {type.id}
                  </p>
                  <h2 className="mt-1 font-bold text-[#172b63]">{type.label}</h2>
                  <p className="mt-1 text-xs text-slate-500">{type.desc}</p>
                  <p className="mt-4 text-2xl font-bold">
                    {formatMoney(total, currency)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Pending {formatMoney(Number(bucket.pending_usd ?? 0), currency)} ·
                    Paid {formatMoney(Number(bucket.paid_usd ?? 0), currency)}
                  </p>
                  {type.id === "ppr" ? (
                    <button
                      type="button"
                      onClick={() => setPromoteFilter("ppr")}
                      className="mt-3 text-xs font-semibold text-purple-600"
                    >
                      View PPR registrations →
                    </button>
                  ) : null}
                </article>
              );
            })}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase text-slate-400">Verified clicks</p>
              <p className="mt-2 text-3xl font-bold">{metrics.clicks ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase text-slate-400">Last 7 days</p>
              <p className="mt-2 text-3xl font-bold">{metrics.clicks_7d ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase text-slate-400">Registrations</p>
              <p className="mt-2 text-3xl font-bold">{metrics.registrations ?? 0}</p>
            </div>
          </div>

          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">
                {promoteFilter === "all"
                  ? "By campaign / promote link"
                  : `${promoteFilter.toUpperCase()} campaigns`}
              </h2>
              <Link
                href="/creator/campaigns"
                className="text-sm font-semibold text-purple-600"
              >
                Manage campaigns →
              </Link>
            </div>
            {filteredCampaigns.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                No campaign earnings yet
                {promoteFilter !== "all" ? ` for ${promoteFilter.toUpperCase()}` : ""}.
                Join a campaign or share tracked links.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {filteredCampaigns.map((row, idx) => {
                  const id = campaignId(row);
                  const isPpr = campaignModel(row) === "ppr";
                  const selected = isPpr && id != null && id === selectedProgramId;
                  return (
                    <li key={String(id ?? idx)}>
                      <button
                        type="button"
                        disabled={!isPpr || id == null}
                        onClick={() => {
                          if (!isPpr || id == null) return;
                          setPromoteFilter("ppr");
                          setSelectedProgramId(id);
                        }}
                        className={`flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm ${
                          selected
                            ? "border-purple-300 bg-purple-50"
                            : "border-slate-100 bg-slate-50"
                        } ${isPpr && id != null ? "cursor-pointer hover:border-purple-200" : ""}`}
                      >
                        <div>
                          <p className="font-semibold">{campaignTitle(row)}</p>
                          <p className="text-xs uppercase text-slate-500">
                            {campaignModel(row) || "link"}
                            {isPpr ? " · tap to view registrations" : ""}
                          </p>
                        </div>
                        <p className="font-bold text-purple-700">
                          {formatMoney(Number(row.net_usd ?? row.gross_usd ?? 0), currency)}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {promoteFilter === "ppr" ? (
            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
                    PPR · Pay per registration
                  </p>
                  <h2 className="mt-1 text-lg font-bold">
                    {selectedPpr
                      ? `Registrations · ${selectedPpr.title}`
                      : "Registrations by campaign"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Signups for the selected PPR campaign. Email must verify within 24
                    hours before earnings move to the ledger.
                  </p>
                </div>
                <Link
                  href="/creator/earnings"
                  className="text-sm font-semibold text-purple-600"
                >
                  Earnings ledger →
                </Link>
              </div>

              {pprCampaignOptions.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  No PPR campaigns joined yet.{" "}
                  <Link href="/creator/campaigns" className="font-semibold text-purple-600">
                    Browse campaigns
                  </Link>
                </p>
              ) : (
                <>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {pprCampaignOptions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedProgramId(c.id)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${
                          selectedProgramId === c.id
                            ? "bg-purple-600 text-white"
                            : "border border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        {c.title}
                      </button>
                    ))}
                  </div>

                  {selectedProgramId != null ? (
                    <>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {REG_STATUS_FILTERS.map((f) => (
                          <button
                            key={f.value || "all"}
                            type="button"
                            onClick={() => setRegStatus(f.value)}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                              regStatus === f.value
                                ? "bg-slate-900 text-white"
                                : "border border-slate-200 bg-white text-slate-600"
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      {regError ? (
                        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {regError}
                        </p>
                      ) : null}

                      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                        <table className="w-full text-left text-sm">
                          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                              <th className="px-4 py-3">Listing</th>
                              <th className="px-4 py-3">Email</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="hidden px-4 py-3 sm:table-cell">Earning</th>
                              <th className="hidden px-4 py-3 md:table-cell">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {registrations.map((row) => (
                              <tr
                                key={row.id}
                                className="border-b border-slate-50 last:border-0"
                              >
                                <td className="px-4 py-3">
                                  {row.listing?.title ?? `Listing #${row.id}`}
                                  {row.listing?.company_name ? (
                                    <span className="block text-xs text-slate-400">
                                      {row.listing.company_name}
                                    </span>
                                  ) : null}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs">
                                  {row.email_masked}
                                </td>
                                <td className="px-4 py-3">
                                  <StatusBadge status={row.status} />
                                </td>
                                <td className="hidden px-4 py-3 sm:table-cell">
                                  {row.earning ? (
                                    <span className="font-semibold">
                                      ${Number(row.earning.net_usd).toFixed(2)}{" "}
                                      <span className="text-xs font-normal text-slate-400">
                                        ({row.earning.state})
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="hidden px-4 py-3 text-slate-500 md:table-cell">
                                  {new Date(row.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {regLoading ? (
                          <p className="p-6 text-center text-sm text-slate-500">
                            Loading registrations…
                          </p>
                        ) : null}
                        {!regLoading && registrations.length === 0 && !regError ? (
                          <p className="p-8 text-center text-sm text-slate-500">
                            No registrations for this PPR campaign yet. Share tracked
                            signup links for this campaign.
                          </p>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">
                      Select a PPR campaign above to see its registrations.
                    </p>
                  )}
                </>
              )}
            </section>
          ) : null}
        </>
      ) : null}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tones: Record<string, string> = {
    pending_verification: "bg-amber-50 text-amber-800",
    verified: "bg-emerald-50 text-emerald-800",
    rejected: "bg-red-50 text-red-700",
  };
  const label = status.replace(/_/g, " ");

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
        tones[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {label}
    </span>
  );
}
