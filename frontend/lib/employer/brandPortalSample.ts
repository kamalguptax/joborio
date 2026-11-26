/** Sample / scaffold data shaped like JobOrio Brand Portal Design.html */

export const brandInr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const WIZARD_STEPS = [
  "Opportunity",
  "Audience",
  "Model",
  "Pricing",
  "Budget",
  "Quality",
  "Tracking",
  "Guidelines",
  "Review",
] as const;

export const WIZARD_CATEGORIES = [
  { id: "Jobs", label: "Jobs", sub: "Roles and hiring" },
  { id: "Courses", label: "Courses", sub: "Skill courses" },
  { id: "Bootcamps", label: "Bootcamps", sub: "Cohort programs" },
  { id: "Hackathons", label: "Hackathons", sub: "Contests and events" },
  { id: "AI Tools", label: "AI Tools", sub: "Tool sign-ups" },
  { id: "SaaS", label: "SaaS", sub: "Trials and demos" },
  { id: "Products", label: "Products", sub: "Purchases" },
  { id: "Other", label: "Other", sub: "Needs JobOrio approval" },
] as const;

/** Field spec: string = text; [label,'area'|'date'|'multi'] or [label, options[]] or [label,'multi', options[]] */
export type CatFieldSpec =
  | string
  | [string, "area" | "date" | "multi" | string[]]
  | [string, "multi", string[]];

export const EDUCATION_OPTIONS = [
  "10th pass",
  "12th pass",
  "ITI",
  "Diploma",
  "Graduate",
  "B.Tech",
  "B.E.",
  "BCA",
  "B.Sc",
  "B.Com",
  "BA",
  "MBA",
  "MCA",
  "M.Tech",
  "M.Sc",
  "Post graduate",
  "PhD",
  "Any",
];

export const SKILL_OPTIONS = [
  "PHP",
  "Laravel",
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Java",
  "SQL",
  "MySQL",
  "MongoDB",
  "HTML",
  "CSS",
  "Tailwind",
  "UI/UX",
  "Digital Marketing",
  "Sales",
  "Excel",
  "Communication",
  "Project Management",
  "DevOps",
  "AWS",
  "Android",
  "iOS",
  "Flutter",
  "WordPress",
  "SEO",
  "Content Writing",
  "Customer Support",
];

export const CATEGORY_FIELD_SCHEMA: Record<string, CatFieldSpec[]> = {
  Jobs: [
    "Job title",
    "Employer",
    ["Job description", "area"],
    "Job location",
    ["Country", ["India", "UAE", "USA", "UK", "Other"]],
    "State",
    "City",
    "Salary range",
    "Experience",
    ["Education", "multi", EDUCATION_OPTIONS],
    ["Skills", "multi", SKILL_OPTIONS],
    [
      "Employment type",
      ["Full-time", "Part-time", "Contract", "Apprenticeship"],
    ],
    ["Work mode", ["On-site", "Remote", "Hybrid"]],
    "Application URL",
    ["Application deadline", "date"],
  ],
  Courses: [
    "Course name",
    "Provider",
    ["Course description", "area"],
    "Course URL",
    "Price",
    "Duration",
    "Skill category",
    "Eligibility",
    ["Learning mode", ["Online", "Offline", "Hybrid"]],
    ["Certification", ["Yes", "No"]],
    ["Placement assistance", ["Yes", "No", "Partial"]],
  ],
  Bootcamps: [
    "Bootcamp name",
    ["Skills", "multi", SKILL_OPTIONS],
    "Duration",
    "Price",
    ["Start date", "date"],
    "Eligibility",
    ["Learning mode", ["Online", "Offline", "Hybrid"]],
    ["Placement support", ["Yes", "No", "Partial"]],
  ],
  Hackathons: [
    "Hackathon name",
    "Theme",
    "Eligibility",
    ["Skills", "multi", SKILL_OPTIONS],
    ["Start date", "date"],
    ["End date", "date"],
    ["Mode", ["Online", "Offline", "Hybrid"]],
    ["Participation", ["Team", "Individual"]],
    "Prize details",
    ["Registration deadline", "date"],
  ],
  "AI Tools": [
    "Product name",
    "Product URL",
    ["Description", "area"],
    "Product category",
    ["Pricing type", ["Free", "Paid", "Trial"]],
    "Pricing",
    "Target industry",
    "Target customer",
    "Required conversion action",
  ],
  SaaS: [
    "Product name",
    "Product URL",
    ["Description", "area"],
    "Product category",
    ["Pricing type", ["Free", "Paid", "Trial"]],
    "Pricing",
    "Target industry",
    "Target customer",
    "Required conversion action",
  ],
  Products: [
    "Product name",
    "Product category",
    "Product URL",
    "Price",
    "Geography",
    "Target customer",
    "Purchase objective",
    ["Order and payment tracking requirements", "area"],
  ],
  Other: [
    "Custom opportunity type",
    ["Description", "area"],
    "Landing URL",
  ],
};

