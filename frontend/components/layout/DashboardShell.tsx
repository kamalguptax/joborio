"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { ChevronDown, ExternalLink, LogOut } from "lucide-react";
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

type AccountMenuProps = Pick<Props, "userName" | "userHint" | "profileHref" | "profileLabel" | "onSignOut">;

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
  onSignOut,
}: AccountMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initial = (userName.replace(/^@/, "").trim()[0] ?? "U").toUpperCase();

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
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-sm font-bold text-white">
          {initial}
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
          className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
        >
          {userHint ? <p className="px-3 py-2 text-xs text-slate-500">{userHint}</p> : null}
          {profileHref ? (
            <Link
              role="menuitem"
              href={profileHref}
              target="_blank"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink size={16} aria-hidden="true" />
              {profileLabel}
            </Link>
          ) : null}
          <button
            type="button"
            role="menuitem"
            onClick={() => void onSignOut()}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </button>
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
  onSignOut,
  topRight,
  children,
}: Props) {
  const path = normalize(usePathname());

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
            onSignOut={onSignOut}
          />
        </div>

        <p className="px-6 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Menu
        </p>
        <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
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

        <div className="p-4">
          <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-blue-50/70 p-4">
            <p className="text-sm font-bold text-[#0F1B3D]">Need a hand?</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Read the FAQ or get in touch and we will help you out.
            </p>
            <div className="mt-3 flex gap-2">
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
        </div>
      </aside>

      <div className="min-w-0 bg-[radial-gradient(55%_38%_at_100%_0%,rgba(124,58,237,0.07),transparent_65%)]">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <AccountMenu
                userName={userName}
                userHint={userHint}
                profileHref={profileHref}
                profileLabel={profileLabel}
                onSignOut={onSignOut}
              />
            </div>
            <div className="flex shrink-0 items-center gap-2">{topRight}</div>
          </div>
          <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-3 pb-3">
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

        <main className="dash-content w-full px-5 pb-16 pt-6 lg:px-8 lg:pt-7 xl:px-10 2xl:px-12">
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
