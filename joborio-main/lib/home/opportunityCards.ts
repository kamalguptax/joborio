import type { Listing } from "@/lib/api/types";
import type { SyndicatedJob } from "@/lib/api/syndication";
import { fetchListings } from "@/lib/api/listings";
import { fetchPublicXmlJobs } from "@/lib/syndication/publicXmlFeed";
import { companyName } from "@/lib/jobs/companyName";
import { listingJobPath, syndicatedJobPath } from "@/lib/staticExport";

/** Category badge on opportunity cards (Hiring / Course / Tools). */
export type OpportunityCategory = "hiring" | "course" | "tools";

export type HomeOpportunityCard = {
  id: string;
  company: string;
  initial: string;
  logoColor: string;
  /** Category for badge — not employment type. */
  category: OpportunityCategory;
  title: string;
  location: string;
  /** Employment / engagement label (Full-time, Remote, etc.). */
  type: string;
  tags: string[];
  match: number;
  endsIn: string;
  href: string;
};

export const CATEGORY_BADGE: Record<
  OpportunityCategory,
  { label: string; className: string }
> = {
  hiring: {
    label: "Hiring",
    className: "bg-violet-50 text-violet-700 ring-1 ring-violet-200/80",
  },
  course: {
    label: "Course",
    className: "bg-sky-50 text-sky-700 ring-1 ring-sky-200/80",
  },
  tools: {
    label: "Tools",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80",
  },
};

const logoColors = [
  "text-blue-700",
  "text-blue-500",
  "text-violet-600",
  "text-indigo-600",
];

function matchScore(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 97;
  return 88 + (h % 12);
}

