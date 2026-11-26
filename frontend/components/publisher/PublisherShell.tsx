"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Network,
  Store,
  Wallet,
  CircleDollarSign,
  Plug,
  Settings,
  Zap,
} from "lucide-react";
import DashboardShell, { type DashboardNavItem } from "@/components/layout/DashboardShell";
import { clearAuthToken } from "@/lib/auth/session";
import { logoutApi } from "@/lib/api/auth";
import { fetchPublisherWallet } from "@/lib/api/publisher";

type PublisherNavItem = DashboardNavItem & { ownerOnly?: boolean };

const allNav: PublisherNavItem[] = [
  { href: "/publisher/dashboard", label: "Overview", icon: LayoutDashboard },
  {
    href: "/publisher/network",
    label: "Invite Team",
    icon: Network,
    alsoActive: ["/publisher/reports"],
  },
  { href: "/publisher/communities", label: "Communities", icon: Users },
  { href: "/publisher/marketplace", label: "Campaign Marketplace", icon: Store },
  { href: "/publisher/post-studio", label: "Post Studio", icon: Zap },
  { href: "/publisher/earnings", label: "Earning", icon: Wallet, ownerOnly: true },
  { href: "/publisher/integrations", label: "API & Integration", icon: Plug, ownerOnly: true },
];

function money(n: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
}

function PublisherWalletChip() {
  const [available, setAvailable] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      fetchPublisherWallet()
        .then((w) => {
          if (!alive) return;
          setAvailable(Number(w.balances?.available_usd ?? 0));
        })
        .catch(() => {
          if (!alive) return;
          setAvailable(null);
        });
    };
    load();
    window.addEventListener("focus", load);
    window.addEventListener("joborio:wallet-updated", load);
    return () => {
      alive = false;
      window.removeEventListener("focus", load);
      window.removeEventListener("joborio:wallet-updated", load);
    };
  }, []);

  return (
    <Link
      href="/publisher/wallet"
      title="Open wallet"
      className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-bold text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">
        <CircleDollarSign size={15} />
      </span>
      <span className="leading-none">
        <span className="block text-[10px] font-semibold uppercase tracking-wide text-emerald-700/80">
          Wallet
        </span>
        <span className="tabular-nums">
          {available == null ? "…" : money(available)}
        </span>
      </span>
    </Link>
  );
}

export default function PublisherShell({
  children,
  username,
  role = "owner",
}: {
  children: React.ReactNode;
  username?: string;
  role?: "owner" | "manager";
}) {
  const isOwner = role === "owner";
  const nav = useMemo(
    () => allNav.filter((item) => !(item.ownerOnly && role === "manager")),
    [role],
  );

  return (
    <DashboardShell
      nav={nav}
      userName={username ? `@${username}` : "Your network"}
      settingsHref="/publisher/settings"
      settingsLabel="Account Settings"
      profileHref="/publisher/profile"
      profileLabel="Profile"
      userHint={
        role === "manager" ? "Manager · assigned communities" : "Publisher studio"
      }
      topRight={
        <div className="flex items-center gap-2">
          {isOwner ? <PublisherWalletChip /> : null}
          <Link
            href="/publisher/settings"
            title="Settings"
            aria-label="Settings"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
          >
            <Settings size={18} />
          </Link>
        </div>
      }
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
