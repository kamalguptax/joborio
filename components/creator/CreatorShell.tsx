"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MousePointerClick,
  Briefcase,
  Megaphone,
  Wallet,
  Landmark,
  Settings,
  ExternalLink,
  LogOut,
  UserPlus,
  Gift,
  Sparkles,
  Shield,
  SlidersHorizontal,
} from "lucide-react";
import CreatorNotificationBell from "@/components/creator/CreatorNotificationBell";
import { clearAuthToken } from "@/lib/auth/session";
import { logoutApi } from "@/lib/api/auth";
import { creatorProfilePath } from "@/lib/staticExport";

const nav = [
  { href: "/creator/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/creator/clicks", label: "Clicks", icon: MousePointerClick },
  { href: "/creator/opportunities", label: "Opportunities", icon: Briefcase },
  {
    href: "/creator/job-preferences",
    label: "Job preferences",
    icon: SlidersHorizontal,
  },
  { href: "/creator/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/creator/registrations", label: "Registrations", icon: UserPlus },
  { href: "/creator/referrals", label: "Referrals", icon: Gift },
  { href: "/creator/ai-studio", label: "AI Post Studio", icon: Sparkles },
  { href: "/creator/trust-tier", label: "Account features", icon: Shield },
  { href: "/creator/earnings", label: "Earnings", icon: Wallet },
  { href: "/creator/payout", label: "Payout account", icon: Landmark },
  { href: "/creator/settings", label: "Settings", icon: Settings },
];

export default function CreatorShell({
  children,
  handle,
}: {
  children: React.ReactNode;
  handle?: string;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f5f7ff] text-[#172b63]">
      <div className="mx-auto flex max-w-[1400px] gap-8 px-5 pb-16 pt-4 lg:px-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-600">
              Creator studio
            </p>
            <p className="mt-1 text-lg font-bold">
              {handle ? `@${handle}` : "Your account"}
            </p>

            <nav className="mt-6 space-y-1">
              {nav.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
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

            {handle ? (
              <Link
                href={creatorProfilePath(handle)}
                target="_blank"
                className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:border-purple-200 hover:text-purple-600"
              >
                <ExternalLink size={16} />
                Public page
              </Link>
            ) : null}

            <button
              type="button"
              onClick={async () => {
              try {
                await logoutApi();
              } catch {
                /* ignore */
              }
              clearAuthToken();
              window.location.href = "/login";
            }}
              className="mt-6 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 hover:text-red-600"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex justify-end lg:hidden">
            <CreatorNotificationBell />
          </div>
          <div className="mb-6 hidden justify-end lg:flex">
            <CreatorNotificationBell />
          </div>
          {children}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-semibold ${
                active ? "text-purple-600" : "text-slate-400"
              }`}
            >
              <Icon size={20} />
              {label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
