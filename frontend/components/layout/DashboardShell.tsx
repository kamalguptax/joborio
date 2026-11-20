"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import {
  BookOpen,
  ChevronDown,
  CircleHelp,
  Globe,
  Lightbulb,
  LogOut,
  MessageCircle,
  UserRound,
} from "lucide-react";
import { fetchMe } from "@/lib/api/auth";
import { getAuthToken } from "@/lib/auth/session";
import { readCachedUser } from "@/lib/auth/userCache";
import Logo from "@/components/layout/Logo";
import { Toaster } from "@/components/ui/Toast";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  /** Extra paths that should also highlight this item. */
  alsoActive?: string[];
};

type Props = {
  nav: DashboardNavItem[];
  /** Name shown at the top of the sidebar. */
  userName: string;
  /** Small line under the name in the account menu. */
  userHint?: string;
  /** Optional "view public page" link in the account menu. */
  profileHref?: string;
  profileLabel?: string;
  /** "Profile settings" page (photo, name, username, password). */
  settingsHref?: string;
  onSignOut: () => void | Promise<void>;
  /** Controls in the top-right of the content area (settings, bell…). */
  topRight?: ReactNode;
  children: ReactNode;
};

function normalize(path: string | null): string {
  if (!path) return "";
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

function isActive(path: string, item: DashboardNavItem): boolean {
  const hit = (p: string) => path === p || path.startsWith(`${p}/`);
  return hit(item.href) || (item.alsoActive?.some(hit) ?? false);
}

type AccountMenuProps = Pick<
  Props,
  "userName" | "userHint" | "profileHref" | "profileLabel" | "settingsHref" | "onSignOut"
> & { avatarUrl?: string | null };

/** Profile photo of the signed-in user; refreshes when account settings change. */
function useAccountAvatar(): string | null {
  const [url, setUrl] = useState<string | null>(() => {
    const token = getAuthToken();
    return token ? (readCachedUser(token)?.avatar_url ?? null) : null;
  });
  useEffect(() => {
    const load = () => {
      if (!getAuthToken()) return;
      fetchMe()
        .then((u) => setUrl(u.avatar_url ?? null))
        .catch(() => undefined);
    };
    load();
    window.addEventListener("joborio:account-updated", load);
    return () => window.removeEventListener("joborio:account-updated", load);
  }, []);
  return url;
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
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-slate-700 transition hover:bg-slate-50 hover:text-[#0F1B3D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"
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
  avatarUrl,
  onSignOut,
}: AccountMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initial = (userName.replace(/^@/, "").trim()[0] ?? "U").toUpperCase();
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
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-sm font-bold text-white">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#0F1B3D]">{userName}</span>
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
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-lg font-bold text-white ring-2 ring-violet-100">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold text-[#0F1B3D]">{userName}</p>
              {userHint ? <p className="truncate text-xs text-slate-500">{userHint}</p> : null}
            </div>
          </div>

          <div role="separator" className="mx-1 border-t border-slate-100" />
          <div className="py-1.5">
            {settingsHref ? (
              <MenuLink href={settingsHref} icon={UserRound} onDone={close}>
                Account
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
            <MenuLink href="/faq" icon={BookOpen} onDone={close}>
              Help Topics
            </MenuLink>
            <MenuLink href="/contact" icon={Lightbulb} onDone={close}>
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
  onSignOut,
  topRight,
  children,
}: Props) {
  const path = normalize(usePathname());
  const avatarUrl = useAccountAvatar();

  return (
    <div className="min-h-svh bg-[#F8F8FB] text-[#0F1B3D] lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
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
            avatarUrl={avatarUrl}
            onSignOut={onSignOut}
          />
        </div>

        <p className="px-6 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Menu
        </p>
        <nav
          aria-label="Main"
          className="dash-scroll flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 pb-4"
        >
          {nav.map((item) => {
            const active = isActive(path, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-gradient-to-r from-violet-50 to-blue-50/60 text-violet-700 shadow-[inset_0_0_0_1px_rgba(196,181,253,0.45)]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#7C3AED] to-[#2563EB]"
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
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 space-y-3 border-t border-slate-100 p-4">
          <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-blue-50/70 p-4">
            <p className="text-sm font-bold text-[#0F1B3D]">Need a hand?</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Read the FAQ or get in touch and we will help you out.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/faq"
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm ring-1 ring-violet-100 transition hover:bg-violet-50"
              >
                FAQ
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

      <div className="min-w-0 overflow-x-hidden bg-[radial-gradient(55%_38%_at_100%_0%,rgba(124,58,237,0.07),transparent_65%)]">
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
                avatarUrl={avatarUrl}
                onSignOut={onSignOut}
              />
            </div>
            <div className="flex shrink-0 items-center gap-2">{topRight}</div>
          </div>
          <nav
            aria-label="Main"
            className="dash-scroll-x flex gap-1 overflow-x-auto overflow-y-hidden px-3 pb-3"
          >
            {nav.map((item) => {
              const active = isActive(path, item);
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
                </Link>
              );
            })}
          </nav>
        </div>

        <main className="dash-content w-full max-w-full px-5 pb-16 pt-6 lg:px-8 lg:pt-7 xl:px-10 2xl:px-12">
          {topRight ? (
            <div className="mb-4 hidden items-center justify-between gap-4 lg:flex">
              <div id="dash-header-slot" className="flex min-w-0 items-center gap-3" />
              <div className="flex shrink-0 items-center gap-2">{topRight}</div>
            </div>
          ) : (
            <div
              id="dash-header-slot"
              className="mb-4 hidden min-w-0 items-center gap-3 lg:flex lg:empty:hidden"
            />
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
