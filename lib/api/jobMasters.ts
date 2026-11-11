import { getApiBaseUrl } from "@/lib/config";

export type JobMasterRow = {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  code?: string | null;
};

export type JobMasterFilters = {
  country: JobMasterRow[];
  state: JobMasterRow[];
  city: JobMasterRow[];
  category: JobMasterRow[];
  job_type: JobMasterRow[];
  experience: JobMasterRow[];
  education: JobMasterRow[];
  company: JobMasterRow[];
};

export async function fetchJobMasterFilters(): Promise<JobMasterFilters> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/job-masters/filters`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to load job filters");
  }
  const json = await res.json();
  return json.success ? json.data : ({} as JobMasterFilters);
}
