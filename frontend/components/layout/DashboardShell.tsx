"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import {
  ChevronDown,
  CircleHelp,
  Globe,
  Lightbulb,
  LogOut,
  MessageCircle,
  UserRound,
} from "lucide-react";
import { fetchMe } from "@/lib/api/auth";
import type { User } from "@/lib/api/types";
import { getAuthToken } from "@/lib/auth/session";
import { readCachedUser } from "@/lib/auth/userCache";
import {
  computeProfileCompletion,
  type ProfileCompletion,
} from "@/lib/profileCompletion";
import Logo from "@/components/layout/Logo";
import DashboardBreadcrumb, {
  buildDashboardBreadcrumbs,
} from "@/components/layout/DashboardBreadcrumb";
import DashboardGlobalSearch, {
  type DashboardSearchItem,
} from "@/components/layout/DashboardGlobalSearch";
import { PageHeaderProvider } from "@/components/layout/PageHeader";
import { DEFAULT_AVATAR } from "@/lib/defaultAvatar";
import { Toaster } from "@/components/ui/Toast";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  /** Extra paths that should also highlight this item. */
  alsoActive?: string[];
  /** Optional count / pill shown on the right of the nav label. */
  badge?: string | number;
};

export type { DashboardSearchItem };

type Props = {
  nav: DashboardNavItem[];
  /** Name shown at the top of the sidebar. */
  userName: string;
  /** Small line under the name in the account menu. */
  userHint?: string;
  /** Optional "view public page" link in the account menu. */
  profileHref?: string;
  profileLabel?: string;
  /** Account / settings page in the top-left account menu. */
  settingsHref?: string;
  /** Label for settingsHref (default: Account). */
  settingsLabel?: string;
  onSignOut: () => void | Promise<void>;
  /** Controls in the top-right of the content area (settings, bell…). */
  topRight?: ReactNode;
  /** Extra global-search destinations beyond nav + role defaults. */
  searchExtras?: DashboardSearchItem[];
  /** Optional block under the menu (e.g. creator leaderboard). */
  sidebarExtra?: ReactNode;
  children: ReactNode;
};

function normalize(path: string | null): string {
  if (!path) return "";
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

function pathMatchesItem(path: string, item: DashboardNavItem): boolean {
  const hit = (p: string) => path === p || path.startsWith(`${p}/`);
  return hit(item.href) || (item.alsoActive?.some(hit) ?? false);
}

/** Prefer the longest matching nav href so /programs/new does not also light up Programs. */
function isActive(
  path: string,
  item: DashboardNavItem,
  nav: DashboardNavItem[],
): boolean {
  if (!pathMatchesItem(path, item)) return false;
  const better = nav.some(
    (other) =>
      other !== item &&
      pathMatchesItem(path, other) &&
      other.href.length > item.href.length,
  );
  return !better;
}

type AccountMenuProps = Pick<
  Props,
  | "userName"
  | "userHint"
  | "profileHref"
  | "profileLabel"
  | "settingsHref"
  | "settingsLabel"
  | "onSignOut"
> & { avatarUrl?: string | null; completion?: ProfileCompletion | null };

/** Profile photo + profile-completion of the signed-in user; refreshes when account settings change. */
function useAccountProfile(): {
  avatarUrl: string | null;
  completion: ProfileCompletion | null;
} {
  // Start empty so server and first client render match (localStorage is client-only);
  // the cached user is applied right after mount, then refreshed from the API.
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const token = getAuthToken();
    const cached = token ? readCachedUser(token) : null;
    if (cached) setUser(cached);
    const load = () => {
      if (!getAuthToken()) return;
      fetchMe()
        .then((u) => setUser(u))
        .catch(() => undefined);
    };
    load();
    window.addEventListener("joborio:account-updated", load);
    return () => window.removeEventListener("joborio:account-updated", load);
  }, []);
  return {
    avatarUrl: user?.avatar_url ?? null,
    completion: computeProfileCompletion(user),
  };
}

/** Circular progress line drawn around an avatar (percent 0-100). */
function AvatarRing({
  percent,
  className,
  children,
}: {
  percent: number;
  className: string; // size, e.g. "h-10 w-10"
  children: ReactNode;
}) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const complete = percent >= 100;
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center ${className}`}
      title={`Profile ${percent}% complete`}
    >
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full -rotate-90 ${
          complete ? "text-emerald-500" : "text-violet-600"
        }`}
      >
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="7" className="stroke-slate-200" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(Math.max(percent, 0), 100) / 100)}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      {children}
      {!complete ? (
        <span className="absolute -bottom-1 -right-1 rounded-full bg-white px-1 text-[9px] font-bold leading-4 text-violet-700 shadow-sm ring-1 ring-violet-200">
          {percent}%
        </span>
      ) : null}
    </span>
  );
}

