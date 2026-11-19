export type LaunchOptionId =
  | "job_ppc"
  | "job_ppr"
  | "job_lead"
  | "course_ppc"
  | "course_ppr"
  | "course_ppa"
  | "tool_ppc"
  | "tool_ppr"
  | "tool_ppa"
  | "branding_ppc"
  | "branding_ppr"
  | "post_promote"
  | "other"
  /** @deprecated use course_ppr */
  | "courses"
  /** @deprecated use tool_ppc */
  | "tools"
  /** @deprecated use branding_ppc */
  | "branding";

export type LaunchCategoryId = "job" | "course" | "tool" | "branding_other";

export type LaunchOption = {
  id: LaunchOptionId;
  label: string;
  description: string;
  pricing_model: "ppc" | "ppr" | "ppa" | "ppe";
  promotion_type: "job" | "course" | "tool" | "branding" | "post_promote" | "other";
  defaultRate: string;
  defaultBudget: string;
};

export type LaunchCategory = {
  id: LaunchCategoryId;
  step: number;
  label: string;
  description: string;
  options: LaunchOption[];
};

/** Manual campaign types in required order: Jobs → Courses → Tools → Branding/other. */
export const LAUNCH_CATEGORIES: LaunchCategory[] = [
  {
    id: "job",
    step: 1,
    label: "Jobs",
    description: "Hire and job-listing campaigns for creators to promote.",
    options: [
      {
        id: "job_ppc",
        label: "Pay Per Click (Jobs)",
        description: "Pay when someone clicks the job link.",
        pricing_model: "ppc",
        promotion_type: "job",
        defaultRate: "0.05",
        defaultBudget: "500",
      },
      {
        id: "job_ppr",
        label: "Pay Per Signup / Registration",
        description: "Pay when a visitor completes signup or registration.",
        pricing_model: "ppr",
        promotion_type: "job",
        defaultRate: "0.30",
        defaultBudget: "800",
      },
      {
        id: "job_lead",
        label: "Pay Per Lead / Application",
        description: "Pay when a qualified lead or application is confirmed.",
        pricing_model: "ppa",
        promotion_type: "job",
        defaultRate: "1.00",
        defaultBudget: "2000",
      },
    ],
  },
  {
    id: "course",
    step: 2,
    label: "Courses",
    description: "Courses, bootcamps, and learning offers — PPC, PPR, or PPA.",
    options: [
      {
        id: "course_ppc",
        label: "Course · Pay Per Click",
        description: "Pay when someone clicks the course landing page.",
        pricing_model: "ppc",
        promotion_type: "course",
        defaultRate: "0.05",
        defaultBudget: "700",
      },
      {
        id: "course_ppr",
        label: "Course · Pay Per Signup",
        description: "Pay when a visitor registers or signs up for the course.",
        pricing_model: "ppr",
        promotion_type: "course",
        defaultRate: "0.35",
        defaultBudget: "1000",
      },
      {
        id: "course_ppa",
        label: "Course · Pay Per Lead / Enroll",
        description: "Pay when a qualified course lead or enrollment is confirmed.",
        pricing_model: "ppa",
        promotion_type: "course",
        defaultRate: "2.00",
        defaultBudget: "2000",
      },
    ],
  },
  {
    id: "tool",
    step: 3,
    label: "Tools",
    description: "SaaS, apps, and productivity tools — PPC, PPR, or PPA.",
    options: [
      {
        id: "tool_ppc",
        label: "Tool · Pay Per Click",
        description: "Promote a tool, app, or product landing page.",
        pricing_model: "ppc",
        promotion_type: "tool",
        defaultRate: "0.06",
        defaultBudget: "700",
      },
      {
        id: "tool_ppr",
        label: "Tool · Pay Per Signup",
        description: "Pay when a visitor signs up for the tool or trial.",
        pricing_model: "ppr",
        promotion_type: "tool",
        defaultRate: "0.40",
        defaultBudget: "1000",
      },
      {
        id: "tool_ppa",
        label: "Tool · Pay Per Lead",
        description: "Pay when a qualified product lead is confirmed.",
        pricing_model: "ppa",
        promotion_type: "tool",
        defaultRate: "3.00",
        defaultBudget: "2000",
      },
    ],
  },
  {
    id: "branding_other",
    step: 4,
    label: "Branding & other",
    description: "Brand awareness, post engagement (PPE), and custom promotions.",
    options: [
      {
        id: "branding_ppc",
        label: "Brand awareness · PPC",
        description: "Run branding and awareness with creators (per click).",
        pricing_model: "ppc",
        promotion_type: "branding",
        defaultRate: "0.04",
        defaultBudget: "1500",
      },
      {
        id: "branding_ppr",
        label: "Brand · Pay Per Signup",
        description: "Pay when visitors sign up from a brand campaign.",
        pricing_model: "ppr",
        promotion_type: "branding",
        defaultRate: "0.30",
        defaultBudget: "1200",
      },
      {
        id: "post_promote",
        label: "Promote a post · PPE",
        description:
          "Creators like, comment, and repost your LinkedIn / Instagram / X post.",
        pricing_model: "ppe",
        promotion_type: "post_promote",
        defaultRate: "0.50",
        defaultBudget: "500",
      },
      {
        id: "other",
        label: "Other promotion · PPC",
        description: "Any other branding or custom promotion type.",
        pricing_model: "ppc",
        promotion_type: "other",
        defaultRate: "0.05",
        defaultBudget: "500",
      },
    ],
  },
];

