"use client";

import PageHero from "@/components/layout/PageHero";
import CreatorLeaderboardBoard from "@/components/leaderboard/CreatorLeaderboardBoard";

export default function LeaderboardPage() {
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
        <CreatorLeaderboardBoard />
      </section>
    </>
  );
}