/** Optional WhatsApp channel for product updates; the menu item shows only when this is set. */
const WHATSAPP_UPDATES_URL = process.env.NEXT_PUBLIC_WHATSAPP_UPDATES_URL || "";

function MenuLink({
  href,
  icon: Icon,
  external = false,
  onDone,
  children,
}: {
  href: string;
  icon: ComponentType<{ size?: number; "aria-hidden"?: boolean | "true" | "false" }>;
  external?: boolean;
  onDone: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      role="menuitem"
      href={href}
      onClick={onDone}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-slate-700 transition hover:bg-slate-50 hover:text-[#0A2150] focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"
    >
      <Icon size={18} aria-hidden="true" />
      <span className="truncate">{children}</span>
    </Link>
  );
}

/**
 * Account dropdown. Rendered once in the desktop sidebar and once in the mobile
 * top bar, so each instance must own its state and ref (a shared ref made the
 * hidden instance win and every click inside the open menu count as "outside").
 */
function AccountMenu({
  userName,
  userHint,
  profileHref,
  profileLabel = "Public page",
  settingsHref,
  settingsLabel = "Account",
  avatarUrl,
  completion,
  onSignOut,
}: AccountMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const close = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"
      >
        {(() => {
          const avatar = (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl || DEFAULT_AVATAR} alt="" className="h-full w-full object-cover" />
            </span>
          );
          return completion ? (
            <AvatarRing percent={completion.percent} className="h-10 w-10">
              {avatar}
            </AvatarRing>
          ) : (
            avatar
          );
        })()}
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#0A2150]">{userName}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 text-slate-400 transition ${menuOpen ? "rotate-180" : ""}`}
        />
      </button>

      {menuOpen ? (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10"
        >
          {/* Who is signed in */}
          <div className="flex items-center gap-3 px-3 pb-3 pt-2.5">
            {(() => {
              const avatar = (
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 ${
                    completion ? "" : "ring-2 ring-violet-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarUrl || DEFAULT_AVATAR} alt="" className="h-full w-full object-cover" />
                </span>
              );
              return completion ? (
                <AvatarRing percent={completion.percent} className="h-14 w-14">
                  {avatar}
                </AvatarRing>
              ) : (
                avatar
              );
            })()}
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold text-[#0A2150]">{userName}</p>
              {userHint ? <p className="truncate text-xs text-slate-500">{userHint}</p> : null}
            </div>
          </div>

          {completion && completion.percent < 100 ? (
            <div className="mx-1 mb-2 rounded-xl bg-violet-50/70 px-3 py-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#0A2150]">
                <span>Profile {completion.percent}% complete</span>
                <span className="text-slate-500">
                  {completion.done}/{completion.total}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-violet-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all"
                  style={{ width: `${completion.percent}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
                Next: {completion.missing.slice(0, 2).join(" · ")}
              </p>
              {settingsHref ? (
                <Link
                  href={settingsHref}
                  onClick={close}
                  className="mt-1.5 inline-block text-xs font-semibold text-violet-700 hover:underline"
                >
                  Complete profile →
                </Link>
              ) : null}
            </div>
          ) : null}

          <div role="separator" className="mx-1 border-t border-slate-100" />
          <div className="py-1.5">
            {settingsHref ? (
              <MenuLink href={settingsHref} icon={UserRound} onDone={close}>
                {settingsLabel}
              </MenuLink>
            ) : null}
            {profileHref ? (
              <MenuLink href={profileHref} icon={Globe} external onDone={close}>
                {profileLabel}
              </MenuLink>
            ) : null}
            {WHATSAPP_UPDATES_URL ? (
              <MenuLink href={WHATSAPP_UPDATES_URL} icon={MessageCircle} external onDone={close}>
                Subscribe to WhatsApp updates
              </MenuLink>
            ) : null}
          </div>

          <div role="separator" className="mx-1 border-t border-slate-100" />
          <div className="py-1.5">
            <MenuLink href="/contact" icon={CircleHelp} onDone={close}>
              Ask question
            </MenuLink>
            <MenuLink href="/feedback" icon={Lightbulb} onDone={close}>
              Share Feedback
            </MenuLink>
          </div>

          <div role="separator" className="mx-1 border-t border-slate-100" />
          <div className="pt-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => void onSignOut()}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] font-medium text-red-600 transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
            >
              <LogOut size={18} aria-hidden="true" />
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * App shell for every signed-in area (creator, employer, publisher):
 * full-height sidebar on the left, content on the right. No marketing header/footer.
 */
export default function DashboardShell({
  nav,
  userName,
  userHint,
  profileHref,
  profileLabel = "Public page",
  settingsHref,
  settingsLabel = "Account",
  onSignOut,
  topRight,
  searchExtras,
  sidebarExtra,
  children,
}: Props) {
  const pathname = usePathname();
  const path = normalize(pathname);
  const { avatarUrl, completion } = useAccountProfile();
  const breadcrumbs = buildDashboardBreadcrumbs(pathname, nav, {
    settingsHref,
    settingsLabel,
    profileHref,
    profileLabel,
  });

  // Heading shown on every page that does not render its own <PageHeader />.
  const lastCrumb = breadcrumbs[breadcrumbs.length - 1];
  const pageTitle = lastCrumb?.label;
  // Nested pages (Home > Parent > Page) get a back button to the parent.
  const backCrumb =
    breadcrumbs.length > 2 ? breadcrumbs[breadcrumbs.length - 2] : undefined;

  const globalSearch = (
    <DashboardGlobalSearch
      nav={nav}
      settingsHref={settingsHref}
      settingsLabel={settingsLabel}
      profileHref={profileHref}
      profileLabel={profileLabel}
      extras={searchExtras}
    />
  );

  return (
    <div className="min-h-svh bg-[#F8F8FB] text-[#0A2150] lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <Toaster />
      {/* Desktop sidebar: full height, pinned */}
      <aside className="hidden border-r border-slate-200/80 bg-white lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col">
        <div className="px-5 pb-4 pt-6">
          <Logo tone="dark" />
        </div>

        <div className="px-4 pb-3">
          <AccountMenu
            userName={userName}
            userHint={userHint}
            profileHref={profileHref}
            profileLabel={profileLabel}
            settingsHref={settingsHref}
            settingsLabel={settingsLabel}
            avatarUrl={avatarUrl}
            completion={completion}
            onSignOut={onSignOut}
          />
        </div>

        <p className="shrink-0 px-6 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Menu
        </p>
        <nav
          aria-label="Main"
          className="dash-scroll-visible min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-2 pb-4 pr-1"
        >
          {nav.map((item) => {
            const active = isActive(path, item, nav);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-gradient-to-r from-violet-50 to-fuchsia-500/60 text-violet-700 shadow-[inset_0_0_0_1px_rgba(196,181,253,0.45)]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#0A5FCF] to-[#2563EB]"
                  />
                ) : null}
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                    active
                      ? "bg-white text-violet-600 shadow-sm ring-1 ring-violet-100"
                      : "bg-slate-100/80 text-slate-500 group-hover:bg-white group-hover:text-slate-700 group-hover:ring-1 group-hover:ring-slate-200"
                  }`}
                >
                  <Icon size={17} />
                </span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.badge != null && String(item.badge) !== "" ? (
                  <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 space-y-3 border-t border-slate-100 p-4">
          {sidebarExtra ? <div>{sidebarExtra}</div> : null}
          <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-500/70 p-4">
            <p className="text-sm font-bold text-[#0A2150]">Need a hand?</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Ask the chat assistant, get in touch or share feedback and we will help you out.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/feedback"
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm ring-1 ring-violet-100 transition hover:bg-violet-50"
              >
                Feedback
              </Link>
              <Link
                href="/contact"
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:text-violet-700"
              >
                Contact us
              </Link>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void onSignOut()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0 overflow-x-hidden bg-[radial-gradient(55%_38%_at_100%_0%,rgba(10,95,207,0.07),transparent_65%)]">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <AccountMenu
                userName={userName}
                userHint={userHint}
                profileHref={profileHref}
                profileLabel={profileLabel}
                settingsHref={settingsHref}
                settingsLabel={settingsLabel}
                avatarUrl={avatarUrl}
                completion={completion}
                onSignOut={onSignOut}
              />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {globalSearch}
              {topRight}
            </div>
          </div>
          <nav
            aria-label="Main"
            className="dash-scroll-x flex gap-1 overflow-x-auto overflow-y-hidden px-3 pb-3"
          >
            {nav.map((item) => {
              const active = isActive(path, item, nav);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    active
                      ? "bg-violet-600 text-white"
                      : "bg-white text-slate-600 ring-1 ring-slate-200"
                  }`}
                >
                  <Icon size={14} />
                  {item.label}
                  {item.badge != null && String(item.badge) !== "" ? (
                    <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <main className="dash-content w-full max-w-full px-5 pb-16 pt-6 lg:px-8 lg:pt-7 xl:px-10 2xl:px-12">
          <div className="mb-4 hidden items-center justify-between gap-4 lg:flex">
            <div id="dash-header-slot" className="flex min-w-0 flex-1 items-center gap-3" />
            <div className="flex shrink-0 items-center gap-2">
              {globalSearch}
              {topRight}
            </div>
          </div>
          <DashboardBreadcrumb items={breadcrumbs} />
          <PageHeaderProvider
            resetKey={path}
            fallbackTitle={pageTitle}
            fallbackBackHref={backCrumb?.href}
            fallbackBackLabel={backCrumb?.label}
          >
            {children}
          </PageHeaderProvider>
        </main>
      </div>
    </div>
  );
}