export const AUDIENCE_TYPES = [
  "Job seekers",
  "Students",
  "Freshers",
  "Working professionals",
  "Experienced candidates",
  "Course seekers",
  "Business owners",
  "Developers",
  "Technology professionals",
  "General consumers",
] as const;

export const AUDIENCE_FIELDS: CatFieldSpec[] = [
  ["Country", ["India", "UAE", "USA", "UK", "Other"]],
  "State",
  "City",
  "Industry",
  "Keywords",
  ["Skills", "multi", SKILL_OPTIONS],
  [
    "Experience level",
    ["Fresher", "1 to 3 years", "3 to 7 years", "7+ years", "Any"],
  ],
  ["Education", "multi", EDUCATION_OPTIONS],
  "Age range (only where lawful and necessary)",
  [
    "Language",
    ["Hindi", "English", "Marathi", "Tamil", "Telugu", "Bengali", "Any"],
  ],
  ["Work mode", ["On-site", "Remote", "Hybrid", "Any"]],
  ["Employment type", ["Full-time", "Part-time", "Contract", "Any"]],
  ["Preferred audience intent", ["Actively looking", "Exploring", "Any"]],
  "Excluded locations",
  "Excluded audience categories",
  ["Mandatory eligibility requirements", "area"],
];

export const BUDGET_FIELDS: CatFieldSpec[] = [
  "Total budget",
  "Daily budget",
  ["Currency", ["INR", "USD"]],
  ["Start date", "date"],
  ["End date", "date"],
  "Maximum daily conversions",
  "Maximum total conversions",
  "Daily click cap",
  ["Priority", ["Standard", "High", "Low"]],
  [
    "Delivery preference",
    ["Even pacing", "Front-loaded", "Weekdays only"],
  ],
];

export const QUALITY_FIELDS: CatFieldSpec[] = [
  "Mandatory lead fields",
  [
    "Duplicate policy",
    [
      "Reject duplicates by email and phone",
      "Reject duplicates by email only",
      "Allow duplicates (not recommended)",
    ],
  ],
  [
    "Existing applicant policy",
    ["Reject existing applicants", "Accept existing applicants"],
  ],
  [
    "Allowed conversion window",
    ["7 days", "14 days", "30 days", "60 days"],
  ],
  "Location requirement",
  "Experience requirement",
  ["Eligibility requirement", "area"],
];

export const QUALITY_TOGGLES = [
  { id: "email", label: "Email verification" },
  { id: "otp", label: "Phone OTP verification" },
  { id: "crm", label: "CRM verification" },
  { id: "appcomp", label: "Application completion required" },
] as const;

export const REJECTION_REASONS = [
  "Duplicate",
  "Invalid email",
  "Invalid phone",
  "OTP not completed",
  "Wrong location",
  "Not eligible",
  "Existing applicant/customer",
  "Incomplete registration",
  "Fake or suspicious",
  "No valid attribution",
] as const;

export const TRACKING_INTEGRATIONS = [
  { id: "link", label: "JobOrio tracking link", sub: "Default, no code" },
  { id: "pixel", label: "Pixel", sub: "Thank-you page tag" },
  { id: "s2s", label: "S2S postback", sub: "Server call per conversion" },
  { id: "capi", label: "Conversion API", sub: "Signed server events" },
  { id: "webhook", label: "Webhook", sub: "Status updates both ways" },
  { id: "csv", label: "CSV upload", sub: "Batch reconciliation" },
  { id: "crm", label: "CRM integration", sub: "Lead status sync" },
  { id: "ats", label: "ATS integration", sub: "Application status sync" },
  { id: "api", label: "Custom API", sub: "Full control" },
] as const;

