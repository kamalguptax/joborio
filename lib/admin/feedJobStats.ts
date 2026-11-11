export type FeedCountRow = { label: string; count: number };

export type FeedJobStats = {
  total: number;
  companies: number;
  categories: number;
  locations: number;
  states: number;
  countries: number;
  jobTypes: number;
  withEmail: number;
  samples: number;
  topCategories: FeedCountRow[];
  topLocations: FeedCountRow[];
  topCompanies: FeedCountRow[];
  topStates: FeedCountRow[];
  topCountries: FeedCountRow[];
  topJobTypes: FeedCountRow[];
  postedBuckets: FeedCountRow[];
};

function topCounts(
  jobs: Array<Record<string, unknown>>,
  key: string,
  limit = 8,
  fallback = "Unknown",
): FeedCountRow[] {
  const map = new Map<string, number>();
  for (const job of jobs) {
    const raw = String(job[key] ?? "").trim();
    const label = raw || fallback;
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function uniqueCount(jobs: Array<Record<string, unknown>>, key: string): number {
  const set = new Set<string>();
  for (const job of jobs) {
    const v = String(job[key] ?? "").trim();
    if (v) set.add(v.toLowerCase());
  }
  return set.size;
}

function postedBuckets(jobs: Array<Record<string, unknown>>): FeedCountRow[] {
  const buckets = [
    { label: "Last 24h", maxHours: 24 },
    { label: "1–3 days", maxHours: 72 },
    { label: "3–7 days", maxHours: 168 },
    { label: "7–30 days", maxHours: 720 },
    { label: "Older / unknown", maxHours: Infinity },
  ];
  const counts = buckets.map(() => 0);
  const now = Date.now();

  for (const job of jobs) {
    const raw = String(job.publishdate ?? "").trim();
    const t = raw ? Date.parse(raw) : NaN;
    if (!Number.isFinite(t)) {
      counts[counts.length - 1] += 1;
      continue;
    }
    const hours = (now - t) / 36e5;
    let placed = false;
    for (let i = 0; i < buckets.length; i++) {
      if (hours <= buckets[i].maxHours) {
        counts[i] += 1;
        placed = true;
        break;
      }
    }
    if (!placed) counts[counts.length - 1] += 1;
  }

  return buckets.map((b, i) => ({ label: b.label, count: counts[i] }));
}

export function aggregateFeedJobs(
  jobs: Array<Record<string, unknown>>,
): FeedJobStats {
  return {
    total: jobs.length,
    companies: uniqueCount(jobs, "company"),
    categories: uniqueCount(jobs, "category"),
    locations: uniqueCount(jobs, "location"),
    states: uniqueCount(jobs, "state"),
    countries: uniqueCount(jobs, "country"),
    jobTypes: uniqueCount(jobs, "jobtype"),
    withEmail: jobs.filter((j) => String(j.email ?? "").trim()).length,
    samples: jobs.filter((j) => Boolean(j.is_sample)).length,
    topCategories: topCounts(jobs, "category"),
    topLocations: topCounts(jobs, "location_label", 8, "Remote / unknown"),
    topCompanies: topCounts(jobs, "company"),
    topStates: topCounts(jobs, "state"),
    topCountries: topCounts(jobs, "country"),
    topJobTypes: topCounts(jobs, "jobtype", 8, "Unspecified"),
    postedBuckets: postedBuckets(jobs),
  };
}
