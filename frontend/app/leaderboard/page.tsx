"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import PageHero from "@/components/layout/PageHero";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { getApiBaseUrl } from "@/lib/config";
import { creatorProfilePath } from "@/lib/staticExport";

type Row = {
  rank: number;
  handle: string;
  trust_tier: string;
  verified_clicks_30d: number;
  earnings_usd_30d?: number;
};

const podiumTint = [
  "from-amber-100 to-amber-50 text-amber-700 ring-amber-200",
  "from-slate-100 to-slate-50 text-slate-600 ring-slate-200",
  "from-orange-100 to-orange-50 text-orange-700 ring-orange-200",
];

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/api/v1/public/leaderboard`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setRows(j.data.leaderboard ?? []);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const top = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <>
      <PageHero
        compact
        eyebrow="Leaderboard"
        title="Creator leaderboard"
        description="Top creators by verified clicks in the last 30 days."
        primary={{ label: "Join as a creator", href: "/creator/register" }}
      />

      <section className="bg-[#F7F8FC] px-4 pb-20 pt-10 sm:px-8 sm:pb-28 sm:pt-14">
        <div className="mx-auto w-full max-w-3xl">
          {loading ? (
            <ListSkeleton rows={6} />
          ) : rows.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                <Trophy size={26} />
              </span>
              <p className="mt-5 text-lg font-bold text-[#0F1B3D]">No ranked creators yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                Rankings appear once creators start earning verified clicks.
              </p>
            </div>
          ) : (
            <>
              <ul className="grid gap-4 sm:grid-cols-3">
                {top.map((r, i) => (
                  <li
                    key={r.handle}
                    className="rounded-3xl border border-slate-200/80 bg-white p-6 text-center shadow-[0_1px_2px_rgba(15,27,61,0.04),0_18px_40px_-30px_rgba(15,27,61,0.25)]"
                  >
                    <span
                      className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-lg font-bold ring-1 ${podiumTint[i]}`}
                    >
                      {r.rank}
                    </span>
                    <Link
                      href={creatorProfilePath(r.handle)}
                      className="mt-4 block truncate font-semibold text-[#0F1B3D] hover:text-violet-600"
                    >
                      @{r.handle}
                    </Link>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {r.trust_tier}
                    </p>
                    <p className="mt-4 text-2xl font-bold tabular-nums text-[#0F1B3D]">
                      {r.verified_clicks_30d.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">verified clicks</p>
                    {typeof r.earnings_usd_30d === "number" ? (
                      <p className="mt-2 text-xs font-semibold text-emerald-700">
                        ${r.earnings_usd_30d.toFixed(2)}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>

              {rest.length > 0 ? (
                <ol className="mt-5 space-y-3">
                  {rest.map((r) => (
                    <li
                      key={r.handle}
                      className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,27,61,0.04)]"
                    >
                      <span className="w-8 text-center text-sm font-bold text-violet-600">#{r.rank}</span>
                      <Link
                        href={creatorProfilePath(r.handle)}
                        className="min-w-0 flex-1 truncate font-semibold text-[#0F1B3D] hover:text-violet-600"
                      >
                        @{r.handle}
                      </Link>
                      <span className="hidden text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:block">
                        {r.trust_tier}
                      </span>
                      <span className="text-right text-sm font-bold tabular-nums text-[#0F1B3D]">
                        {r.verified_clicks_30d.toLocaleString()} clicks
                        {typeof r.earnings_usd_30d === "number" ? (
                          <span className="mt-0.5 block text-xs font-semibold text-emerald-700">
                            ${r.earnings_usd_30d.toFixed(2)}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </>
          )}
        </div>
      </section>
    </>
  );
}
