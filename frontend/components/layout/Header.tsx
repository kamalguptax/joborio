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
import { Building2, LayoutDashboard, LogOut, Megaphone, Settings, Users } from "lucide-react";
import { homePathForUser } from "@/lib/auth/redirect";
import { loginPathForUser } from "@/lib/auth/authRoutes";
import { fetchMe, logoutApi } from "@/lib/api/auth";
import type { User } from "@/lib/api/types";
import { clearAuthToken, getAuthToken, rememberPublicCode } from "@/lib/auth/session";
import { publicCodeForUser } from "@/lib/tracking/subid";
import Logo from "./Logo";

/* ------------------------------------------------------------------ */
/*  Auth helpers                                                       */
/* ------------------------------------------------------------------ */

/** Dashboard link by account type (creator / brand / publisher / network / admin). */
function dashboardPath(user: User): string {
  return homePathForUser(user);
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
  id: "earn";
  label: string;
  items: NavItem[];
};

const topLinks = [
  { label: "Home", href: "/" },
  { label: "Creators", href: "/creators" },
  { label: "Brands", href: "/brands" },
  { label: "About", href: "/about" },
] as const;

const iconCls = "h-5 w-5";

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

const navGroups: NavGroup[] = [
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

/** Role-specific login + signup entry points shown in the "Login / Signup" menu. */
const LOGIN_ROLES = [
  { label: "Creator", desc: "Share opportunities and earn", login: "/creator/login", signup: "/creator/register", Icon: Megaphone },
  { label: "Publisher", desc: "Manage your communities", login: "/publisher/login", signup: "/publisher/register", Icon: Users },
  { label: "Brand", desc: "Launch and track campaigns", login: "/brand/login", signup: "/brand/register", Icon: Building2 },
] as const;

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
          className={`absolute inset-x-0 bottom-0 h-0.5 origin-left rounded-full bg-gradient-to-r from-[#0A5FCF] to-[#2563EB] transition-transform duration-300 ${
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
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0A2150]/95 p-2 shadow-2xl shadow-black/30 backdrop-blur-xl">
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

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<NavGroup["id"] | null>(null);
  const [mobileAccordion, setMobileAccordion] = useState<NavGroup["id"] | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const visibleTopLinks: ReadonlyArray<{ label: string; href: string }> =
    topLinks;
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

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

  // "Login / Signup" menu: close on outside click or Escape
  useEffect(() => {
    if (!loginOpen) return;
    const onDown = (e: MouseEvent) => {
      if (loginRef.current && !loginRef.current.contains(e.target as Node)) setLoginOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLoginOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [loginOpen]);

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
      <header ref={headerRef} className="fixed inset-x-0 top-3 z-[100] w-full px-3 sm:top-4 sm:px-4 xl:px-6">
     
        <nav
          className={`relative mx-auto flex max-w-[1600px]  items-center justify-between gap-3 px-4 transition-[height] duration-300 sm:px-8 xl:px-10 rounded-[12px] lg:rounded-[34px] bg-[#0a2150] ${
            scrolled || drawerOpen ? "py-2 " : "py-2"
          }`}
          aria-label="Primary"
        >
          <Logo compact={scrolled} />

          {/* Desktop (≥1280) */}
          <ul className="hidden items-center gap-5 xl:flex 2xl:gap-9">
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
                      className={`absolute inset-x-0 bottom-0 h-0.5 origin-left rounded-full bg-gradient-to-r from-[#0A5FCF] to-[#2563EB] transition-transform duration-300 ${
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
                  className="inline-flex max-w-[200px] items-center gap-2 rounded-full border border-white/20 bg-white/10 py-1.5 pl-1.5 pr-3.5 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0A5FCF] to-[#2563EB] text-xs font-bold uppercase text-white"
                  >
                    {accountLabel(user).replace(/^@/, "").charAt(0) || "U"}
                  </span>
                  <span className="truncate">{accountLabel(user)}</span>
                  <Chevron open={accountOpen} />
                </button>
                {accountOpen ? (
                  <div
                    role="menu"
                    className="menu-pop absolute right-0 z-[130] mt-3 w-64 origin-top-right rounded-2xl border border-white/10 bg-[#0A2150] p-2 shadow-2xl shadow-black/40 ring-1 ring-black/10"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute -top-1.5 right-8 h-3 w-3 rotate-45 border-l border-t border-white/10 bg-[#0A2150]"
                    />
                    <div className="mb-1 flex items-center gap-3 rounded-xl bg-white/[0.06] px-3 py-3">
                      <span
                        aria-hidden="true"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0A5FCF] to-[#2563EB] text-base font-bold uppercase text-white ring-2 ring-white/15"
                      >
                        {accountLabel(user).replace(/^@/, "").charAt(0) || "U"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">{accountLabel(user)}</p>
                        <p className="mt-0.5 inline-flex items-center rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-indigo-100">
                          Link ID · {publicCodeForUser(user)}
                        </p>
                      </div>
                    </div>

                    <Link
                      role="menuitem"
                      href={dashboardPath(user)}
                      onClick={() => setAccountOpen(false)}
                      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-indigo-50 transition hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:outline-none"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] text-indigo-200 transition group-hover:bg-white/15 group-hover:text-white">
                        <LayoutDashboard size={16} aria-hidden="true" />
                      </span>
                      My dashboard
                    </Link>
                    {user.creator ? (
                      <Link
                        role="menuitem"
                        href="/creator/profile"
                        onClick={() => setAccountOpen(false)}
                        className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-indigo-50 transition hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:outline-none"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] text-indigo-200 transition group-hover:bg-white/15 group-hover:text-white">
                          <Settings size={16} aria-hidden="true" />
                        </span>
                        Account settings
                      </Link>
                    ) : null}
                    {user.roles?.some((r) => r.name === "employer") ? (
                      <Link
                        role="menuitem"
                        href="/brand/dashboard"
                        onClick={() => setAccountOpen(false)}
                        className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-indigo-50 transition hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:outline-none"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] text-indigo-200 transition group-hover:bg-white/15 group-hover:text-white">
                          <Building2 size={16} aria-hidden="true" />
                        </span>
                        Employer portal
                      </Link>
                    ) : null}

                    <div className="my-2 h-px bg-white/10" />

                    <button
                      type="button"
                      role="menuitem"
                      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15 hover:text-rose-100 focus-visible:bg-rose-500/15 focus-visible:outline-none"
                      onClick={async () => {
                        setAccountOpen(false);
                        try {
                          await logoutApi();
                        } catch {
                          /* ignore */
                        }
                        clearAuthToken();
                        window.location.href = loginPathForUser(user);
                      }}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-300 transition group-hover:bg-rose-500/20">
                        <LogOut size={16} aria-hidden="true" />
                      </span>
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            ) : authReady ? (
              <>
                <div className="relative" ref={loginRef}>
                  <button
                    type="button"
                    onClick={() => setLoginOpen((v) => !v)}
                    aria-expanded={loginOpen}
                    aria-controls="login-menu"
                    className="btn-tap inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    Login / Signup
                    <Chevron open={loginOpen} />
                  </button>
                  {loginOpen ? (
                    <div
                      id="login-menu"
                      className="absolute right-0 top-full z-[100] mt-3 w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#0A2150] shadow-2xl shadow-black/40"
                    >
                      <ul className="py-2">
                        {LOGIN_ROLES.map(({ label, desc, login, Icon }) => (
                          <li key={login}>
                            <Link
                              href={login}
                              onClick={() => setLoginOpen(false)}
                              className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/10"
                            >
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                                <Icon size={18} aria-hidden="true" />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold text-white">{label} login</span>
                                <span className="block text-xs text-indigo-200/80">{desc}</span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <div className="border-t border-white/10 bg-white/5 px-4 py-3">
                        <p className="text-xs text-indigo-200/80">New here? Create an account as</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {LOGIN_ROLES.map(({ label, signup }) => (
                            <Link
                              key={signup}
                              href={signup}
                              onClick={() => setLoginOpen(false)}
                              className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/10"
                            >
                              {label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

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
            className="fixed inset-x-0 bottom-0 top-16 z-[95] flex flex-col overflow-hidden border-t border-white/10 bg-[#0A2150] md:left-auto md:w-[420px] md:rounded-bl-3xl md:border-l"
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
                      window.location.href = loginPathForUser(user);
                    }}
                    className="flex min-h-12 w-full items-center justify-center rounded-xl px-3 text-sm font-semibold text-rose-200"
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>

            {/* Sticky CTAs at bottom */}
            <div className="shrink-0 space-y-2 border-t border-white/10 bg-[#0A2150] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
              <Link
                href="/signup"
                onClick={() => setDrawerOpen(false)}
                className="btn-tap flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0A5FCF] to-[#2563EB] px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25"
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
                <div className="space-y-2 pt-1">
                  <p className="text-center text-xs font-medium uppercase tracking-wider text-indigo-300/70">
                    Log in as
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {LOGIN_ROLES.map(({ label, login }) => (
                      <Link
                        key={login}
                        href={login}
                        onClick={() => setDrawerOpen(false)}
                        className="flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-2 text-sm font-semibold text-white transition hover:bg-white/15"
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                  <p className="text-center text-xs text-indigo-200/80">
                    New here? Sign up as{" "}
                    {LOGIN_ROLES.map(({ label, signup }, i) => (
                      <span key={signup}>
                        {i > 0 ? " · " : ""}
                        <Link
                          href={signup}
                          onClick={() => setDrawerOpen(false)}
                          className="font-semibold text-white underline-offset-2 hover:underline"
                        >
                          {label}
                        </Link>
                      </span>
                    ))}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Push content below the fixed header on pages without a dark hero overlay */}
      {/* {!overHero && <div aria-hidden="true" className="h-16 sm:h-20" />} */}
    </>
  );
}