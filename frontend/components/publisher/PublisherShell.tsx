"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Network,
  Store,
  BarChart3,
  Wallet,
  Plug,
  History,
  Settings,
  LogOut,
} from "lucide-react";
import { clearAuthToken } from "@/lib/auth/session";
import { logoutApi } from "@/lib/api/auth";

const allNav = [
  { href: "/publisher/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/publisher/network", label: "My Network", icon: Network },
  { href: "/publisher/communities", label: "Communities", icon: Users },
  { href: "/publisher/marketplace", label: "Campaign Marketplace", icon: Store },
  { href: "/publisher/reports", label: "Performance Reports", icon: BarChart3 },
  {
    href: "/publisher/earnings",
    label: "Publisher Earnings",
    icon: Wallet,
    ownerOnly: true,
  },
  {
    href: "/publisher/integrations",
    label: "API & Integration",
    icon: Plug,
    ownerOnly: true,
  },
  {
    href: "/publisher/payments",
    label: "Payment History",
    icon: History,
    ownerOnly: true,
  },
  { href: "/publisher/settings", label: "Account Settings", icon: Settings },
];

export default function PublisherShell({
  children,
  username,
  role = "owner",
}: {
  children: React.ReactNode;
  username?: string;
  role?: "owner" | "manager";
}) {
  const pathname = usePathname();
  const nav = useMemo(
    () =>
      allNav.filter((item) => !(item.ownerOnly && role === "manager")),
    [role],
  );

  async function signOut() {
    try {
      await logoutApi();
    } catch {
      // ignore
    }
    clearAuthToken();
    window.location.href = "/publisher/login";
  }

  const path =
    pathname && pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname ?? "";

  return (
    <div className="min-h-[70vh] bg-[#f5f7ff] text-[#172b63]">
      <div className="mx-auto flex max-w-[1400px] gap-8 px-5 pb-12 pt-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-28 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
              Publisher studio
            </p>
            <p className="mt-1 text-lg font-bold">
              {username ? `@${username}` : "Your network"}
            </p>
            {role === "manager" ? (
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Manager · assigned communities
              </p>
            ) : null}

            <nav className="mt-6 space-y-1">
              {nav.map(({ href, label, icon: Icon }) => {
                const active = path === href || path.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-purple-500/20"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-6 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <nav className="-mx-1 mb-4 flex gap-1 overflow-x-auto px-1 pb-1 lg:hidden">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = path === href || path.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold ${
                    active
                      ? "bg-violet-600 text-white"
                      : "bg-white text-slate-600 ring-1 ring-slate-200"
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-500 ring-1 ring-slate-200"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </nav>
          <main className="min-w-0 pt-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
