"use client";

import { useEffect, useMemo, useState } from "react";
import PostStudioClient from "@/components/post-studio/PostStudioClient";
import { fetchMe } from "@/lib/api/auth";
import {
  fetchCreatorCampaigns,
  fetchTrackLink,
  type CreatorCampaignRow,
} from "@/lib/api/creator";
import type { SyndicatedJob } from "@/lib/api/syndication";
import { rememberPublicCode } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { mapOpportunityCategory } from "@/lib/home/opportunityCards";
import type { PostStudioPick } from "@/lib/postStudio/templates";
import { fetchPublicXmlJobs } from "@/lib/syndication/publicXmlFeed";
import { shareJobUrl } from "@/lib/tracking/subid";

function campaignListingId(program: CreatorCampaignRow["program"]): number {
  const nested = Number(program.listing?.id ?? 0);
  if (nested > 0) return nested;
  return Number((program as { listing_id?: number }).listing_id ?? 0);
}

function rateWord(model: string): string {
  if (model === "ppc") return "click";
  if (model === "ppr") return "signup";
  if (model === "ppe") return "engagement";
  return "application";
}

export default function CreatorPostStudioPage() {
  const [campaigns, setCampaigns] = useState<CreatorCampaignRow[]>([]);
  const [xmlJobs, setXmlJobs] = useState<SyndicatedJob[]>([]);
  const [publicCode, setPublicCode] = useState<string | null>(null);
  const [trackUrls, setTrackUrls] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchCreatorCampaigns().catch(() => [] as CreatorCampaignRow[]),
      fetchPublicXmlJobs({
        per_page: 48,
        page: 1,
        auth: true,
        for_creator: true,
      }).catch(() => null),
      fetchMe()
        .then((user) => rememberPublicCode(user))
        .catch(() => null),
    ])
      .then(([camp, xml, code]) => {
        setCampaigns(camp);
        setXmlJobs(xml?.jobs ?? []);
        setPublicCode(code);
        if (!camp.length && !(xml?.jobs?.length ?? 0)) {
          setError("No campaigns or jobs yet. Open Opportunities first.");
        }
      })
      .catch(() => setError("Could not load Post Studio data."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const pairs = campaigns
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
  }, [campaigns]);

  const items = useMemo(() => {
    const out: PostStudioPick[] = [];

    for (const row of campaigns) {
      const p = row.program;
      const model = String(p.pricing_model ?? "ppc").toLowerCase();
      const promo = String(p.promotion_type ?? "job").toLowerCase();
      const badge =
        promo === "course"
          ? "Course"
          : promo === "tool"
            ? "Tools"
            : model.toUpperCase();
      const url =
        trackUrls[p.id] ||
        (typeof p.post_url === "string" && p.post_url ? p.post_url : "");
      if (!url) continue;
      out.push({
        id: `camp-${p.id}`,
        title: p.title,
        subtitle: `${badge} campaign`,
        badge,
        rateText: `${formatMoney(Number(p.rate_usd ?? 0))} / ${rateWord(model)}`,
        shareUrl: url,
      });
    }

    for (const job of xmlJobs) {
      if (!publicCode) continue;
      const cat = mapOpportunityCategory(
        job.category,
        job.jobtype,
        job.title,
        job.description_text,
      );
      const badge =
        cat === "course" ? "Course" : cat === "tools" ? "Tools" : "Job";
      const rate = Number(job.ppc_rate_usd ?? 0.01);
      out.push({
        id: `xml-${job.reference_id}`,
        title: job.title,
        subtitle: [job.company, job.location_label || job.location]
          .filter(Boolean)
          .join(" · "),
        badge,
        rateText: `${formatMoney(rate)} / click`,
        shareUrl: shareJobUrl(publicCode, job.reference_id),
      });
    }

    return out;
  }, [campaigns, xmlJobs, publicCode, trackUrls]);

  return (
    <PostStudioClient
      items={items}
      loading={loading}
      error={error}
      audienceLabel="creators"
      emptyHint="Join or open Opportunities to load PPC, PPR, courses, and jobs here."
    />
  );
}
