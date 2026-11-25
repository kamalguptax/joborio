"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Briefcase, CircleDollarSign, LayoutDashboard, Wallet } from "lucide-react";
import { fetchMe, logoutApi } from "@/lib/api/auth";
import { clearAuthToken, getAuthToken } from "@/lib/auth/session";
import { homePathForUser, navigateTo } from "@/lib/auth/redirect";
import DashboardBreadcrumb, {
  buildDashboardBreadcrumbs,
} from "@/components/layout/DashboardBreadcrumb";
import type { DashboardNavItem } from "@/components/layout/DashboardShell";
import { ShellSkeleton } from "@/components/ui/Skeleton";
import { isOnboardingPending, ONBOARDING_PATHS } from "@/lib/auth/onboardingFlag";
import { fetchNetworkWallet } from "@/lib/api/network";

const networkNav: DashboardNavItem[] = [
  { href: "/network/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/network/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/network/wallet", label: "Wallet", icon: Wallet },
];

function money(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
}

function NetworkWalletChip() {
  const [available, setAvailable] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      fetchNetworkWallet()
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
      href="/network/wallet"
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

export default function NetworkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const path =
    pathname && pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  const isOnboarding = path === ONBOARDING_PATHS.network;
  const [name, setName] = useState<string>("Member");
  const [ready, setReady] = useState(false);
  const breadcrumbs = useMemo(
    () => buildDashboardBreadcrumbs(pathname, networkNav),
    [pathname],
  );

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace("/login?next=/network/dashboard");
      return;
    }
    fetchMe()
      .then((u) => {
        const isMember = u.roles?.some((r) => r.name === "network_member");
        if (!isMember) {
          navigateTo(router, homePathForUser(u));
          return;
        }
        // Member who just joined: finish onboarding first.
        if (!isOnboarding && isOnboardingPending(u.id, "network")) {
          router.replace(ONBOARDING_PATHS.network);
          return;
        }
        setName(u.name || "Member");
        setReady(true);
      })
      .catch(() => router.replace("/login?next=/network/dashboard"));
  }, [router, isOnboarding]);

  async function signOut() {
    try {
      await logoutApi();
    } catch {
      // ignore
    }
    clearAuthToken();
    window.location.href = "/login";
  }

  if (!ready) {
    return (
      <ShellSkeleton />
    );
  }

  if (isOnboarding) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-svh bg-[#f5f7ff] text-[#172b63]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
              Network member
            </p>
            <p className="font-bold">{name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/network/dashboard"
              className={`font-semibold ${
                path === "/network/dashboard" ? "text-violet-700" : "text-slate-600"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/network/opportunities"
              className={`font-semibold ${
                path === "/network/opportunities"
                  ? "text-violet-700"
                  : "text-slate-600"
              }`}
            >
              Opportunities
            </Link>
            <NetworkWalletChip />
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-full border border-slate-200 px-3 py-1.5 font-semibold text-slate-600"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">
        <DashboardBreadcrumb items={breadcrumbs} />
        {children}
      </main>
    </div>
  );
}