export const LAUNCH_OPTIONS: LaunchOption[] = LAUNCH_CATEGORIES.flatMap(
  (c) => c.options,
);

export function launchOptionById(id: LaunchOptionId): LaunchOption {
  return LAUNCH_OPTIONS.find((item) => item.id === id) ?? LAUNCH_OPTIONS[0];
}

export function launchCategoryForOption(id: LaunchOptionId): LaunchCategory {
  return (
    LAUNCH_CATEGORIES.find((c) => c.options.some((o) => o.id === id)) ??
    LAUNCH_CATEGORIES[0]
  );
}

export function launchOptionForProgram(
  promotionType: string,
  pricingModel: string,
): LaunchOption {
  return (
    LAUNCH_OPTIONS.find(
      (o) =>
        o.promotion_type === promotionType && o.pricing_model === pricingModel,
    ) ??
    LAUNCH_OPTIONS.find((o) => o.promotion_type === promotionType) ??
    LAUNCH_OPTIONS[0]
  );
}

/** Paid campaign models require a start + end window. */
export function pricingNeedsSchedule(
  pricingModel: string | undefined | null,
): boolean {
  return (
    pricingModel === "ppc" ||
    pricingModel === "ppr" ||
    pricingModel === "ppa" ||
    pricingModel === "ppe"
  );
}

export const LEAD_TYPE_OPTIONS = [
  { id: "application", label: "Application" },
  { id: "signup", label: "Signup" },
  { id: "form_fill", label: "Form Fill" },
  { id: "call", label: "Call" },
] as const;

export const REQUIRED_FIELD_OPTIONS = [
  { id: "name", label: "Name" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone" },
  { id: "resume", label: "Resume" },
  { id: "city", label: "City" },
  { id: "experience", label: "Experience" },
  { id: "linkedin", label: "LinkedIn" },
] as const;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatLocalDateTime(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function defaultCampaignSchedule(days = 30): {
  starts_at: string;
  ends_at: string;
} {
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  return {
    starts_at: formatLocalDateTime(start),
    ends_at: formatLocalDateTime(end),
  };
}

export function toLocalDateTimeInput(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return formatLocalDateTime(d);
}

/** @deprecated Prefer launchOptionById — kept for older call sites using "ppc" etc. */
export function resolveLegacyLaunchId(raw: string): LaunchOptionId {
  const map: Record<string, LaunchOptionId> = {
    ppc: "job_ppc",
    ppr: "job_ppr",
    lead: "job_lead",
    courses: "course_ppr",
    course_ppc: "course_ppc",
    course_ppr: "course_ppr",
    course_ppa: "course_ppa",
    branding: "branding_ppc",
    branding_ppc: "branding_ppc",
    branding_ppr: "branding_ppr",
    post_promote: "post_promote",
    tools: "tool_ppc",
    tool_ppc: "tool_ppc",
    tool_ppr: "tool_ppr",
    tool_ppa: "tool_ppa",
    other: "other",
    job_ppc: "job_ppc",
    job_ppr: "job_ppr",
    job_lead: "job_lead",
  };
  return map[raw] ?? "job_ppc";
}