export const TRACKING_FIELDS: CatFieldSpec[] = [
  "Destination URL",
  "Allowed domains",
  ["Attribution window", ["7 days", "14 days", "30 days", "60 days"]],
  "Conversion event name",
  "Callback endpoint",
  [
    "Authentication",
    ["HMAC-SHA256 signature", "API key header", "None (pixel only)"],
  ],
];

export const GUIDELINE_FIELDS: CatFieldSpec[] = [
  ["Approved campaign description", "area"],
  ["Key selling points", "area"],
  ["Required disclaimers", "area"],
  ["Prohibited claims", "area"],
  "Required promotional language",
  "Landing page URL",
  "Expiry or deadline information",
  "Legal or compliance notes",
];

export const ASSET_BUTTONS = [
  "Logo",
  "Banner",
  "Promotional image",
  "Brand guideline PDF",
] as const;

export type ModelKey = "ppc" | "ppr" | "ppl" | "ppa" | "cpa" | "cpm";

export const CONVERSION_MODELS: Record<
  ModelKey,
  {
    code: string;
    label: string;
    bill: string;
    req: string;
    val: string;
    win: string;
    rej: string;
    be: string;
    earn: string;
  }
> = {
  ppc: {
    code: "CPC / PPC",
    label: "Cost Per Click",
    bill: "Unique valid click",
    req: "Click passes bot and duplicate filters",
    val: "One billable click per click_id, geo must match targeting",
    win: "Instant (click level)",
    rej: "Invalid, duplicate or bot clicks are not billed",
    be: "Valid click recorded",
    earn:
      "Partner pool = gross price minus JobOrio commission, per valid click",
  },
  ppr: {
    code: "PPR",
    label: "Cost Per Registration",
    bill: "Registration that passes verification and approval (not on submit)",
    req: "Mandatory lead fields complete, email or OTP verified if required",
    val: "Duplicate policy, eligibility rules, attribution check",
    win: "Up to 30 days from click (default)",
    rej: "Rejected with a predefined reason, visible to you",
    be: "Approved conversion",
    earn: "Partner pool per approved registration only",
  },
  ppl: {
    code: "PPL",
    label: "Cost Per Qualified Lead",
    bill: "Lead that meets your eligibility and quality rules",
    req: "Eligibility fields and verification complete",
    val: "Eligibility, geo, experience, existing-customer check",
    win: "Up to 30 days from click (default)",
    rej: "Rejected with a predefined reason",
    be: "Approved qualified lead",
    earn: "Partner pool per approved qualified lead",
  },
  ppa: {
    code: "PPA",
    label: "Cost Per Application / Action",
    bill: "Completed application or action confirmed by your system",
    req: "Postback or ATS confirmation received",
    val: "Unique event_id, matching click_id, inside window",
    win: "Up to 30 days from click (default)",
    rej: "Unconfirmed or duplicate applications are not billed",
    be: "Confirmed application",
    earn: "Partner pool per confirmed application",
  },
  cpa: {
    code: "CPA",
    label: "Cost Per Acquisition",
    bill: "Purchase, enrolment or paid sign-up confirmed",
    req: "Purchase validation or CRM confirmation",
    val: "Payment confirmed, refund window respected",
    win: "Up to 30 days from click (default)",
    rej: "Refunded or cancelled orders are reversed via ledger adjustment",
    be: "Confirmed acquisition",
    earn: "Partner pool per confirmed acquisition",
  },
  cpm: {
    code: "CPM",
    label: "Cost Per 1,000 Impressions",
    bill: "1,000 verified impressions (only if reliably measurable)",
    req: "Impression measurement agreed with JobOrio",
    val: "Viewability and invalid-traffic filtering",
    win: "Daily",
    rej: "Invalid impressions removed before billing",
    be: "Verified impressions",
    earn: "Partner pool per 1,000 verified impressions (future, not in MVP)",
  },
};

/** [low, typicalStart, typicalEnd, competitive] */
export const PRICING_BENCH: Record<ModelKey, [number, number, number, number]> =
  {
    ppc: [1, 2, 3.5, 5],
    ppr: [15, 25, 35, 50],
    ppl: [40, 60, 90, 130],
    ppa: [40, 60, 90, 130],
    cpa: [150, 250, 400, 600],
    cpm: [40, 70, 110, 160],
  };

