"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchMe, logoutApi } from "@/lib/api/auth";
import {
  Bell,
  Building2,
  CircleDollarSign,
  ClipboardCheck,
  FileWarning,
  FolderOpen,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  Link2,
  Megaphone,
  Plus,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import DashboardShell, { type DashboardNavItem } from "@/components/layout/DashboardShell";
import { clearAuthToken, getAuthToken } from "@/lib/auth/session";
import { homePathForUser, navigateTo, roleFlags } from "@/lib/auth/redirect";
import { ShellSkeleton } from "@/components/ui/Skeleton";
import { isOnboardingPending, ONBOARDING_PATHS } from "@/lib/auth/onboardingFlag";
import { fetchEmployerBilling } from "@/lib/api/employer";

function money(n: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
}

function BrandWalletChip() {
  const [available, setAvailable] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      fetchEmployerBilling()
        .then((d) => {
          if (!alive) return;
          setAvailable(Number(d.prepaid_balance_usd ?? 0));
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
    <div className="flex items-center gap-2">
      <Link
        href="/employer/billing#brand-add-fund"
        title="Add fund to wallet"
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
      <Link
        href="/employer/billing#brand-add-fund"
        className="rounded-full bg-violet-600 px-3.5 py-2 text-sm font-bold text-white shadow-sm hover:bg-violet-700"
      >
        Add fund
      </Link>
    </div>
  );
}

const nav: DashboardNavItem[] = [
  { href: "/employer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employer/programs/new", label: "Create Campaign", icon: Plus },
  {
    href: "/employer/programs",
    label: "My Campaigns",
    icon: Megaphone,
    alsoActive: ["/employer/programs"],
  },
  {
    href: "/employer/performance",
    label: "Campaign Performance",
    icon: LineChart,
  },
  {
    href: "/employer/reports",
    label: "Reports & Content Complaints",
    icon: FileWarning,
    badge: 1,
  },
  {
    href: "/employer/lead-quality",
    label: "Lead Quality Centre",
    icon: ClipboardCheck,
  },
  {
    href: "/employer/tracking",
    label: "Tracking & Integrations",
    icon: Link2,
  },
  {
    href: "/employer/assets",
    label: "Campaign Assets",
    icon: FolderOpen,
  },
  { href: "/employer/billing", label: "Billing & Wallet", icon: Wallet },
  { href: "/employer/profile", label: "Brand Profile", icon: Building2 },
  { href: "/employer/team", label: "Team & Permissions", icon: Users },
  { href: "/employer/notifications", label: "Notifications", icon: Bell },
  { href: "/employer/support", label: "Support & Disputes", icon: LifeBuoy },
  { href: "/employer/settings", label: "Settings", icon: Settings },
];

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // trailingSlash (static export) gives "/employer/onboarding/": normalise it.
  const path =
    pathname && pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  const isOnboarding = path === "/employer/onboarding";
  const [ok, setOk] = useState(isOnboarding);

  useEffect(() => {
    if (isOnboarding) {
      return;
    }
    if (!getAuthToken()) {
      router.replace("/brand/login");
      return;
    }
    fetchMe()
      .then((u) => {
        const f = roleFlags(u);
        if (f.isAdmin || f.isPublisher || f.isNetworkMember) {
          // Another account type: send it to its own dashboard.
          navigateTo(router, homePathForUser(u));
          return;
        }
        if (!f.isEmployer) {
          router.replace("/employer/onboarding");
          return;
        }
        // Brand that just registered: finish onboarding first.
        if (isOnboardingPending(u.id, "employer")) {
          router.replace(ONBOARDING_PATHS.employer);
          return;
        }
        setOk(true);
      })
      .catch(() => router.replace("/brand/login"));
  }, [router, isOnboarding]);

  if (isOnboarding) {
    return <>{children}</>;
  }

  if (!ok) {
    return <ShellSkeleton />;
  }

  return (
    <DashboardShell
      nav={nav}
      userName="Brand portal"
      userHint="Brand & company account"
      settingsHref="/employer/profile"
      settingsLabel="Brand Profile"
      topRight={<BrandWalletChip />}
      onSignOut={async () => {
        try {
          await logoutApi();
        } catch {
          /* ignore */
        }
        clearAuthToken();
        router.push("/brand/login");
      }}
    >
      {children}
    </DashboardShell>
  );
}
