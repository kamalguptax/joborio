export const OPPORTUNITY_CATEGORIES = [
  { id: "jobs", label: "Jobs" },
  { id: "courses", label: "Courses" },
  { id: "bootcamps", label: "Bootcamps" },
  { id: "hackathons", label: "Hackathons" },
  { id: "ai_tools", label: "AI Tools" },
  { id: "saas", label: "SaaS" },
  { id: "other", label: "Other" },
] as const;

export type OpportunityCategoryId =
  (typeof OPPORTUNITY_CATEGORIES)[number]["id"];

export type OpportunityPreferenceKey =
  | "salary"
  | "experience"
  | "duration"
  | "education"
  | "skills";

/** Which Opportunity Preference filters appear for each category. */
export const PREFERENCE_KEYS_BY_CATEGORY: Record<
  OpportunityCategoryId,
  OpportunityPreferenceKey[]
> = {
  jobs: ["salary", "experience", "education", "skills"],
  courses: ["duration", "experience", "education", "skills"],
  bootcamps: ["duration", "experience", "education", "skills"],
  hackathons: ["duration", "experience", "skills"],
  ai_tools: ["skills"],
  saas: ["skills"],
  other: ["education", "skills"],
};

export const EXPERIENCE_LEVELS = [
  { id: "entry", label: "Entry" },
  { id: "junior", label: "Junior" },
  { id: "mid", label: "Mid" },
  { id: "senior", label: "Senior" },
  { id: "lead", label: "Lead" },
  { id: "executive", label: "Executive" },
] as const;

export const WORK_MODES = [
  { id: "onsite", label: "On-site" },
  { id: "hybrid", label: "Hybrid" },
  { id: "remote", label: "Remote" },
  { id: "work_from_home", label: "Work from home" },
] as const;

export const CURRENCIES = ["USD", "INR", "AED", "GBP", "EUR"] as const;

export function visiblePreferenceKeys(
  categories: string[],
): OpportunityPreferenceKey[] {
  const keys: OpportunityPreferenceKey[] = [];
  for (const cat of categories) {
    const list =
      PREFERENCE_KEYS_BY_CATEGORY[cat as OpportunityCategoryId] ?? [];
    for (const key of list) {
      if (!keys.includes(key)) keys.push(key);
    }
  }
  return keys;
}

export function parseChipInput(raw: string): string[] {
  return raw
    .split(/[,|]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 40);
}