export const DEFAULT_WIZARD_FORM: Record<string, string> = {
  Country: "India",
  "Total budget": "100000",
  "Daily budget": "5000",
  Currency: "INR",
  "Start date": "2026-12-01",
  "End date": "2026-12-31",
  Priority: "Standard",
  "Delivery preference": "Even pacing",
  "Attribution window": "30 days",
  "Duplicate policy": "Reject duplicates by email and phone",
  "Existing applicant policy": "Reject existing applicants",
  "Allowed conversion window": "30 days",
  Authentication: "HMAC-SHA256 signature",
  "Conversion event name": "registration_complete",
  "Mandatory lead fields": "Name, Email, Phone, City",
  Language: "Hindi",
  "Destination URL": "https://",
  "Callback endpoint": "https://your-domain.com/hooks/joborio",
};

export function fieldLabel(spec: CatFieldSpec): string {
  return Array.isArray(spec) ? spec[0] : spec;
}

export function parseFieldSpec(spec: CatFieldSpec): {
  label: string;
  kind: "text" | "area" | "date" | "select" | "multi";
  options?: string[];
} {
  if (!Array.isArray(spec)) {
    return { label: spec, kind: "text" };
  }
  const [label, second, third] = spec as [
    string,
    "area" | "date" | "multi" | string[],
    string[]?,
  ];
  if (second === "area") return { label, kind: "area" };
  if (second === "date") return { label, kind: "date" };
  if (second === "multi") {
    return {
      label,
      kind: "multi",
      options: Array.isArray(third) ? third : [],
    };
  }
  if (Array.isArray(second)) return { label, kind: "select", options: second };
  return { label, kind: "text" };
}

