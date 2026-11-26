/** Shared admin destinations — keep shell + dashboard in sync. */
export type AdminNavItem = {
  href: string;
  label: string;
  desc: string;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

/** Always trailing-slash for static-export hosts. */
export function adminPath(path: string): string {
  const hashIndex = path.indexOf("#");
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const [base, query] = withoutHash.split("?");
  const normalized = base.endsWith("/") ? base : `${base}/`;
  return `${query ? `${normalized}?${query}` : normalized}${hash}`;
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", desc: "Ops overview & shortcuts" },
      { href: "/admin/settings", label: "Platform settings", desc: "Rates, maps, currency" },
    ],
  },
  {
    label: "Jobs & feeds",
    items: [
      { href: "/admin/syndication-feeds", label: "XML feeds", desc: "Live job feeds" },
      { href: "/admin/jobs", label: "Jobs catalog", desc: "Cached XML jobs" },
      { href: "/admin/job-masters", label: "Filter masters", desc: "Job filter options" },
      { href: "/admin/listings", label: "Listings", desc: "Active listings" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/users", label: "Users", desc: "Accounts & roles" },
      { href: "/admin/users/?role=creator", label: "Creators", desc: "Creator profiles" },
      {
        href: "/admin/users/?approval=pending",
        label: "Pending approval",
        desc: "Review new creators",
      },
      { href: "/admin/users/?role=employer", label: "Employers", desc: "Company accounts" },
      { href: "/admin/publishers", label: "Publishers", desc: "Publisher network" },
      { href: "/admin/communities", label: "Communities", desc: "Publisher communities" },
      { href: "/admin/activity", label: "Activity", desc: "Clicks & signups" },
      { href: "/admin/geo", label: "Geo map", desc: "Traffic map" },
      { href: "/admin/website-tracking", label: "Website tracking", desc: "Embed sites" },
    ],
  },
  {
    label: "Money & trust",
    items: [
      {
        href: "/admin/campaigns/?mode=trial",
        label: "Trial post (no IP)",
        desc: "Client trial — no IP, no paid earnings",
      },
      { href: "/admin/campaigns", label: "Manual campaigns", desc: "PPC · PPR · PPA · PPE · Courses" },
      { href: "/admin/programs", label: "Programs", desc: "Employer programs" },
      {
        href: "/admin/campaign-earnings",
        label: "Campaign earnings",
        desc: "Earn by campaign",
      },
      { href: "/admin/payouts", label: "Payouts", desc: "Batches & pay" },
      { href: "/admin/withdrawals", label: "Withdrawals", desc: "Requests & status" },
      { href: "/admin/fraud", label: "Fraud queue", desc: "Review flags" },
      { href: "/admin/disputes", label: "Disputes", desc: "Open cases" },
    ],
  },
];

export const adminNavFlat: AdminNavItem[] = adminNavGroups.flatMap((g) => g.items);

/** Sidebar-only items (no filter query duplicates). */
export const adminSidebarGroups: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", desc: "Ops overview" },
      { href: "/admin/settings", label: "Platform settings", desc: "Rates & currency" },
    ],
  },
  {
    label: "Jobs & feeds",
    items: [
      { href: "/admin/syndication-feeds", label: "XML feeds", desc: "Live job feeds" },
      { href: "/admin/jobs", label: "Jobs catalog", desc: "Cached XML jobs" },
      { href: "/admin/job-masters", label: "Filter masters", desc: "Job filters" },
      { href: "/admin/listings", label: "Listings", desc: "Active listings" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/users", label: "Users", desc: "Accounts & roles" },
      { href: "/admin/publishers", label: "Publishers", desc: "Publisher network" },
      { href: "/admin/communities", label: "Communities", desc: "Publisher communities" },
      { href: "/admin/activity", label: "Activity", desc: "Clicks & signups" },
      { href: "/admin/geo", label: "Geo map", desc: "Traffic map" },
      { href: "/admin/website-tracking", label: "Website tracking", desc: "Embed sites" },
    ],
  },
  {
    label: "Money & trust",
    items: [
      {
        href: "/admin/campaigns/?mode=trial",
        label: "Trial post (no IP)",
        desc: "Client trial — no IP, no paid earnings",
      },
      { href: "/admin/campaigns", label: "Manual campaigns", desc: "PPC · PPR · PPA · PPE · Courses" },
      { href: "/admin/programs", label: "Programs", desc: "Employer programs" },
      {
        href: "/admin/campaign-earnings",
        label: "Campaign earnings",
        desc: "Earn by campaign",
      },
      { href: "/admin/payouts", label: "Payouts", desc: "Batches & pay" },
      { href: "/admin/withdrawals", label: "Withdrawals", desc: "Requests & status" },
      { href: "/admin/fraud", label: "Fraud queue", desc: "Review flags" },
      { href: "/admin/disputes", label: "Disputes", desc: "Open cases" },
    ],
  },
];
