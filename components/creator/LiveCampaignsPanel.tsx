"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import ShareLinkButton from "@/components/share/ShareLinkButton";
import {
  fetchCreatorCampaigns,
  fetchTrackLink,
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

function campaignListingId(program: CreatorCampaignRow["program"]): number {
  const nested = Number(program.listing?.id ?? 0);
  if (nested > 0) return nested;
  return Number((program as { listing_id?: number }).listing_id ?? 0);
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
  const [expanded, setExpanded] = useState(false);
  const [trackUrls, setTrackUrls] = useState<Record<number, string>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    setTab(initialTab);
    setExpanded(false);
  }, [initialTab]);

  useEffect(() => {
    let cancelled = false;
    const pairs = rows
      .map((row) => ({
        programId: row.program.id,
        listingId: campaignListingId(row.program),
      }))
      .filter((p) => p.listingId > 0);

    if (pairs.length === 0) {
      setTrackUrls({});
      return;
    }

    Promise.all(
      pairs.map(async ({ programId, listingId }) => {
        try {
          const res = await fetchTrackLink(listingId);
          return [programId, res.tracked_url] as const;
        } catch {
          return null;
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      const next: Record<number, string> = {};
      for (const item of results) {
        if (item) next[item[0]] = item[1];
      }
      setTrackUrls(next);
    });

    return () => {
      cancelled = true;
    };
  }, [rows]);

  const filtered = useMemo(
    () => rows.filter((row) => campaignTab(row).includes(tab)),
    [rows, tab],
  );

  const visible = expanded ? filtered : filtered.slice(0, previewLimit);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">Live campaigns</h2>
          <p className="mt-1 text-xs text-slate-500">
            Category-wise active programs you can promote.
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
              const shareUrl = trackUrls[p.id] ?? "";
              return (
                <li
                  key={p.id}
                  className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                >
                  <h3 className="line-clamp-2 font-bold text-[#172b63]">{p.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {model} {formatMoney(Number(p.rate_usd), currency)} /{" "}
                    {rateUnit(String(p.pricing_model))}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    <Link
                      href="/creator/campaigns"
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
                    >
                      View more
                    </Link>
                    {shareUrl ? (
                      <ShareLinkButton url={shareUrl} title={p.title} />
                    ) : null}
                    <button
                      type="button"
                      disabled={!shareUrl}
                      onClick={() => {
                        void navigator.clipboard.writeText(shareUrl);
                        setCopiedId(p.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="inline-flex items-center gap-1 rounded-full bg-[#172b63] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {copiedId === p.id ? (
                        <>
                          <Check size={14} /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copy link
                        </>
                      )}
                    </button>
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