/** Split stored multi values (comma / pipe / newline). */
export function splitMultiValue(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,|/\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function joinMultiValue(values: string[]): string {
  return values.map((v) => v.trim()).filter(Boolean).join(", ");
}

export const SAMPLE_COMPLAINTS = [
  {
    id: "CMP-1048",
    camp: "JO-C-24081",
    plat: "WhatsApp",
    cat: "Wrong offer",
    date: "24 Nov 2026",
    status: "Open",
    pill: "bg-violet-50 text-violet-700",
    upd: "24 Nov",
    outcome: "—",
  },
  {
    id: "CMP-1042",
    camp: "CMP-JOB-01",
    plat: "Instagram",
    cat: "Misleading claim",
    date: "18 Nov 2026",
    status: "Investigating",
    pill: "bg-amber-50 text-amber-800",
    upd: "20 Nov",
    outcome: "—",
  },
  {
    id: "CMP-1038",
    camp: "CMP-PPR-04",
    plat: "YouTube",
    cat: "Off-brief creative",
    date: "12 Nov 2026",
    status: "Resolved",
    pill: "bg-emerald-50 text-emerald-700",
    upd: "15 Nov",
    outcome: "Content taken down",
  },
  {
    id: "CMP-1021",
    camp: "CMP-PPC-02",
    plat: "LinkedIn",
    cat: "Brand safety",
    date: "04 Nov 2026",
    status: "Closed",
    pill: "bg-slate-100 text-slate-600",
    upd: "08 Nov",
    outcome: "No violation",
  },
];

export const SAMPLE_LEADS = [
  {
    id: "LD-9081",
    click: "CLK-44102",
    camp: "Foundit signup",
    status: "Approved",
    pill: "bg-emerald-50 text-emerald-700",
    received: "24 Nov 10:12",
    verified: "24 Nov 10:40",
    score: "92",
  },
  {
    id: "LD-9077",
    click: "CLK-44088",
    camp: "Project engineer",
    status: "Verified",
    pill: "bg-violet-50 text-violet-700",
    received: "24 Nov 09:05",
    verified: "24 Nov 09:22",
    score: "71",
  },
  {
    id: "LD-9062",
    click: "CLK-43991",
    camp: "Global Bootcamp",
    status: "Received",
    pill: "bg-slate-100 text-slate-600",
    received: "23 Nov 18:44",
    verified: "—",
    score: "—",
  },
  {
    id: "LD-9055",
    click: "CLK-43910",
    camp: "India Tech Hiring",
    status: "Rejected",
    pill: "bg-rose-50 text-rose-700",
    received: "23 Nov 14:02",
    verified: "23 Nov 15:10",
    score: "28",
  },
];

export const SAMPLE_TEAM = [
  {
    name: "Asha Mehta",
    email: "asha@brand.com",
    role: "Owner",
    status: "Active",
    canRemove: false,
  },
  {
    name: "Rohan Kapoor",
    email: "rohan@brand.com",
    role: "Admin",
    status: "Active",
    canRemove: true,
  },
  {
    name: "Neha Shah",
    email: "neha@brand.com",
    role: "Campaign Manager",
    status: "Active",
    canRemove: true,
  },
  {
    name: "Vikram Rao",
    email: "vikram@brand.com",
    role: "Analyst",
    status: "Invited",
    canRemove: true,
  },
];

export const PERMISSION_MATRIX = [
  ["Owner", "Full", "Full", "Full", "Full", "Full"],
  ["Admin", "Full", "Full", "Full", "View", "Full"],
  ["Campaign Manager", "Create, edit", "View", "Submit", "None", "None"],
  ["Analyst", "View", "Full", "View", "None", "None"],
  ["Finance", "View", "View", "None", "Full", "None"],
  ["Reviewer", "View", "View", "Submit", "None", "None"],
];

export const SAMPLE_ASSETS = [
  {
    x: "brand-logo-primary.png",
    st: "Approved",
    pill: "bg-emerald-50 text-emerald-700",
  },
  {
    x: "campaign-banner-1080.pdf",
    st: "In review",
    pill: "bg-amber-50 text-amber-800",
  },
  {
    x: "partner-guidelines-v1.pdf",
    st: "Approved",
    pill: "bg-emerald-50 text-emerald-700",
  },
];

export const SAMPLE_BILLING_TILES = [
  { l: "Available balance", v: "₹1,84,250", n: "Prepaid wallet" },
  { l: "Reserved budget", v: "₹92,000", n: "Active campaigns" },
  { l: "Approved spend (MTD)", v: "₹1,28,640", n: "Billable only" },
  { l: "Pending value", v: "₹41,200", n: "Awaiting approval" },
  { l: "Credits / adjustments", v: "₹6,500", n: "Append-only" },
  { l: "Lifetime invoices", v: "2", n: "Nov 2026" },
];

export const SAMPLE_EXPENDITURE = [
  {
    name: "CNC Operator Hiring, Pune",
    b: "₹1,50,000",
    s: "₹93,925",
    p: "₹18,400",
  },
  {
    name: "Full-Stack Bootcamp Cohort 12",
    b: "₹2,00,000",
    s: "₹1,35,850",
    p: "₹12,800",
  },
  {
    name: "Data Analytics Weekend Batch",
    b: "₹1,20,000",
    s: "₹1,07,880",
    p: "₹6,200",
  },
  {
    name: "Lumen AI Notes Free Trial",
    b: "₹50,000",
    s: "₹22,270",
    p: "₹2,400",
  },
  {
    name: "Smart Hackathon 2027",
    b: "₹80,000",
    s: "₹40,800",
    p: "₹1,400",
  },
];

export const SAMPLE_LEDGER = [
  {
    id: "LED-9081",
    d: "25 Nov 2026",
    type: "Wallet top-up",
    camp: "—",
    dr: "—",
    cr: "₹50,000",
  },
  {
    id: "LED-9074",
    d: "24 Nov 2026",
    type: "Approved spend",
    camp: "JO-C-24081",
    dr: "₹12,750",
    cr: "—",
  },
  {
    id: "LED-9068",
    d: "23 Nov 2026",
    type: "Approved spend",
    camp: "JO-C-24077",
    dr: "₹18,200",
    cr: "—",
  },
  {
    id: "LED-9059",
    d: "21 Nov 2026",
    type: "Adjustment credit",
    camp: "JO-C-24072",
    dr: "—",
    cr: "₹3,200",
  },
  {
    id: "LED-9042",
    d: "18 Nov 2026",
    type: "Budget reserve",
    camp: "JO-C-24090",
    dr: "₹80,000",
    cr: "—",
  },
];

export const SAMPLE_NOTIFICATIONS = [
  {
    title: "Campaign approved",
    body: "India Tech Hiring – PPC is live for distribution.",
    time: "2h ago",
    tone: "emerald",
  },
  {
    title: "Lead pending review",
    body: "3 verified leads await approval in Lead Quality Centre.",
    time: "5h ago",
    tone: "violet",
  },
  {
    title: "Wallet topped up",
    body: "₹25,000 credited to prepaid wallet.",
    time: "Yesterday",
    tone: "slate",
  },
  {
    title: "Content complaint update",
    body: "CMP-1042 moved to Investigating.",
    time: "Yesterday",
    tone: "amber",
  },
];
