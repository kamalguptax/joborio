export const PROMOTE_JOB_TYPES = [
  { id: "full_time", label: "Full time" },
  { id: "part_time", label: "Part time" },
  { id: "internship", label: "Internship" },
  { id: "fresher", label: "Fresher" },
  { id: "contract", label: "Contract" },
] as const;

export type PromoteJobTypeId = (typeof PROMOTE_JOB_TYPES)[number]["id"];

const NEEDLES: Record<PromoteJobTypeId, string[]> = {
  full_time: ["full-time", "full time", "fulltime"],
  part_time: ["part-time", "part time", "parttime"],
  internship: ["internship", "intern"],
  fresher: ["fresher", "freshers", "entry level", "entry-level", "0-1 year", "0 year", "graduate", "campus"],
  contract: ["contract"],
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
