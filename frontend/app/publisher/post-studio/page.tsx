"use client";

import { useEffect, useMemo, useState } from "react";
import PostStudioClient from "@/components/post-studio/PostStudioClient";
import { fetchMe } from "@/lib/api/auth";
import {
  fetchPublisherAssignments,
  fetchPublisherCommunities,
  fetchPublisherMarketplace,
  type MarketplaceCampaign,
  type PublisherAssignment,
} from "@/lib/api/publisher";
import type { SyndicatedJob } from "@/lib/api/syndication";
import { rememberPublicCode } from "@/lib/auth/session";
import { APP_URL } from "@/lib/config";
import { mapOpportunityCategory } from "@/lib/home/opportunityCards";
import { formatMoney } from "@/lib/money";
import {
  extractSkillsFromText,
  type PostStudioPick,
} from "@/lib/postStudio/templates";
import {
  fetchPublicXmlJob,
  fetchPublicXmlJobs,
} from "@/lib/syndication/publicXmlFeed";
import { shareDestinationUrl, shareJobUrl } from "@/lib/tracking/subid";

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

function refKeys(referenceId: string): string[] {
  const keys = [referenceId];
  const colon = referenceId.lastIndexOf(":");
  if (colon >= 0) {
    const raw = referenceId.slice(colon + 1);
    if (raw && raw !== referenceId) keys.push(raw);
  }
  return keys;
}

function matchesRef(job: SyndicatedJob, allowed: Set<string>): boolean {
  return refKeys(job.reference_id).some((k) => allowed.has(k));
}

/** Publisher / network tracked share — never /creator/ paths. */
function publisherShareUrl(
  publicCode: string,
  campaignId: number,
  destination?: string | null,
): string {
  const code = publicCode.trim();
  const dest = (destination || "").trim();
  if (code && dest.startsWith("https://")) {
    return shareDestinationUrl(code, dest, {
      title: undefined,
      referenceId: `campaign:${campaignId}`,
    });
  }
  const params = new URLSearchParams({
    code: code || "PUBLISHER",
    subid: code || "PUBLISHER",
    ref: `campaign:${campaignId}`,
  });
  return `${siteBase()}/go/?${params.toString()}`;
}

async function loadPublisherXmlJobs(
  communityRefs: string[],
): Promise<SyndicatedJob[]> {
  const allowed = new Set(communityRefs.flatMap((r) => refKeys(String(r))));
  const feed = await fetchPublicXmlJobs({
    per_page: 100,
    page: 1,
    auth: true,
  }).catch(() => null);

  const feedJobs = feed?.jobs ?? [];
  if (allowed.size === 0) {
    // No community XML picks yet — still show live feed so Post Studio is usable.
    return feedJobs;
  }

  const matched = feedJobs.filter((j) => matchesRef(j, allowed));
  const matchedKeys = new Set(
    matched.flatMap((j) => refKeys(j.reference_id)),
  );
  const missing = communityRefs
    .filter((ref) => !refKeys(ref).some((k) => matchedKeys.has(k)))
    .slice(0, 24);

  if (missing.length === 0) return matched;

  const extras = (
    await Promise.all(missing.map((ref) => fetchPublicXmlJob(ref).catch(() => null)))
  ).filter((j): j is SyndicatedJob => Boolean(j));

  const seen = new Set(matched.map((j) => j.reference_id));
  for (const job of extras) {
    if (seen.has(job.reference_id)) continue;
    seen.add(job.reference_id);
    matched.push(job);
  }
  return matched;
}

export default function PublisherPostStudioPage() {
  const [campaigns, setCampaigns] = useState<MarketplaceCampaign[]>([]);
  const [assignments, setAssignments] = useState<PublisherAssignment[]>([]);
  const [xmlJobs, setXmlJobs] = useState<SyndicatedJob[]>([]);
  const [publicCode, setPublicCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchPublisherMarketplace().catch(() => [] as MarketplaceCampaign[]),
      fetchPublisherAssignments().catch(() => [] as PublisherAssignment[]),
      fetchPublisherCommunities().catch(() => []),
      fetchMe()
        .then((u) => rememberPublicCode(u) || "")
        .catch(() => ""),
    ])
      .then(async ([c, a, communities, code]) => {
        setCampaigns(c);
        setAssignments(a);
        setPublicCode(code);

        const refs = communities.flatMap((row) =>
          Array.isArray(row.xml_job_refs) ? row.xml_job_refs : [],
        );
        const jobs = await loadPublisherXmlJobs(refs).catch(() => []);
        setXmlJobs(jobs);

        if (!c.length && !a.length && !jobs.length) {
          setError(
            "No campaigns or XML jobs yet. Assign campaigns in Marketplace, or attach XML jobs on Communities.",
          );
        } else {
          setError(null);
        }
      })
      .catch(() => setError("Could not load Post Studio data."))
      .finally(() => setLoading(false));
  }, []);

  const items = useMemo(() => {
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
        shareUrl: publisherShareUrl(publicCode, row.id, row.destination_url),
        company: row.employer || undefined,
        location: row.country_code || undefined,
        category: row.category || row.promotion_type || undefined,
        summary: row.employer
          ? `${row.employer} is hiring skilled professionals to join its team.`
          : undefined,
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
        shareUrl: publisherShareUrl(
          publicCode,
          programId,
          a.destination_url,
        ),
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
      const location = job.location_label || job.location || "";
      out.push({
        id: `xml-${job.reference_id}`,
        title: job.title,
        subtitle: [job.company, location, "XML job"].filter(Boolean).join(" · "),
        badge,
        rateText: `${formatMoney(rate)} / click`,
        shareUrl: shareJobUrl(publicCode, job.reference_id),
        company: job.company || undefined,
        location: location || undefined,
        experience: job.experience || undefined,
        qualification: job.education || undefined,
        salary: job.salary || undefined,
        jobType: job.jobtype || undefined,
        category: job.category || undefined,
        skills: extractSkillsFromText(job.description_text),
        summary: job.company
          ? `${job.company} is looking for skilled professionals${location ? ` in ${location}` : ""} to join the team.`
          : undefined,
      });
    }

    return out;
  }, [campaigns, assignments, xmlJobs, publicCode]);

  return (
    <PostStudioClient
      items={items}
      loading={loading}
      error={error}
      audienceLabel="publishers"
      emptyHint="Assign campaigns in Marketplace, or attach XML jobs on Communities. Use the Jobs filter to find XML listings. Links use your publisher tracking id (not /creator/)."
    />
  );
}
