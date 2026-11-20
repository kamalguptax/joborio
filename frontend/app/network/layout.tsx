"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchMe, logoutApi } from "@/lib/api/auth";
import { clearAuthToken, getAuthToken } from "@/lib/auth/session";
import { homePathForUser, navigateTo } from "@/lib/auth/redirect";
import { ShellSkeleton } from "@/components/ui/Skeleton";
import { isOnboardingPending, ONBOARDING_PATHS } from "@/lib/auth/onboardingFlag";

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
          <div className="flex items-center gap-3 text-sm">
            <Link href="/network/dashboard" className="font-semibold text-slate-600">
              Dashboard
            </Link>
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
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
