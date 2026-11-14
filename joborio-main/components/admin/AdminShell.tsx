"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Rss,
  SlidersHorizontal,
  Briefcase,
  Users,
  Activity,
  Globe,
  MapPin,
  List,
  Megaphone,
  ShieldAlert,
  Scale,
  Wallet,
  TrendingUp,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { logoutApi } from "@/lib/api/auth";
import { clearAuthToken } from "@/lib/auth/session";

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/settings", label: "Platform settings", icon: Settings },
    ],
  },
  {
    label: "Jobs & feeds",
    items: [
      { href: "/admin/syndication-feeds", label: "XML feeds", icon: Rss },
      { href: "/admin/jobs", label: "Jobs catalog", icon: Briefcase },
      { href: "/admin/job-masters", label: "Filter masters", icon: SlidersHorizontal },
      { href: "/admin/listings", label: "Listings", icon: List },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/activity", label: "Activity", icon: Activity },
      { href: "/admin/geo", label: "Geo map", icon: MapPin },
      { href: "/admin/website-tracking", label: "Website tracking", icon: Globe },
    ],
  },
  {
    label: "Money & trust",
    items: [
      { href: "/admin/campaigns", label: "Manual campaigns", icon: Megaphone },
      { href: "/admin/programs", label: "Programs", icon: Megaphone },
      { href: "/admin/campaign-earnings", label: "Campaign earnings", icon: TrendingUp },
      { href: "/admin/payouts", label: "Payouts", icon: Wallet },
      { href: "/admin/fraud", label: "Fraud queue", icon: ShieldAlert },
      { href: "/admin/disputes", label: "Disputes", icon: Scale },
    ],
  },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const signOut = async () => {
    try {
      await logoutApi();
    } catch {
      /* ignore */
    }
    clearAuthToken();
    window.location.href = "/login";
  };

  return (
    <div className="admin-console min-h-screen bg-zinc-950 text-zinc-200">
      <div className="flex min-h-screen">
        {/* Sidebar — desktop */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-800 bg-zinc-900 transition-transform lg:static lg:translate-x-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-4">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500 text-xs font-black text-zinc-950">
                OP
              </span>
              <div>
                <p className="font-display text-sm font-bold leading-none text-zinc-50">
                  JobOrio Ops
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Admin console
                </p>
              </div>
            </Link>
            <button
              type="button"
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {navGroups.map((group) => (
              <div key={group.label} className="mb-6">
                <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map(({ href, label, icon: Icon }) => {
                    const active =
                      pathname === href || pathname.startsWith(`${href}/`);
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition ${
                            active
                              ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25"
                              : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100"
                          }`}
                        >
                          <Icon size={18} className="shrink-0 opacity-90" />
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="border-t border-zinc-800 p-3 space-y-1">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
            >
              <ExternalLink size={16} />
              Public site
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-zinc-500 hover:bg-zinc-800 hover:text-red-300"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </aside>

        {mobileOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            aria-label="Close overlay"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-zinc-800 bg-zinc-950/90 px-4 backdrop-blur-md lg:px-6">
            <button
              type="button"
              className="rounded-lg border border-zinc-800 p-2 text-zinc-400 hover:bg-zinc-900 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <p className="text-xs font-medium text-zinc-500">
              Platform operations · not visible to creators
            </p>
          </header>

          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
