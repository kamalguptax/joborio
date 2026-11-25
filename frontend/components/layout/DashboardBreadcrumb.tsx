"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import type { DashboardNavItem } from "@/components/layout/DashboardShell";

export type BreadcrumbCrumb = {
  label: string;
  href?: string;
};

const SEGMENT_LABELS: Record<string, string> = {
  creator: "Creator",
  publisher: "Publisher",
  employer: "Brand",
  brand: "Brand",
  network: "Network",
  dashboard: "Dashboard",
  overview: "Overview",
  performance: "Performance",
  campaigns: "Campaigns",
  opportunities: "Campaigns",
  "post-studio": "Post Studio",
  referrals: "Refer & Earn",
  wallet: "Wallet",
  earnings: "Earning",
  earning: "Earning",
  clicks: "Clicks",
  payout: "Payout",
  "trust-tier": "Trust tier",
  settings: "Settings",
  profile: "Profile",
  "job-preferences": "Job preferences",
  registrations: "Registrations",
  communities: "Communities",
  marketplace: "Campaign Marketplace",
  reports: "View Reports",
  integrations: "API & Integration",
  payments: "Payments",
  programs: "Programs",
  new: "New",
  billing: "Company & payment",
  onboarding: "Onboarding",
  members: "Members",
  invites: "Invites",
};

/** Extra nested routes not always present as top-level nav items. */
const EXTRA_ROUTES: Array<{ href: string; label: string; parentHref?: string }> = [
  { href: "/creator/earnings", label: "Earnings", parentHref: "/creator/wallet" },
  { href: "/creator/clicks", label: "Clicks", parentHref: "/creator/wallet" },
  { href: "/creator/payout", label: "Payout", parentHref: "/creator/wallet" },
  { href: "/creator/trust-tier", label: "Trust tier", parentHref: "/creator/wallet" },
  { href: "/creator/settings", label: "Settings", parentHref: "/creator/dashboard" },
  { href: "/creator/profile", label: "Profile", parentHref: "/creator/dashboard" },
  {
    href: "/creator/job-preferences",
    label: "Job preferences",
    parentHref: "/creator/settings",
  },
  {
    href: "/creator/registrations",
    label: "Registrations",
    parentHref: "/creator/performance",
  },
  { href: "/publisher/wallet", label: "Wallet", parentHref: "/publisher/dashboard" },
  { href: "/publisher/payments", label: "Payments", parentHref: "/publisher/earnings" },
  { href: "/publisher/settings", label: "Settings", parentHref: "/publisher/dashboard" },
  { href: "/publisher/profile", label: "Profile", parentHref: "/publisher/dashboard" },
  { href: "/employer/profile", label: "Profile", parentHref: "/employer/dashboard" },
  {
    href: "/employer/programs/new",
    label: "New program",
    parentHref: "/employer/programs",
  },
  {
    href: "/employer/job-preferences",
    label: "Job preferences",
    parentHref: "/employer/dashboard",
  },
];

function normalize(path: string | null): string {
  if (!path) return "";
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

function titleCase(segment: string): string {
  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function labelForSegment(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  if (/^\d+$/.test(segment) || segment === "static") return "Details";
  return titleCase(segment);
}

function homeForArea(area: string): { href: string; label: string } {
  if (area === "publisher") return { href: "/publisher/dashboard", label: "Home" };
  if (area === "employer" || area === "brand")
    return { href: "/employer/dashboard", label: "Home" };
  if (area === "network") return { href: "/network/dashboard", label: "Home" };
  return { href: "/creator/dashboard", label: "Home" };
}

function matchNavItem(
  path: string,
  nav: DashboardNavItem[],
): DashboardNavItem | null {
  const hit = (p: string, base: string) => path === base || path.startsWith(`${base}/`);
  let best: DashboardNavItem | null = null;
  let bestLen = -1;
  for (const item of nav) {
    const candidates = [item.href, ...(item.alsoActive ?? [])];
    for (const href of candidates) {
      const base = normalize(href);
      if (!hit(path, base)) continue;
      if (base.length > bestLen) {
        best = item;
        bestLen = base.length;
      }
    }
  }
  return best;
}

export function buildDashboardBreadcrumbs(
  pathname: string | null,
  nav: DashboardNavItem[],
  opts?: {
    settingsHref?: string;
    settingsLabel?: string;
    profileHref?: string;
    profileLabel?: string;
  },
): BreadcrumbCrumb[] {
  const path = normalize(pathname);
  if (!path) return [];

  const parts = path.split("/").filter(Boolean);
  const area = parts[0] ?? "creator";
  const home = homeForArea(area);
  const crumbs: BreadcrumbCrumb[] = [{ label: home.label, href: home.href }];

  if (path === home.href || path === `/${area}` || path === `/${area}/dashboard`) {
    crumbs.push({ label: "Dashboard" });
    return crumbs;
  }

  const extras = [...EXTRA_ROUTES];
  if (opts?.settingsHref) {
    extras.push({
      href: opts.settingsHref,
      label: opts.settingsLabel ?? "Account",
      parentHref: home.href,
    });
  }
  if (opts?.profileHref && opts.profileHref.startsWith("/")) {
    extras.push({
      href: opts.profileHref,
      label: opts.profileLabel ?? "Profile",
      parentHref: home.href,
    });
  }

  const extra = extras.find((row) => normalize(row.href) === path);
  if (extra) {
    if (extra.parentHref && normalize(extra.parentHref) !== home.href) {
      const parentNav = matchNavItem(normalize(extra.parentHref), nav);
      crumbs.push({
        label: parentNav?.label ?? labelForSegment(normalize(extra.parentHref).split("/").pop() ?? ""),
        href: extra.parentHref,
      });
    }
    crumbs.push({ label: extra.label });
    return crumbs;
  }

  const navItem = matchNavItem(path, nav);
  if (navItem) {
    const navBase = normalize(navItem.href);
    if (path === navBase) {
      crumbs.push({ label: navItem.label });
      return crumbs;
    }
    crumbs.push({ label: navItem.label, href: navItem.href });
    const rest = path.slice(navBase.length).split("/").filter(Boolean);
    rest.forEach((segment, index) => {
      const isLast = index === rest.length - 1;
      crumbs.push({
        label: labelForSegment(segment),
        href: isLast
          ? undefined
          : `${navBase}/${rest.slice(0, index + 1).join("/")}`,
      });
    });
    return crumbs;
  }

  // Fallback: segment trail under the area home.
  parts.slice(1).forEach((segment, index) => {
    const isLast = index === parts.length - 2;
    const href = `/${parts.slice(0, index + 2).join("/")}`;
    crumbs.push({
      label: labelForSegment(segment),
      href: isLast ? undefined : href,
    });
  });

  if (crumbs.length === 1) {
    crumbs.push({ label: labelForSegment(parts[parts.length - 1] ?? "Page") });
  }

  return crumbs;
}

export default function DashboardBreadcrumb({
  items,
}: {
  items: BreadcrumbCrumb[];
}) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? (
                <ChevronRight
                  size={14}
                  className="shrink-0 text-slate-300"
                  aria-hidden="true"
                />
              ) : (
                <Home
                  size={14}
                  className="shrink-0 text-violet-500"
                  aria-hidden="true"
                />
              )}
              {isLast || !item.href ? (
                <span
                  className={isLast ? "text-[#0F1B3D]" : undefined}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="transition hover:text-violet-700"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
