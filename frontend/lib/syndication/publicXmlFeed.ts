import type { SyndicatedJob } from "@/lib/api/syndication";
import { getAuthToken } from "@/lib/auth/session";
import { getApiBaseUrl } from "@/lib/config";

export type PublicJobsResponse = {
  success: boolean;
  jobs: SyndicatedJob[];
  meta: {
    page: number;
    per_page: number;
    has_more: boolean;
    total?: number;
    source: Record<string, unknown>;
  };
};

export async function fetchPublicXmlJobs(params?: {
  page?: number;
  per_page?: number;
  search?: string;
  promote_types?: string;
  for_creator?: boolean;
  auth?: boolean;
}): Promise<PublicJobsResponse> {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.per_page) q.set("per_page", String(params.per_page));
  if (params?.search) q.set("search", params.search);
  if (params?.promote_types) q.set("promote_types", params.promote_types);
  if (params?.for_creator) q.set("for_creator", "1");

  const token = params?.auth ? getAuthToken() : null;
  const res = await fetch(
    `${getApiBaseUrl()}/api/v1/syndication/vigyapanam/jobs?${q}`,
    {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new Error(`Public jobs API error (${res.status})`);
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error("Public jobs API returned an error");
  }

  const page = Number(json.meta?.current_page ?? params?.page ?? 1);
  const perPage = Number(json.meta?.per_page ?? params?.per_page ?? 24);
  const lastPage = Number(json.meta?.last_page ?? page);

  return {
    success: true,
    jobs: json.data?.jobs ?? [],
    meta: {
      page,
      per_page: perPage,
      has_more: page < lastPage,
      total: json.meta?.total,
      source: (json.data?.source as Record<string, unknown>) ?? {},
    },
  };
}

function referenceKeys(referenceId: string): string[] {
  const keys = [referenceId];
  const colon = referenceId.lastIndexOf(":");
  if (colon >= 0) {
    const raw = referenceId.slice(colon + 1);
    if (raw && raw !== referenceId) keys.push(raw);
  }
  return keys;
}

function sameJob(job: SyndicatedJob, referenceId: string): boolean {
  return referenceKeys(referenceId).some((key) =>
    referenceKeys(job.reference_id).includes(key),
  );
}

async function readJobList(url: string): Promise<{
  jobs: SyndicatedJob[];
  lastPage: number;
} | null> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json();
  if (!json.success) return null;
  return {
    jobs: (json.data?.jobs ?? []) as SyndicatedJob[],
    lastPage: Number(json.meta?.last_page ?? 1),
  };
}

export async function fetchPublicXmlJob(
  referenceId: string,
): Promise<SyndicatedJob | null> {
  const base = `${getApiBaseUrl()}/api/v1/syndication/vigyapanam/jobs`;
  const filtered = await readJobList(
    `${base}?${new URLSearchParams({
      reference_id: referenceId,
      per_page: "5",
    })}`,
  );
  const direct = filtered?.jobs.find((job) => sameJob(job, referenceId));
  if (direct) return direct;

  let page = 1;
  let lastPage = 1;
  do {
    const listed = await readJobList(
      `${base}?${new URLSearchParams({ per_page: "100", page: String(page) })}`,
    );
    if (!listed) return null;
    const found = listed.jobs.find((job) => sameJob(job, referenceId));
    if (found) return found;
    lastPage = listed.lastPage;
    page += 1;
  } while (page <= lastPage && page <= 30);

  return null;
}
