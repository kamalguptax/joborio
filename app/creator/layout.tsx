"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchMe } from "@/lib/api/auth";
import { claimCreatorReferral } from "@/lib/api/creator";
import CreatorShell from "@/components/creator/CreatorShell";
import { clearReferralCode, getReferralCode } from "@/lib/auth/referralStorage";
import { getAuthToken } from "@/lib/auth/session";

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [handle, setHandle] = useState<string | undefined>();
  const isPublicRegister = pathname === "/creator/register";

  useEffect(() => {
    if (isPublicRegister) return;

    if (!getAuthToken()) {
      router.replace("/login");
      return;
    }
    fetchMe()
      .then((u) => {
        const isAdmin = u.roles?.some((r) => r.name === "admin");
        if (isAdmin) {
          router.replace("/admin/dashboard");
          return;
        }
        const isEmployer = u.roles?.some((r) => r.name === "employer");
        if (isEmployer && !u.creator) {
          router.replace("/employer/dashboard");
          return;
        }
        if (!u.creator) {
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
      .catch(() => router.replace("/login"));
  }, [router, isPublicRegister]);

  if (isPublicRegister) {
    return <>{children}</>;
  }

  return <CreatorShell handle={handle}>{children}</CreatorShell>;
}
