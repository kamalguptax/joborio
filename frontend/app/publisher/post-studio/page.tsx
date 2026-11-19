"use client";

import { useEffect, useMemo, useState } from "react";
import PostStudioClient from "@/components/post-studio/PostStudioClient";
import {
  fetchPublisherAssignments,
  fetchPublisherMarketplace,
  type MarketplaceCampaign,
  type PublisherAssignment,
} from "@/lib/api/publisher";
import { APP_URL } from "@/lib/config";
import { formatMoney } from "@/lib/money";
import type { PostStudioPick } from "@/lib/postStudio/templates";

function siteBase(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }
  return (APP_URL || "https://joborio.com").replace(/\/$/, "");
}

function rateWord(model: string): string {
  const m = model.toLowerCase();
  if (m === "ppc") return "click";
  if (m === "ppr") return "signup";
  if (m === "ppe") return "engagement";
  return "application";
}

function campaignBadge(row: {
  pricing_model?: string | null;
  promotion_type?: string | null;
}): string {
  const promo = String(row.promotion_type ?? "").toLowerCase();
  if (promo === "course") return "Course";
  if (promo === "tool") return "Tools";
  const model = String(row.pricing_model ?? "ppc").toUpperCase();
  return model || "Campaign";
}

export default function PublisherPostStudioPage() {
  const [campaigns, setCampaigns] = useState<MarketplaceCampaign[]>([]);
  const [assignments, setAssignments] = useState<PublisherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchPublisherMarketplace().catch(() => [] as MarketplaceCampaign[]),
      fetchPublisherAssignments().catch(() => [] as PublisherAssignment[]),
    ])
      .then(([c, a]) => {
        setCampaigns(c);
        setAssignments(a);
        if (!c.length && !a.length) {
          setError("No marketplace campaigns yet. Open Campaign Marketplace first.");
        }
      })
      .catch(() => setError("Could not load Post Studio data."))
      .finally(() => setLoading(false));
  }, []);

  const items = useMemo(() => {
    const base = siteBase();
    const out: PostStudioPick[] = [];
    const seen = new Set<number>();

    for (const row of campaigns) {
      seen.add(row.id);
      const model = String(row.pricing_model ?? "ppc").toLowerCase();
      const badge = campaignBadge(row);
      out.push({
        id: `mkt-${row.id}`,
        title: row.title,
        subtitle: row.employer
          ? `${row.employer} · marketplace`
          : "Marketplace campaign",
        badge,
        rateText: `${formatMoney(Number(row.rate_usd ?? 0))} / ${rateWord(model)}`,
        shareUrl: `${base}/creator/opportunities/?campaign=${row.id}`,
      });
    }

    for (const a of assignments) {
      const programId = Number(a.program?.id ?? 0);
      if (!programId || seen.has(programId)) continue;
      seen.add(programId);
      const model = String(
        a.pricing_model ?? a.program?.pricing_model ?? "ppc",
      ).toLowerCase();
      const title = a.program?.title ?? `Campaign #${programId}`;
      const rate = Number(a.accepted_rate_usd ?? 0);
      out.push({
        id: `asn-${a.id}`,
        title,
        subtitle: a.community?.name
          ? `Assigned · ${a.community.name}`
          : "Assigned campaign",
        badge: model.toUpperCase(),
        rateText: rate
          ? `${formatMoney(rate)} / ${rateWord(model)}`
          : undefined,
        shareUrl: `${base}/creator/opportunities/?campaign=${programId}`,
      });
    }

    return out;
  }, [campaigns, assignments]);

  return (
    <PostStudioClient
      items={items}
      loading={loading}
      error={error}
      audienceLabel="publishers"
      emptyHint="Assign campaigns in the marketplace, then generate posts here for your network."
    />
  );
}
