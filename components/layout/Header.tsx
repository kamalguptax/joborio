"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { fetchMe, logoutApi } from "@/lib/api/auth";
import type { User } from "@/lib/api/types";
import { clearAuthToken, getAuthToken, rememberPublicCode } from "@/lib/auth/session";
import { publicCodeForUser } from "@/lib/tracking/subid";
import Logo from "./Logo";

/* ------------------------------------------------------------------ */
/*  Auth helpers                                                       */
/* ------------------------------------------------------------------ */

function dashboardPath(user: User): string {
  if (user.roles?.some((r) => r.name === "admin")) return "/admin/dashboard";
  if (user.creator) return "/creator/dashboard";
  if (user.roles?.some((r) => r.name === "employer")) return "/employer/dashboard";
  return "/onboarding";
}

function accountLabel(user: User): string {
  if (user.creator?.handle) return `@${user.creator.handle}`;
  return user.name?.split(" ")[0] || "My account";
}

/* ------------------------------------------------------------------ */
/*  Nav data                                                           */
/* ------------------------------------------------------------------ */

type NavItem = {
  label: string;
  href: string;
  description: string;
  icon: ReactNode;
};

type NavGroup = {
  id: "explore" | "earn" | "company";
  label: string;
  items: NavItem[];
};

const topLinks = [
  { label: "Home", href: "/" },
  { label: "Opportunities", href: "/opportunities" },
  { label: "Creators", href: "/creators" },
] as const;

const iconCls = "h-5 w-5";

const IconCampaigns = () => (
  <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
    <path d="M15 4h5v5M20 4l-6 6" />
  </svg>
);
const IconCourses = () => (
  <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
  </svg>
);
const IconMarket = () => (
  <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9l1-5h16l1 5" />
    <path d="M3 9v11a1 1 0 001 1h16a1 1 0 001-1V9" />
    <path d="M9 22V12h6v10" />
  </svg>
);
const IconRefer = () => (
  <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4" />
  </svg>
);
const IconPartner = () => (
  <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);
const IconAbout = () => (
  <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);
const IconResources = () => (
  <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    <path d="M8 7h8M8 11h6" />
  </svg>
);
const IconFaq = () => (
  <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01" />
  </svg>
);

const navGroups: NavGroup[] = [
  {
    id: "explore",
    label: "Explore",
    items: [
      {
        label: "Campaigns",
        href: "/campaigns",
        description: "PPC, PPR and PPA offers to promote",
        icon: <IconCampaigns />,
      },
      {
        label: "Promote a post",
        href: "/promote",
        description: "Creators like, comment and repost your post",
        icon: <IconCampaigns />,
      },
      {
        label: "Courses",
        href: "/courses",
        description: "Learning products your audience can take",
        icon: <IconCourses />,
      },
      {
        label: "Marketplace",
        href: "/marketplace",
        description: "Tools and offers ready to share",
        icon: <IconMarket />,
      },
    ],
  },
  {
    id: "earn",
    label: "Earn",
    items: [
      {
        label: "Refer & Earn",
        href: "/refer-and-earn",
        description: "Invite creators and earn fee share",
        icon: <IconRefer />,
      },
      {
        label: "Become a Partner",
        href: "/partners",
        description: "Monetize your community traffic",
        icon: <IconPartner />,
      },
    ],
  },
  {
    id: "company",
    label: "Company",
    items: [
      {
        label: "About",
        href: "/about",
        description: "Why JobOrio exists for creators",
        icon: <IconAbout />,
      },
      {
        label: "Resources",
        href: "/resources",
        description: "Guides, tips and growth playbooks",
        icon: <IconResources />,
      },
      {
        label: "FAQ",
        href: "/faq",
        description: "Earnings, payouts and how it works",
        icon: <IconFaq />,
      },
    ],
  },
];

const TRANSPARENT_ON_TOP = ["/"];

