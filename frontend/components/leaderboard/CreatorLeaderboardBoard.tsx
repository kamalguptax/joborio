"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { getApiBaseUrl } from "@/lib/config";
import { creatorProfilePath } from "@/lib/staticExport";

export type LeaderboardRow = {
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

type Props = {
  /** Hide other creators' handles (creator dashboard privacy). */
  blurOthers?: boolean;
  currentHandle?: string | null;
};

export default function CreatorLeaderboardBoard({
  blurOthers = false,
  currentHandle = null,
}: Props) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
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
  const you = (currentHandle || "").replace(/^@/, "").toLowerCase();

  function renderHandle(r: LeaderboardRow, className = "") {
    const isYou = you !== "" && r.handle.toLowerCase() === you;
    if (blurOthers && !isYou) {
      return (
        <span
          className={`inline-block truncate font-semibold text-[#0F1B3D] blur-[5px] select-none ${className}`}
          title="Hidden on leaderboard"
          aria-label="Creator name hidden"
        >
          @{r.handle}
        </span>
      );
    }
    if (isYou) {
      return (
        <span className={`truncate font-semibold text-violet-700 ${className}`}>
          @{r.handle}
          <span className="ml-1 text-[10px] font-bold uppercase">you</span>
        </span>
      );
    }
    return (
      <Link
        href={creatorProfilePath(r.handle)}
        className={`truncate font-semibold text-[#0F1B3D] hover:text-violet-600 ${className}`}
      >
        @{r.handle}
      </Link>
    );
  }

  if (loading) return <ListSkeleton rows={6} />;

  if (rows.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
          <Trophy size={26} />
        </span>
        <p className="mt-5 text-lg font-bold text-[#0F1B3D]">
          No ranked creators yet
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
          Rankings appear once creators start earning verified clicks.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
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
            <div className="mt-4">{renderHandle(r, "block")}</div>
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
              <span className="w-8 text-center text-sm font-bold text-violet-600">
                #{r.rank}
              </span>
              <div className="min-w-0 flex-1">{renderHandle(r)}</div>
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
    </div>
  );
}
