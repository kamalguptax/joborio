export const PROMOTE_JOB_TYPES = [
  { id: "full_time", label: "Full time" },
  { id: "part_time", label: "Part time" },
  { id: "internship", label: "Internship" },
  { id: "remote", label: "Remote" },
  { id: "contract", label: "Contract" },
  { id: "work_from_home", label: "Work from home" },
] as const;

export type PromoteJobTypeId = (typeof PROMOTE_JOB_TYPES)[number]["id"];

const NEEDLES: Record<PromoteJobTypeId, string[]> = {
  full_time: ["full-time", "full time", "fulltime"],
  part_time: ["part-time", "part time", "parttime"],
  internship: ["internship", "intern"],
  remote: ["remote"],
  contract: ["contract"],
  work_from_home: ["work from home", "work-from-home", "wfh"],
};

const STORAGE_KEY = "joborio_promote_job_types";

export function isPromoteJobType(value: string): value is PromoteJobTypeId {
  return PROMOTE_JOB_TYPES.some((type) => type.id === value);
}

export function readPromoteJobTypes(): PromoteJobTypeId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]") as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.filter((id): id is PromoteJobTypeId => typeof id === "string" && isPromoteJobType(id));
  } catch {
    return [];
  }
}

export function savePromoteJobTypes(ids: string[]) {
  const clean = ids.filter(isPromoteJobType);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
}

export function jobMatchesPromoteTypes(
  haystack: string,
  types: string[],
): boolean {
  const selected = types.filter(isPromoteJobType);
  if (selected.length === 0) return true;
  const text = haystack.toLowerCase();
  return selected.some((id) => NEEDLES[id].some((needle) => text.includes(needle)));
}
