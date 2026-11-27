"use client";

import { useEffect, useState } from "react";
import CreatorLeaderboardBoard from "@/components/leaderboard/CreatorLeaderboardBoard";
import { fetchMe } from "@/lib/api/auth";
import PageHeader from "@/components/layout/PageHeader";

export default function CreatorTopPerformersPage() {
  const [handle, setHandle] = useState<string | null>(null);

  useEffect(() => {
    fetchMe()
      .then((u) => setHandle(u.creator?.handle ?? null))
      .catch(() => setHandle(null));
  }, []);

  return (
    <>
      <PageHeader title="Top performers" />
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-amber-700">
          Leaderboard
        </p>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Top creators by verified clicks in the last 30 days. Other creators&apos;
          names stay hidden.
        </p>
      </div>

      <CreatorLeaderboardBoard blurOthers currentHandle={handle} />
    </>
  );
}
