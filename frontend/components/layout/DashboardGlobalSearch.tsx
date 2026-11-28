"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, X } from "lucide-react";
import type { DashboardNavItem } from "@/components/layout/DashboardShell";

export type DashboardSearchItem = {
  id: string;
  title: string;
  href: string;
  subtitle?: string;
  keywords?: string[];
  group?: string;
};

const CREATOR_EXTRAS: DashboardSearchItem[] = [
  {
    id: "c-earnings",
    title: "Earnings ledger",
    href: "/creator/earnings",
    keywords: ["money", "payout", "paid", "pending"],
    group: "Money",
  },
  {
    id: "c-wallet",
    title: "Wallet",
    href: "/creator/wallet",
    keywords: ["balance", "withdraw"],
    group: "Money",
  },
  {
    id: "c-payout",
    title: "Payout",
    href: "/creator/profile?tab=payout",
    keywords: ["bank", "withdraw", "transfer"],
    group: "Money",
  },
  {
    id: "c-clicks",
    title: "Clicks",
    href: "/creator/clicks",
    keywords: ["traffic", "attribution"],
    group: "Performance",
  },
  {
    id: "c-prefs",
    title: "Job preferences",
    href: "/creator/job-preferences",
    keywords: ["niches", "categories", "filters"],
    group: "Settings",
  },
  {
    id: "c-settings",
    title: "Settings",
    href: "/creator/profile?tab=preferences",
    keywords: ["account", "profile"],
    group: "Settings",
  },
  {
    id: "c-profile",
    title: "Creator profile",
    href: "/creator/profile",
    keywords: ["account", "avatar"],
    group: "Settings",
  },
  {
    id: "c-trust",
    title: "Trust tier",
    href: "/creator/trust-tier",
    keywords: ["tier", "ppr", "eligibility"],
    group: "Account",
  },
  {
    id: "c-post",
    title: "Post Studio",
    href: "/creator/post-studio",
    keywords: ["draft", "share", "linkedin", "jobs"],
    group: "Promote",
  },
  {
    id: "c-top",
    title: "Top performers",
    href: "/creator/top-performers",
    keywords: ["leaderboard", "rankings", "earnings"],
    group: "Performance",
  },
  {
    id: "c-ops",
    title: "Campaigns",
    href: "/creator/campaigns",
    keywords: ["jobs", "opportunities", "ppc", "ppr", "share"],
    group: "Promote",
  },
];

const PUBLISHER_EXTRAS: DashboardSearchItem[] = [
  {
    id: "p-wallet",
    title: "Wallet",
    href: "/publisher/wallet",
    keywords: ["balance", "available", "money"],
    group: "Money",
  },
  {
    id: "p-earnings",
    title: "Earning",
    href: "/publisher/earnings",
    keywords: ["revenue", "campaign", "assignment"],
    group: "Money",
  },
  {
    id: "p-payments",
    title: "Payments",
    href: "/publisher/payments",
    keywords: ["history", "settlement", "payout"],
    group: "Money",
  },
  {
    id: "p-settings",
    title: "Account settings",
    href: "/publisher/settings",
    keywords: ["profile", "password"],
    group: "Settings",
  },
  {
    id: "p-profile",
    title: "Profile",
    href: "/publisher/profile",
    keywords: ["account"],
    group: "Settings",
  },
  {
    id: "p-network",
    title: "Invite Team",
    href: "/publisher/network",
    keywords: ["members", "invite", "community", "reports", "performance team"],
    group: "Network",
  },
  {
    id: "p-reports",
    title: "View Reports",
    href: "/publisher/network?tab=reports",
    keywords: ["clicks", "members", "performance", "reports"],
    group: "Network",
  },
  {
    id: "p-communities",
    title: "Communities",
    href: "/publisher/communities",
    keywords: ["community", "list"],
    group: "Publisher",
  },
  {
    id: "p-communities-new",
    title: "Create community",
    href: "/publisher/communities/new",
    keywords: ["niche", "xml", "feeds"],
    group: "Network",
  },
  {
    id: "p-market",
    title: "Campaign Marketplace",
    href: "/publisher/marketplace",
    keywords: ["assign", "jobs", "campaigns"],
    group: "Promote",
  },
  {
    id: "p-studio",
    title: "Post Studio",
    href: "/publisher/post-studio",
    keywords: ["draft", "share", "xml"],
    group: "Promote",
  },
];

const BRAND_EXTRAS: DashboardSearchItem[] = [
  {
    id: "b-new",
    title: "Create Campaign",
    href: "/brand/programs/new",
    keywords: ["create", "launch", "campaign", "program"],
    group: "Campaigns",
  },
  {
    id: "b-programs",
    title: "My Campaigns",
    href: "/brand/programs",
    keywords: ["campaigns", "ppc", "ppr", "jobs", "programs"],
    group: "Campaigns",
  },
  {
    id: "b-performance",
    title: "Campaign Performance",
    href: "/brand/performance",
    keywords: ["analytics", "clicks", "roi"],
    group: "Campaigns",
  },
  {
    id: "b-reports",
    title: "Reports & Content Complaints",
    href: "/brand/reports",
    keywords: ["reports", "complaints", "content"],
    group: "Insights",
  },
  {
    id: "b-leads",
    title: "Lead Quality Centre",
    href: "/brand/lead-quality",
    keywords: ["leads", "quality", "approve"],
    group: "Insights",
  },
  {
    id: "b-tracking",
    title: "Tracking & Integrations",
    href: "/brand/tracking",
    keywords: ["pixel", "postback", "crm"],
    group: "Tools",
  },
  {
    id: "b-assets",
    title: "Campaign Assets",
    href: "/brand/assets",
    keywords: ["creatives", "briefs", "brand kit"],
    group: "Tools",
  },
  {
    id: "b-billing",
    title: "Billing & Wallet",
    href: "/brand/billing",
    keywords: ["invoice", "card", "wallet", "payment"],
    group: "Account",
  },
  {
    id: "b-profile",
    title: "Brand Profile",
    href: "/brand/profile",
    keywords: ["account", "settings", "company"],
    group: "Account",
  },
  {
    id: "b-team",
    title: "Team & Permissions",
    href: "/brand/team",
    keywords: ["invite", "roles", "access"],
    group: "Account",
  },
  {
    id: "b-notifications",
    title: "Notifications",
    href: "/brand/notifications",
    keywords: ["alerts", "inbox"],
    group: "Account",
  },
];