const Chevron = ({ open }: { open: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Desktop dropdown                                                   */
/* ------------------------------------------------------------------ */

function DesktopDropdown({
  group,
  open,
  onOpen,
  onClose,
  isItemActive,
}: {
  group: NavGroup;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  isItemActive: (href: string) => boolean;
}) {
  const btnId = useId();
  const panelId = useId();
  const rootRef = useRef<HTMLLIElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const groupActive = group.items.some((i) => isItemActive(i.href));

  const clearClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    clearClose();
    closeTimer.current = setTimeout(onClose, 140);
  };

  useEffect(() => () => clearClose(), []);

  return (
    <li
      ref={rootRef}
      className="relative"
      onMouseEnter={() => {
        clearClose();
        onOpen();
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        id={btnId}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={panelId}
        onClick={() => (open ? onClose() : onOpen())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
            requestAnimationFrame(() => {
              rootRef.current
                ?.querySelector<HTMLElement>("[data-dropdown-item]")
                ?.focus();
            });
          }
        }}
        className={`inline-flex items-center gap-1.5 py-2 text-[15px] font-medium transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none ${
          open || groupActive ? "text-white" : "text-indigo-200"
        }`}
      >
        {group.label}
        <Chevron open={open} />
        <span
          className={`absolute inset-x-0 bottom-0 h-0.5 origin-left rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB] transition-transform duration-300 ${
            open || groupActive ? "scale-x-100" : "scale-x-0"
          }`}
        />
      </button>

      <div
        id={panelId}
        role="menu"
        aria-labelledby={btnId}
        aria-hidden={!open}
        className={`absolute left-1/2 top-full z-[120] w-[min(340px,calc(100vw-2rem))] -translate-x-1/2 pt-3 transition duration-150 ${
          open
            ? "visible pointer-events-auto translate-y-0 opacity-100"
            : "invisible pointer-events-none -translate-y-1 opacity-0"
        }`}
        onMouseEnter={clearClose}
        onMouseLeave={scheduleClose}
      >
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B1D4F]/95 p-2 shadow-2xl shadow-black/30 backdrop-blur-xl">
          {group.items.map((item) => {
            const active = isItemActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                data-dropdown-item
                onClick={onClose}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    onClose();
                    rootRef.current?.querySelector("button")?.focus();
                  }
                }}
                className={`flex items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none ${
                  active ? "bg-white/10" : ""
                }`}
              >
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-200">
                  {item.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-white">{item.label}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-indigo-200/80">
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */

export default function Header() {
  const pathname = usePathname() ?? "/";
  const overHero = TRANSPARENT_ON_TOP.includes(pathname);
  const hideOpportunities = pathname.startsWith("/creator");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<NavGroup["id"] | null>(null);
  const [mobileAccordion, setMobileAccordion] = useState<NavGroup["id"] | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  const visibleTopLinks = hideOpportunities
    ? topLinks.filter((l) => l.href !== "/opportunities")
    : topLinks;

  const isActive = useCallback(
    (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href)),
    [pathname],
  );

  const closeAllMenus = useCallback(() => {
    setDrawerOpen(false);
    setOpenDropdown(null);
    setAccountOpen(false);
  }, []);

  // Auth
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setAuthReady(true);
      return;
    }
    // Keep the current user/buttons on screen while re-checking (no flicker on navigation).
    let cancelled = false;
    fetchMe()
      .then((u) => {
        if (cancelled) return;
        rememberPublicCode(u);
        setUser(u);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setAuthReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Close menus on route change
  useEffect(() => {
    closeAllMenus();
    setMobileAccordion(null);
  }, [pathname, closeAllMenus]);

  // Sticky blur on scroll
  useEffect(() => {
    const getY = () =>
      Math.max(window.scrollY, document.documentElement.scrollTop, document.body.scrollTop);
    const onScroll = () => setScrolled(getY() > 8);
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, []);

  // Outside click (desktop dropdowns + account)
  useEffect(() => {
    if (!openDropdown && !accountOpen) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (headerRef.current && !headerRef.current.contains(t)) {
        setOpenDropdown(null);
      }
      if (accountRef.current && !accountRef.current.contains(t)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [openDropdown, accountOpen]);

  // Esc closes everything
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAllMenus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeAllMenus]);

  // Close drawer when crossing to desktop (≥1280, Tailwind `xl`)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setDrawerOpen(false);
        setMobileAccordion(null);
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Body scroll lock for drawer
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const solid = scrolled || drawerOpen || !overHero;

  return (
    <>
      <header
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-[100] w-full"
      >
        {/*
          Background lives on its own layer. A backdrop-filter on <header> itself makes it the
          containing block of `position: fixed` children, which collapsed the mobile drawer.
        */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 border-b transition-all duration-300 ${
            solid
              ? "border-white/10 bg-[linear-gradient(135deg,#0B1D4F_0%,#14296B_45%,#3F2AA8_100%)] shadow-[0_10px_30px_-12px_rgba(5,10,40,0.6)] backdrop-blur-xl"
              : "border-transparent bg-transparent"
          }`}
        />
        <nav
          className={`relative mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 transition-[height] duration-300 sm:px-8 xl:px-10 ${
            scrolled || drawerOpen ? "h-16" : "h-16 sm:h-20"
          }`}
          aria-label="Primary"
        >
          <Logo compact={scrolled} />

          {/* Desktop (≥1280) */}
          <ul className="hidden items-center gap-7 xl:flex 2xl:gap-9">
            {visibleTopLinks.map((l) => {
              const active = isActive(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative block py-2 text-[15px] font-medium transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none ${
                      active ? "text-white" : "text-indigo-200"
                    }`}
                  >
                    {l.label}
                    <span
                      className={`absolute inset-x-0 bottom-0 h-0.5 origin-left rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB] transition-transform duration-300 ${
                        active ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}

            {navGroups.map((group) => (
              <DesktopDropdown
                key={group.id}
                group={group}
                open={openDropdown === group.id}
                onOpen={() => setOpenDropdown(group.id)}
                onClose={() => setOpenDropdown((cur) => (cur === group.id ? null : cur))}
                isItemActive={isActive}
              />
            ))}
          </ul>

          {/* Right CTAs + account */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {authReady && user ? (
              <div className="relative hidden md:block" ref={accountRef}>
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  className="inline-flex max-w-[180px] items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                >
                  <span className="truncate">{accountLabel(user)}</span>
                  <Chevron open={accountOpen} />
                </button>
                {accountOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 z-[130] mt-2 w-52 rounded-xl border border-white/10 bg-[#0B1D4F] py-2 shadow-xl"
                  >
                    <p className="px-4 pb-2 text-xs font-semibold text-indigo-200">
                      Link id {publicCodeForUser(user)}
                    </p>
                    <Link
                      role="menuitem"
                      href={dashboardPath(user)}
                      onClick={() => setAccountOpen(false)}
                      className="block px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10"
                    >
                      My dashboard
                    </Link>
                    {user.creator ? (
                      <Link
                        role="menuitem"
                        href="/creator/settings"
                        onClick={() => setAccountOpen(false)}
                        className="block px-4 py-2.5 text-sm font-medium text-indigo-100 hover:bg-white/10"
                      >
                        Account settings
                      </Link>
                    ) : null}
                    {user.roles?.some((r) => r.name === "employer") ? (
                      <Link
                        role="menuitem"
                        href="/employer/dashboard"
                        onClick={() => setAccountOpen(false)}
                        className="block px-4 py-2.5 text-sm font-medium text-indigo-100 hover:bg-white/10"
                      >
                        Employer portal
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      role="menuitem"
                      className="block w-full px-4 py-2.5 text-left text-sm font-medium text-rose-200 hover:bg-white/10"
                      onClick={async () => {
                        setAccountOpen(false);
                        try {
                          await logoutApi();
                        } catch {
                          /* ignore */
                        }
                        clearAuthToken();
                        window.location.href = "/login";
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            ) : authReady ? (
              <>
                <Link
                  href="/hiring"
                  className="btn-tap hidden min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 md:inline-flex"
                >
                  Live Campaigns
                </Link>
                <Link
                  href="/signup"
                  className="btn-tap hidden min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 sm:inline-flex"
                >
                  Start Earning
                  <Arrow />
                </Link>
              </>
            ) : null}

            {/* Hamburger <1280 */}
            <button
              type="button"
              onClick={() => setDrawerOpen((v) => !v)}
              aria-expanded={drawerOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={drawerOpen ? "Close menu" : "Open menu"}
              className="tap-target flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white xl:hidden"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                {drawerOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile / tablet drawer */}
        <div
          id="mobile-nav-drawer"
          className={`xl:hidden ${drawerOpen ? "block" : "hidden"}`}
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 top-16 z-[90] cursor-default bg-black/50 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
          />

          <div
            className="fixed inset-x-0 bottom-0 top-16 z-[95] flex flex-col overflow-hidden border-t border-white/10 bg-[#0B1D4F] md:left-auto md:w-[420px] md:rounded-bl-3xl md:border-l"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
          >
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
              <ul className="space-y-1">
                {visibleTopLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setDrawerOpen(false)}
                      aria-current={isActive(l.href) ? "page" : undefined}
                      className={`flex min-h-12 items-center rounded-xl px-3 text-base font-medium transition hover:bg-white/10 ${
                        isActive(l.href) ? "bg-white/10 text-white" : "text-slate-200"
                      }`}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                {navGroups.map((group) => {
                  const expanded = mobileAccordion === group.id;
                  const panelId = `mobile-acc-${group.id}`;
                  return (
                    <div key={group.id} className="rounded-xl bg-white/5">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={panelId}
                        onClick={() =>
                          setMobileAccordion((cur) => (cur === group.id ? null : group.id))
                        }
                        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left text-base font-semibold text-white"
                      >
                        {group.label}
                        <Chevron open={expanded} />
                      </button>
                      {expanded ? (
                        <div id={panelId} className="space-y-1 px-2 pb-2">
                          {group.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setDrawerOpen(false)}
                              className={`flex min-h-14 items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-white/10 ${
                                isActive(item.href) ? "bg-white/10" : ""
                              }`}
                            >
                              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-200">
                                {item.icon}
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold text-white">
                                  {item.label}
                                </span>
                                <span className="mt-0.5 block text-xs leading-snug text-indigo-200/80">
                                  {item.description}
                                </span>
                              </span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div id={panelId} hidden />
                      )}
                    </div>
                  );
                })}
              </div>

              {authReady && user ? (
                <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                  <p className="px-1 text-xs font-bold uppercase tracking-wide text-indigo-300">
                    Signed in as {accountLabel(user)} · {publicCodeForUser(user)}
                  </p>
                  <Link
                    href={dashboardPath(user)}
                    onClick={() => setDrawerOpen(false)}
                    className="flex min-h-12 items-center justify-center rounded-xl bg-white/10 px-3 text-sm font-semibold text-white"
                  >
                    My account
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      setDrawerOpen(false);
                      try {
                        await logoutApi();
                      } catch {
                        /* ignore */
                      }
                      clearAuthToken();
                      window.location.href = "/login";
                    }}
                    className="flex min-h-12 w-full items-center justify-center rounded-xl px-3 text-sm font-semibold text-rose-200"
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>

            {/* Sticky CTAs at bottom */}
            <div className="shrink-0 space-y-2 border-t border-white/10 bg-[#0B1D4F] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
              <Link
                href="/signup"
                onClick={() => setDrawerOpen(false)}
                className="btn-tap flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB] px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25"
              >
                Start Earning
                <Arrow />
              </Link>
              <Link
                href="/hiring"
                onClick={() => setDrawerOpen(false)}
                className="btn-tap flex min-h-12 w-full items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 text-sm font-semibold text-white"
              >
                I&apos;m Hiring
              </Link>
              {authReady && !user ? (
                <Link
                  href="/login"
                  onClick={() => setDrawerOpen(false)}
                  className="flex min-h-11 w-full items-center justify-center text-sm font-medium text-indigo-200"
                >
                  Log in
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Push content below the fixed header on pages without a dark hero overlay */}
      {!overHero && <div aria-hidden="true" className="h-16 sm:h-20" />}
    </>
  );
}
