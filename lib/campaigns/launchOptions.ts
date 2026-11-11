export type LaunchOptionId =
  | "ppc"
  | "courses"
  | "ppr"
  | "branding"
  | "lead";

export type LaunchOption = {
  id: LaunchOptionId;
  label: string;
  description: string;
  pricing_model: "ppc" | "ppr" | "ppa";
  promotion_type: "job" | "course" | "tool" | "branding" | "other";
  defaultRate: string;
  defaultBudget: string;
};

/** Options shown under Launch Campaign. */
export const LAUNCH_OPTIONS: LaunchOption[] = [
  {
    id: "ppc",
    label: "Pay Per Click",
    description: "Pay when someone clicks your job or offer link.",
    pricing_model: "ppc",
    promotion_type: "job",
    defaultRate: "0.05",
    defaultBudget: "500",
  },
  {
    id: "courses",
    label: "Courses",
    description: "Promote courses and bootcamps to creator audiences.",
    pricing_model: "ppr",
    promotion_type: "course",
    defaultRate: "0.35",
    defaultBudget: "1000",
  },
  {
    id: "ppr",
    label: "Pay Per Signup / Registration",
    description: "Pay when a visitor completes signup or registration.",
    pricing_model: "ppr",
    promotion_type: "job",
    defaultRate: "0.30",
    defaultBudget: "800",
  },
  {
    id: "branding",
    label: "Brand awareness",
    description: "Run branding and awareness promotion with creators.",
    pricing_model: "ppc",
    promotion_type: "branding",
    defaultRate: "0.04",
    defaultBudget: "1500",
  },
  {
    id: "lead",
    label: "Pay per Lead",
    description: "Pay when a qualified lead or application is confirmed.",
    pricing_model: "ppa",
    promotion_type: "job",
    defaultRate: "1.00",
    defaultBudget: "2000",
  },
];

export function launchOptionById(id: LaunchOptionId): LaunchOption {
  return LAUNCH_OPTIONS.find((item) => item.id === id) ?? LAUNCH_OPTIONS[0];
}
