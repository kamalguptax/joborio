import type { JobMasterFilters } from "@/lib/api/jobMasters";
import { getApiBaseUrl } from "@/lib/config";

export type SyndicatedJob = {
  reference_id: string;
  title: string;
  company: string;
  location: string;
  state: string;
  country: string;
  postalcode: string;
  url: string;
  email: string;
  website: string;
  description_html: string;
  description_text: string;
  salary: string;
  education: string;
  jobtype: string;
  category: string;
  experience: string;
  publishdate: string;
  expirydate: string;
  location_label: string;
  is_sample?: boolean;
  ppc_rate_usd?: number;
};

export type SyndicationFilters = JobMasterFilters;

export type SyndicationQuery = {
  search?: string;
  category_id?: number;
  city_id?: number;
  state_id?: number;
  country_id?: number;
  company_id?: number;
  jobtype_id?: number;
  experience_id?: number;
  education_id?: number;
  page?: number;
  per_page?: number;
  group_by_category?: boolean;
};

type SyndicationResponse = {
  success: boolean;
  data: {
    jobs: SyndicatedJob[];
    grouped_by_category?: Record<string, SyndicatedJob[]> | null;
    filters: SyndicationFilters;
    source: {
      url?: string;
      publisher?: string;
      lastbuilddate?: string;
      error?: string;
      feed_note?: string;
      sample_fallback?: boolean;
    };
  };
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    total_in_feed?: number;
  };
};

export async function fetchSyndicatedJobs(
  query: SyndicationQuery = {}
): Promise<SyndicationResponse> {
  const q = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === "" || value === false) return;
    if (key === "group_by_category" && value === true) {
      q.set("group_by_category", "1");
      return;
    }
    q.set(key, String(value));
  });

  const url = `${getApiBaseUrl()}/api/v1/syndication/vigyapanam/jobs?${q}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    throw new Error(
      `Cannot reach API at ${getApiBaseUrl()}. Start the backend: cd backend && php artisan serve`,
    );
  }

  if (!res.ok) {
    throw new Error(`Syndication API error (${res.status}) at ${url}`);
  }

  return res.json();
}

export async function refreshSyndicationCache(): Promise<void> {
  await fetch(`${getApiBaseUrl()}/api/v1/syndication/vigyapanam/refresh`, {
    method: "POST",
    headers: { Accept: "application/json" },
  });
}

export async function fetchSyndicatedJob(
  referenceId: string
): Promise<SyndicatedJob | null> {
  const res = await fetch(
    `${getApiBaseUrl()}/api/v1/syndication/vigyapanam/jobs/${encodeURIComponent(referenceId)}`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json.success ? json.data : null;
}