export function postedAgo(value?: string | null): string {
  if (!value) return "Posted recently";
  const raw = value.trim();
  const iso = raw.includes("T") ? raw : raw.replace(" ", "T");
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(iso);
  const parsed = Date.parse(hasZone ? iso : `${iso}Z`);
  if (Number.isNaN(parsed)) return "Posted recently";
  const minutes = Math.max(0, Math.floor((Date.now() - parsed) / 60000));
  if (minutes < 1) return "Posted just now";
  if (minutes < 60) {
    return `Posted ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Posted ${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.floor(hours / 24);
  return `Posted ${days} day${days === 1 ? "" : "s"} ago`;
}

function companyInitial(company: string): string {
  const c = company.trim();
  return (c[0] || "J").toUpperCase();
}

/** Map raw type/category/title text → hiring | course | tools. */
export function mapOpportunityCategory(
  ...parts: Array<string | null | undefined>
): OpportunityCategory {
  const hay = parts.filter(Boolean).join(" ").toLowerCase();

  if (
    /\b(course|courses|learn|learning|training|bootcamp|tutorial|class|classes|education|edtech)\b/.test(
      hay,
    )
  ) {
    return "course";
  }

  if (
    /\b(tool|tools|software|saas|app|apps|plugin|resource|resources|platform|utility|extension)\b/.test(
      hay,
    )
  ) {
    return "tools";
  }

  // Jobs, campaigns, hiring, default
  return "hiring";
}

export function mapSyndicatedJob(
  job: SyndicatedJob,
  index: number,
): HomeOpportunityCard {
  const tags = [job.category, job.jobtype, job.experience]
    .filter(Boolean)
    .slice(0, 3) as string[];
  return {
    id: `synd-${job.reference_id}`,
    company: companyName(job.company, "Partner"),
    initial: companyInitial(companyName(job.company, "P")),
    logoColor: logoColors[index % logoColors.length],
    category: mapOpportunityCategory(
      job.category,
      job.jobtype,
      job.title,
      ...tags,
    ),
    title: job.title,
    location: job.location_label || job.location || job.country || "Remote",
    type: job.jobtype || "Full-time",
    tags: tags.length ? tags : ["Opportunity"],
    match: matchScore(job.reference_id),
    endsIn: postedAgo(job.publishdate),
    href: syndicatedJobPath(job.reference_id),
  };
}

export function mapListing(listing: Listing, index: number): HomeOpportunityCard {
  const tags = [
    listing.category,
    listing.type === "course"
      ? "Course"
      : listing.type === "tool"
        ? "Tools"
        : "Job",
  ]
    .filter(Boolean)
    .slice(0, 3) as string[];
  const loc =
    listing.location_label ||
    (listing.is_remote ? "Remote" : listing.country_code || "Global");

  const category =
    listing.type === "course"
      ? "course"
      : listing.type === "tool" || listing.type === "tools"
        ? "tools"
        : mapOpportunityCategory(listing.type, listing.category, listing.title);

  return {
    id: `listing-${listing.id}`,
    company: listing.company_name || "JobOrio",
    initial: companyInitial(listing.company_name || "J"),
    logoColor: logoColors[index % logoColors.length],
    category,
    title: listing.title,
    location: loc,
    type:
      listing.type === "course"
        ? "Course"
        : listing.type === "tool" || listing.type === "tools"
          ? "Tools"
          : "Full-time",
    tags: tags.length ? tags : ["Verified"],
    match: matchScore(String(listing.id)),
    endsIn: "Posted recently",
    href: listingJobPath(listing.id),
  };
}

function within<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function fetchHomeOpportunities(
  limit = 12,
): Promise<HomeOpportunityCard[]> {
  const [syndication, listings] = await Promise.all([
    within(fetchPublicXmlJobs({ per_page: limit, page: 1 }), 20000).catch(() => null),
    within(fetchListings({ per_page: limit, page: 1 }), 20000).catch(() => null),
  ]);

  const cards: HomeOpportunityCard[] = [];
  let i = 0;

  if (listings?.data?.length) {
    for (const row of listings.data) {
      if (row.status && row.status !== "active") continue;
      cards.push(mapListing(row, i++));
    }
  }

  if (!syndication?.success && cards.length === 0) {
    throw new Error("LIVE_FEED");
  }

  const feed = syndication?.success ? syndication.jobs : [];
  for (const job of feed) {
    cards.push(mapSyndicatedJob(job, i++));
  }

  const seen = new Set<string>();
  const unique = cards.filter((c) => {
    const key = `${c.title}|${c.company}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.slice(0, limit);
}

/**
 * Pick `count` cards for the home slider, mixing categories (hiring / course / tools)
 * round-robin. If a category has no cards, the remaining slots are filled from the
 * categories that do, so a single-category feed still yields `count` cards.
 */
export function mixOpportunitiesByCategory(
  cards: HomeOpportunityCard[],
  count = 6,
): HomeOpportunityCard[] {
  const order: OpportunityCategory[] = ["hiring", "course", "tools"];
  const buckets = new Map<OpportunityCategory, HomeOpportunityCard[]>(
    order.map((c) => [c, []]),
  );
  for (const card of cards) buckets.get(card.category)?.push(card);

  const picked: HomeOpportunityCard[] = [];
  while (picked.length < count) {
    let added = false;
    for (const cat of order) {
      const next = buckets.get(cat)?.shift();
      if (next) {
        picked.push(next);
        added = true;
        if (picked.length >= count) break;
      }
    }
    if (!added) break;
  }
  return picked;
}

/**
 * Typed browse for /courses, /campaigns, /marketplace.
 * Uses DB listings (?type=) and, when useful, category matches from the live feed.
 */
export async function fetchTypedOpportunities(opts: {
  listingTypes?: string[];
  category?: OpportunityCategory;
  includeXmlCategoryMatches?: boolean;
  limit?: number;
}): Promise<HomeOpportunityCard[]> {
  const limit = opts.limit ?? 24;
  const cards: HomeOpportunityCard[] = [];
  let i = 0;

  const types = opts.listingTypes?.length ? opts.listingTypes : [undefined];
  await Promise.all(
    types.map(async (type) => {
      const res = await within(
        fetchListings({
          per_page: limit,
          page: 1,
          ...(type ? { type } : {}),
        }),
        20000,
      ).catch(() => null);
      for (const row of res?.data ?? []) {
        if (row.status && row.status !== "active") continue;
        cards.push(mapListing(row, i++));
      }
    }),
  );

  if (opts.includeXmlCategoryMatches && opts.category) {
    const home = await fetchHomeOpportunities(Math.max(limit, 40)).catch(() => []);
    for (const card of home) {
      if (card.category === opts.category) {
        cards.push(card);
      }
    }
  }

  const seen = new Set<string>();
  return cards
    .filter((c) => {
      const key = `${c.title}|${c.company}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}
