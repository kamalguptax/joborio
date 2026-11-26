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
import {
  extractSkillsFromText,
  type PostStudioPick,
} from "@/lib/postStudio/templates";
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
    setError(null);
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
      .then(async ([camp, xml, code]) => {
        setCampaigns(camp);
        setPublicCode(code);

        let jobs = xml?.jobs ?? [];
        // If preference filtering returned nothing, fall back to the live feed
        // so Jobs tab is not blank when niches are narrow or feed just refreshed.
        if (jobs.length === 0) {
          const fallback = await fetchPublicXmlJobs({
            per_page: 48,
            page: 1,
            auth: true,
            for_creator: false,
          }).catch(() => null);
          jobs = fallback?.jobs ?? [];
        }
        setXmlJobs(jobs);

        if (!camp.length && jobs.length === 0) {
          setError(
            "No campaigns or jobs yet. Set niches in Job Preferences, or open Campaigns.",
          );
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
        category: promo,
        summary:
          promo === "course"
            ? `Explore this ${badge.toLowerCase()} opportunity and grow your skills with a tracked JobOrio link.`
            : "Open role / campaign worth sharing with your audience.",
      });
    }

    for (const job of xmlJobs) {
      const cat = mapOpportunityCategory(
        job.category,
        job.jobtype,
        job.title,
        job.description_text,
      );
      // Jobs tab matches badge "Job"; keep XML listings there even when
      // category heuristics lean course/tools.
      const badge = "Job";
      const rate = Number(job.ppc_rate_usd ?? 0.01);
      const location = job.location_label || job.location || "";
      const code = publicCode || "CREATOR";
      out.push({
        id: `xml-${job.reference_id}`,
        title: job.title,
        subtitle: [job.company, location].filter(Boolean).join(" · "),
        badge,
        rateText: `${formatMoney(rate)} / click`,
        shareUrl: shareJobUrl(code, job.reference_id),
        company: job.company || undefined,
        location: location || undefined,
        experience: job.experience || undefined,
        qualification: job.education || undefined,
        salary: job.salary || undefined,
        jobType: job.jobtype || undefined,
        category: job.category || cat || undefined,
        skills: extractSkillsFromText(job.description_text),
        summary: job.company
          ? `${job.company} is looking for skilled professionals${location ? ` in ${location}` : ""} to join the team.`
          : undefined,
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
      emptyHint="No jobs matched your filters. Set niches in Job Preferences, or open Campaigns — the XML feed also refreshes on a schedule."
    />
  );
}
