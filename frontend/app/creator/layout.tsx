"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchMe } from "@/lib/api/auth";
import { claimCreatorReferral } from "@/lib/api/creator";
import CreatorShell from "@/components/creator/CreatorShell";
import { clearReferralCode, getReferralCode } from "@/lib/auth/referralStorage";
import { getAuthToken } from "@/lib/auth/session";
import { isOnboardingPending } from "@/lib/auth/onboardingFlag";
import { homePathForUser, navigateTo, roleFlags } from "@/lib/auth/redirect";

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [handle, setHandle] = useState<string | undefined>();
  const path =
    pathname && pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  const isPublicAuth = path === "/creator/register" || path === "/creator/login";

  useEffect(() => {
    if (isPublicAuth) return;

    if (!getAuthToken()) {
      router.replace("/creator/login");
      return;
    }
    fetchMe()
      .then((u) => {
        // Not a creator: every account type goes to its own place
        // (publisher -> publisher dashboard, brand -> employer dashboard,
        //  brand-new account -> creator onboarding).
        if (roleFlags(u).isAdmin || !u.creator) {
          navigateTo(router, homePathForUser(u));
          return;
        }
        // Just signed up: finish onboarding before the dashboard.
        if (isOnboardingPending(u.id, "creator")) {
          router.replace("/onboarding");
          return;
        }
        setHandle(u.creator.handle);

        // Repair missed attribution when signup created the creator before
        // onboarding applied the invite code.
        const pendingRef = getReferralCode();
        if (pendingRef) {
          claimCreatorReferral(pendingRef)
            .then((res) => {
              if (res.attached) clearReferralCode();
            })
            .catch(() => undefined);
        }
      })
      .catch(() => router.replace("/creator/login"));
  }, [router, isPublicAuth]);

  if (isPublicAuth) {
    return <>{children}</>;
  }

  return <CreatorShell handle={handle}>{children}</CreatorShell>;
}