const HELP_ITEMS: DashboardSearchItem[] = [
  {
    id: "help-feedback",
    title: "Share feedback",
    href: "/feedback",
    keywords: ["feedback", "suggestion", "report", "problem"],
    group: "Help",
  },
  {
    id: "help-contact",
    title: "Contact us",
    href: "/contact",
    keywords: ["support", "email"],
    group: "Help",
  },
  {
    id: "help-refer",
    title: "Refer & Earn",
    href: "/refer-and-earn",
    keywords: ["referral", "invite"],
    group: "Help",
  },
];

function audienceFromNav(nav: DashboardNavItem[]): "creator" | "publisher" | "brand" | "other" {
  const href = nav[0]?.href ?? "";
  if (href.startsWith("/creator")) return "creator";
  if (href.startsWith("/publisher")) return "publisher";
  if (href.startsWith("/brand")) return "brand";
  return "other";
}

function extrasFor(audience: ReturnType<typeof audienceFromNav>): DashboardSearchItem[] {
  if (audience === "creator") return CREATOR_EXTRAS;
  if (audience === "publisher") return PUBLISHER_EXTRAS;
  if (audience === "brand") return BRAND_EXTRAS;
  return [];
}

function scoreItem(item: DashboardSearchItem, q: string): number {
  if (!q) return 1;
  const hay = [item.title, item.subtitle, item.group, ...(item.keywords ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (hay.includes(q)) return q.length / Math.max(hay.length, 1) + (item.title.toLowerCase().startsWith(q) ? 2 : 1);
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.every((t) => hay.includes(t))) return 0.5;
  return 0;
}

export default function DashboardGlobalSearch({
  nav,
  settingsHref,
  settingsLabel = "Account",
  profileHref,
  profileLabel = "Public page",
  extras = [],
}: {
  nav: DashboardNavItem[];
  settingsHref?: string;
  settingsLabel?: string;
  profileHref?: string;
  profileLabel?: string;
  extras?: DashboardSearchItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const catalog = useMemo(() => {
    const audience = audienceFromNav(nav);
    const fromNav: DashboardSearchItem[] = nav.map((item) => ({
      id: `nav-${item.href}`,
      title: item.label,
      href: item.href,
      group: "Menu",
      keywords: [item.label, item.href],
    }));
    const account: DashboardSearchItem[] = [];
    if (settingsHref) {
      account.push({
        id: "settings",
        title: settingsLabel,
        href: settingsHref,
        group: "Settings",
        keywords: ["settings", "account"],
      });
    }
    if (profileHref) {
      account.push({
        id: "profile",
        title: profileLabel,
        href: profileHref,
        group: "Settings",
        keywords: ["profile", "public"],
      });
    }
    const merged = [
      ...fromNav,
      ...account,
      ...extrasFor(audience),
      ...extras,
      ...HELP_ITEMS,
    ];
    const seen = new Set<string>();
    return merged.filter((item) => {
      const key = item.href;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [nav, settingsHref, settingsLabel, profileHref, profileLabel, extras]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const ranked = catalog
      .map((item) => ({ item, score: scoreItem(item, q) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));
    return ranked.slice(0, 12).map((row) => row.item);
  }, [catalog, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  const go = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 20);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 min-w-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-500 shadow-sm transition hover:border-violet-200 hover:text-violet-700 sm:min-w-[12rem] sm:px-3.5"
        aria-label="Open global search"
      >
        <Search size={16} className="shrink-0 text-slate-400" />
        <span className="hidden truncate sm:inline">Search anything…</span>
        <kbd className="ml-auto hidden rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 sm:inline">
          {isMac ? "⌘" : "Ctrl"}K
        </kbd>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[90] flex items-start justify-center bg-slate-950/45 p-4 pt-[12vh] sm:pt-[16vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Global search"
          onClick={close}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-indigo-900/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <Search size={18} className="shrink-0 text-violet-600" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((i) => Math.max(i - 1, 0));
                  } else if (e.key === "Enter" && results[active]) {
                    e.preventDefault();
                    go(results[active].href);
                  }
                }}
                placeholder="Search pages, campaigns, wallet, settings…"
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#0A2150] outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={close}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close search"
              >
                <X size={16} />
              </button>
            </div>

            <ul className="max-h-[min(24rem,50vh)] overflow-y-auto py-2">
              {results.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-slate-500">
                  No matches for “{query.trim()}”.
                </li>
              ) : (
                results.map((item, index) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => go(item.href)}
                      onMouseEnter={() => setActive(index)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                        index === active ? "bg-violet-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#0A2150]">
                          {item.title}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {[item.group, item.subtitle, item.href].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <ArrowRight
                        size={16}
                        className={index === active ? "text-violet-600" : "text-slate-300"}
                      />
                    </button>
                  </li>
                ))
              )}
            </ul>

            <p className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400">
              ↑↓ to move · Enter to open · Esc to close
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
