"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  Wallet,
  Settings,
  Gift,
  BarChart3,
  Zap,
  Trophy,
} from "lucide-react";
import CreatorNotificationBell from "@/components/creator/CreatorNotificationBell";
import DashboardShell, { type DashboardNavItem } from "@/components/layout/DashboardShell";
import { clearAuthToken } from "@/lib/auth/session";
import { logoutApi } from "@/lib/api/auth";
import { creatorProfilePath } from "@/lib/staticExport";

const nav: DashboardNavItem[] = [
  { href: "/creator/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/creator/performance",
    label: "Performance",
    icon: BarChart3,
    alsoActive: ["/creator/registrations"],
  },
  {
    href: "/creator/campaigns",
    label: "Campaigns",
    icon: Megaphone,
    alsoActive: ["/creator/opportunities"],
  },
  { href: "/creator/post-studio", label: "Post Studio", icon: Zap },
  { href: "/creator/top-performers", label: "Top performers", icon: Trophy },
  { href: "/creator/referrals", label: "Refer & Earn", icon: Gift },
  {
    href: "/creator/wallet",
    label: "Wallet",
    icon: Wallet,
    alsoActive: [
      "/creator/earnings",
      "/creator/clicks",
      "/creator/payout",
      "/creator/trust-tier",
    ],
  },
];

export default function CreatorShell({
  children,
  handle,
}: {
  children: React.ReactNode;
  handle?: string;
}) {
  const pathname = usePathname() ?? "";
  const settingsActive =
    pathname.startsWith("/creator/profile") ||
    pathname === "/creator/settings" ||
    pathname.startsWith("/creator/job-preferences");

  return (
    <DashboardShell
      nav={nav}
      userName={handle ? `@${handle}` : "Your account"}
      userHint="Creator studio"
      settingsHref="/creator/profile"
      profileHref={handle ? creatorProfilePath(handle) : undefined}
      onSignOut={async () => {
        try {
          await logoutApi();
        } catch {
          /* ignore */
        }
        clearAuthToken();
        window.location.href = "/creator/login";
      }}
      topRight={
        <>
          <Link
            href="/creator/profile"
            aria-label="Settings"
            title="Settings"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
              settingsActive
                ? "border-violet-300 bg-violet-50 text-violet-700"
                : "border-slate-200 bg-white text-slate-700 hover:border-violet-200 hover:text-violet-700"
            }`}
          >
            <Settings size={18} />
          </Link>
          <CreatorNotificationBell />
        </>
      }
    >
      {children}
    </DashboardShell>
  );
}
