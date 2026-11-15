"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchMe, logoutApi } from "@/lib/api/auth";
import { Building2, LayoutDashboard, Megaphone, Plus, SlidersHorizontal } from "lucide-react";
import DashboardShell, { type DashboardNavItem } from "@/components/layout/DashboardShell";
import { clearAuthToken, getAuthToken } from "@/lib/auth/session";
import { ShellSkeleton } from "@/components/ui/Skeleton";

const nav: DashboardNavItem[] = [
  { href: "/employer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employer/job-preferences", label: "Job preferences", icon: SlidersHorizontal },
  { href: "/employer/billing", label: "Company & payment", icon: Building2 },
  { href: "/employer/programs", label: "Programs", icon: Megaphone },
  { href: "/employer/programs/new", label: "New program", icon: Plus },
];

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isOnboarding = pathname === "/employer/onboarding";
  const [ok, setOk] = useState(isOnboarding);

  useEffect(() => {
    if (isOnboarding) {
      return;
    }
    if (!getAuthToken()) {
      router.replace("/login");
      return;
    }
    fetchMe()
      .then((u) => {
        const isEmployer = u.roles?.some((r) => r.name === "employer");
        if (!isEmployer) {
          router.replace("/employer/onboarding");
          return;
        }
        setOk(true);
      })
      .catch(() => router.replace("/login"));
  }, [router, isOnboarding]);

  if (isOnboarding) {
    return <>{children}</>;
  }

  if (!ok) {
    return (
      <ShellSkeleton />
    );
  }

  return (
    <DashboardShell
      nav={nav}
      userName="Employer portal"
      userHint="Brand & company account"
      onSignOut={async () => {
        try {
          await logoutApi();
        } catch {
          /* ignore */
        }
        clearAuthToken();
        router.push("/login");
      }}
    >
      {children}
    </DashboardShell>
  );
}
