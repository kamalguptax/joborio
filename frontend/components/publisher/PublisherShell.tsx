"use client";

import { useMemo } from "react";
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
  Zap,
} from "lucide-react";
import DashboardShell, { type DashboardNavItem } from "@/components/layout/DashboardShell";
import { clearAuthToken } from "@/lib/auth/session";
import { logoutApi } from "@/lib/api/auth";

type PublisherNavItem = DashboardNavItem & { ownerOnly?: boolean };

const allNav: PublisherNavItem[] = [
  { href: "/publisher/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/publisher/network", label: "My Network", icon: Network },
  { href: "/publisher/communities", label: "Communities", icon: Users },
  { href: "/publisher/marketplace", label: "Campaign Marketplace", icon: Store },
  { href: "/publisher/post-studio", label: "Post Studio", icon: Zap },
  { href: "/publisher/reports", label: "Performance Reports", icon: BarChart3 },
  { href: "/publisher/earnings", label: "Publisher Earnings", icon: Wallet, ownerOnly: true },
  { href: "/publisher/integrations", label: "API & Integration", icon: Plug, ownerOnly: true },
  { href: "/publisher/payments", label: "Payment History", icon: History, ownerOnly: true },
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
  const nav = useMemo(
    () => allNav.filter((item) => !(item.ownerOnly && role === "manager")),
    [role],
  );

  return (
    <DashboardShell
      nav={nav}
      userName={username ? `@${username}` : "Your network"}
      settingsHref="/publisher/profile"
      userHint={role === "manager" ? "Manager · assigned communities" : "Publisher studio"}
      onSignOut={async () => {
        try {
          await logoutApi();
        } catch {
          // ignore
        }
        clearAuthToken();
        window.location.href = "/publisher/login";
      }}
    >
      {children}
    </DashboardShell>
  );
}
