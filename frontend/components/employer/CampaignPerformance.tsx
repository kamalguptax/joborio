"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchEmployerPrograms } from "@/lib/api/employer";
import {
  buildPerfTiles,
  type PerfCampaignOption,
} from "@/lib/employer/brandPerformanceSample";

function fromProgram(p: Record<string, unknown>): PerfCampaignOption {
  const clicks = Number(p.clicks ?? p.click_count ?? 0);
  const raw = Number(p.raw_conversions ?? p.raw ?? 0);
  const appr = Number(p.approved_conversions ?? p.appr ?? 0);
  const spent = Number(p.budget_spent_usd ?? p.spent ?? 0) * 83;
  const rate = Number(p.rate_usd ?? 0) * 83;
  return {
    id: String(p.id),
    name: String(p.title ?? "Untitled"),
    clicks,
    raw,
    appr,
    spent,
    price: rate,
  };
}

export default function CampaignPerformance() {
  const [campaignId, setCampaignId] = useState("all");
  const [live, setLive] = useState<PerfCampaignOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployerPrograms()
      .then((programs) => {
        const mapped = (programs ?? [])
          .filter((p) => String(p.status) !== "draft")
          .map(fromProgram);
        setLive(mapped);
      })
      .catch(() => setLive([]))
      .finally(() => setLoading(false));
  }, []);

  const options = live;

  const selected = useMemo(() => {
    if (options.length === 0) {
      return {
        id: "all",
        name: "All campaigns",
        clicks: 0,
        raw: 0,
        appr: 0,
        spent: 0,
        price: 0,
      };
    }
    if (campaignId === "all") {
      return options.reduce(
        (acc, c) => ({
          id: "all",
          name: "All campaigns",
          clicks: acc.clicks + c.clicks,
          raw: acc.raw + c.raw,
          appr: acc.appr + c.appr,
          spent: acc.spent + c.spent,
          price: 0,
        }),
        { id: "all", name: "All campaigns", clicks: 0, raw: 0, appr: 0, spent: 0, price: 0 },
      );
    }
    return options.find((c) => c.id === campaignId) ?? options[0]!;
  }, [campaignId, options]);

  const tiles = buildPerfTiles(selected);

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-[#0A2150]">Campaign performance</h1>
        <p className="mt-1 text-sm text-slate-500">
          Funnel metrics for your selected campaign.{" "}
          {loading ? <span className="text-slate-400">Loading…</span> : null}
        </p>
      </div>

      {options.length === 0 && !loading ? (
        <p className="mt-5 text-sm text-slate-500">
          No live campaigns yet. Create a campaign to see performance.
        </p>
      ) : (
        <>
          <div className="mt-4 max-w-md">
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-[#0A2150] outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
            >
              <option value="all">All campaigns</option>
              {options.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map((k) => (
              <div
                key={k.l}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {k.l}
                </p>
                <p className="mt-2 text-2xl font-bold text-[#0A2150]">{k.v}</p>
                <p className="mt-1 text-[11px] text-slate-500">{k.n}</p>
              </div>
            ))}
          </div>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-[#0A2150]">
              Source reporting (anonymised)
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Aggregated source segments will appear here when tracking events
              exist. Partner identities are never shown.
            </p>
          </section>
        </>
      )}
    </>
  );
}
