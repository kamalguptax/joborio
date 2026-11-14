"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  fetchCreatorCampaigns,
  optInCampaign,
  type CreatorCampaignRow,
} from "@/lib/api/creator";
import { formatMoney } from "@/lib/money";

type TabId = "all" | "ppc" | "ppr" | "course" | "ppa" | "ppe" | "branding";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "all", label: "All" },
  { id: "ppc", label: "PPC" },
  { id: "ppr", label: "PPR" },
  { id: "course", label: "Courses" },
  { id: "ppa", label: "PPA" },
  { id: "ppe", label: "PPE" },
  { id: "branding", label: "Branding" },
];

function campaignTab(row: CreatorCampaignRow): TabId[] {
  const p = row.program;
  const pricing = String(p.pricing_model ?? "").toLowerCase();
  const promo = String(p.promotion_type ?? "").toLowerCase();
  const tabs: TabId[] = ["all"];
  if (pricing === "ppc" || pricing === "ppr" || pricing === "ppa" || pricing === "ppe") {
    tabs.push(pricing);
  }
  if (promo === "course") tabs.push("course");
  if (promo === "branding") tabs.push("branding");
  if (promo === "post_promote") tabs.push("ppe");
  return [...new Set(tabs)];
}

function rateUnit(model: string): string {
  if (model === "ppc") return "click";
  if (model === "ppr") return "registration";
  if (model === "ppe") return "engagement";
  return "application";
}

export default function LiveCampaignsPanel({
  currency = "USD",
  initialTab = "all",
  previewLimit = 6,
}: {
  currency?: string;
  initialTab?: TabId;
  previewLimit?: number;
}) {
  const [rows, setRows] = useState<CreatorCampaignRow[]>([]);
  const [tab, setTab] = useState<TabId>(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  const load = () => {
    setLoading(true);
    fetchCreatorCampaigns()
      .then((data) => {
        setRows(data);
        setError(null);
      })
      .catch(() => {
        setRows([]);
        setError("Could not load live campaigns.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setTab(initialTab);
    setExpanded(false);
  }, [initialTab]);

  const filtered = useMemo(
    () => rows.filter((row) => campaignTab(row).includes(tab)),
    [rows, tab],
  );

  const visible = expanded ? filtered : filtered.slice(0, previewLimit);

  const join = async (row: CreatorCampaignRow) => {
    setBusyId(row.program.id);
    try {
      if (!row.joined) {
        await optInCampaign(row.program.id);
        load();
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">Live campaigns</h2>
          <p className="mt-1 text-xs text-slate-500">
            Category-wise active programs you can join and promote.
          </p>
        </div>
        <Link
          href="/creator/campaigns"
          className="text-sm font-semibold text-purple-600"
        >
          View all campaigns →
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((item) => {
          const count =
            item.id === "all"
              ? rows.length
              : rows.filter((row) => campaignTab(row).includes(item.id)).length;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                setExpanded(false);
              }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                active
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm"
                  : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-purple-200"
              }`}
            >
              {item.label}
              <span className={`ml-1.5 ${active ? "text-white/80" : "text-slate-400"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading live campaigns…</p>
      ) : error ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
          No live {tab === "all" ? "" : `${TABS.find((t) => t.id === tab)?.label} `}
          campaigns right now.{" "}
          <Link href="/creator/campaigns" className="font-semibold text-purple-600">
            Open campaigns
          </Link>
        </p>
      ) : (
        <>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((row) => {
              const p = row.program;
              const model = String(p.pricing_model).toUpperCase();
              const promo = String(p.promotion_type ?? "campaign");
              return (
                <li
                  key={p.id}
                  className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      {model}
                    </span>
                    <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                      {promo}
                    </span>
                    {row.joined ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        Joined
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 line-clamp-2 font-bold text-[#172b63]">{p.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {formatMoney(Number(p.rate_usd), currency)} / {rateUnit(String(p.pricing_model))}
                    {" · "}
                    Budget {formatMoney(Number(p.budget_total_usd), currency)}
                  </p>
                  <p className="mt-1 text-xs capitalize text-slate-400">
                    Status: {String(p.status)}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    <Link
                      href="/creator/campaigns"
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      View more
                    </Link>
                    {!row.joined ? (
                      <button
                        type="button"
                        disabled={busyId === p.id}
                        onClick={() => join(row)}
                        className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                      >
                        {busyId === p.id ? "…" : "Join"}
                      </button>
                    ) : (
                      <Link
                        href="/creator/campaigns"
                        className="rounded-full bg-[#172b63] px-3 py-1.5 text-xs font-bold text-white"
                      >
                        Open
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {filtered.length > previewLimit ? (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="rounded-full border border-purple-200 bg-purple-50 px-5 py-2 text-sm font-semibold text-purple-800"
              >
                {expanded
                  ? "Show less"
                  : `View more (${filtered.length - previewLimit} more)`}
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
