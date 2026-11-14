"use client";

import { useEffect, useState } from "react";
import OpportunityDrops, {
  FALLBACK_OPPORTUNITIES,
  type Opportunity,
} from "@/components/Opportunitydrops";
import type { SyndicatedJob } from "@/lib/api/syndication";
import { fetchPublicXmlJobs } from "@/lib/syndication/publicXmlFeed";
import { companyName } from "@/lib/jobs/companyName";
import { syndicatedJobPath } from "@/lib/staticExport";

function daysUntilExpiry(expirydate?: string): number {
  if (!expirydate) return 7;
  const parsed = Date.parse(expirydate);
  if (Number.isNaN(parsed)) return 7;
  const diff = Math.ceil((parsed - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, Math.min(diff, 30));
}

function matchScore(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 97;
  return 88 + (h % 12);
}

function mapJob(job: SyndicatedJob): Opportunity {
  const tags = [job.category, job.jobtype].filter(Boolean) as string[];
  const payout = job.ppc_rate_usd ?? 0.03;
  return {
    id: job.reference_id,
    type: "Job",
    status: "High Demand",
    company: companyName(job.company, "Employer"),
    title: job.title,
    location: job.location_label || job.country || "Remote",
    tags: tags.length ? tags.slice(0, 2) : ["General"],
    payout,
    currencySymbol: "$",
    unit: "qualified click",
    match: matchScore(job.reference_id),
    endsInDays: daysUntilExpiry(job.expirydate),
    href: syndicatedJobPath(job.reference_id),
  };
}

export default function HomeOpportunityDrops() {
  const [items, setItems] = useState<Opportunity[]>(FALLBACK_OPPORTUNITIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicXmlJobs({ per_page: 6, page: 1 })
      .then((res) => {
        if (res.success && res.jobs.length > 0) {
          setItems(res.jobs.map(mapJob));
        }
      })
      .catch(() => {
        /* keep fallback */
      })
      .finally(() => setLoading(false));
  }, []);

  return <OpportunityDrops items={items} loading={loading} />;
}
