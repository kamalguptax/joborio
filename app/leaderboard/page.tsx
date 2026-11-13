"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getApiBaseUrl } from "@/lib/config";
import { creatorProfilePath } from "@/lib/staticExport";

type Row = {
  rank: number;
  handle: string;
  trust_tier: string;
  verified_clicks_30d: number;
  earnings_usd_30d?: number;
};

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/api/v1/public/leaderboard`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setRows(j.data.leaderboard ?? []);
      })
      .catch(() => setRows([]));
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-3xl font-bold">Creator leaderboard</h1>
      <p className="mt-2 text-slate-600">
        Top creators by verified clicks in the last 30 days (Module H / retention).
      </p>
      <ol className="mt-8 space-y-3">
        {rows.map((r) => (
          <li
            key={r.handle}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
          >
            <span className="font-bold text-purple-600">#{r.rank}</span>
            <Link href={creatorProfilePath(r.handle)} className="font-semibold hover:text-purple-600">
              @{r.handle}
            </Link>
            <span className="text-xs uppercase text-slate-400">{r.trust_tier}</span>
            <span className="text-right text-sm font-bold tabular-nums">
              {r.verified_clicks_30d} clicks
              {typeof r.earnings_usd_30d === "number" ? (
                <span className="mt-0.5 block text-xs font-semibold text-emerald-700">
                  ${r.earnings_usd_30d.toFixed(2)}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No ranked creators yet.</p>
      ) : null}
    </main>
  );
}
