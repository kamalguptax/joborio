"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { fetchMe } from "@/lib/api/auth";
import {
  clearAuthToken,
  getAuthToken,
  rememberPublicCode,
  setAuthToken,
} from "@/lib/auth/session";
import { cacheUser } from "@/lib/auth/userCache";
import { homePathForUser, navigateTo, roleFlags } from "@/lib/auth/redirect";
import { ADMIN_LOGIN_URL } from "@/lib/siteUrls";
import { CenteredCardSkeleton } from "@/components/ui/Skeleton";

function AuthCallbackInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState("Completing sign-in…");

  useEffect(() => {
    const oauthError = params.get("error");
    if (oauthError) {
      setMessage(
        params.get("message") ||
          "Sign-in with Google or LinkedIn failed. Check API OAuth settings.",
      );
      return;
    }

    const token = params.get("token");
    if (!token) {
      setMessage("Missing token. Try signing in again.");
      return;
    }

    setAuthToken(token);

    fetchMe()
      .then((user) => {
        // Admin accounts use the separate admin app.
        if (roleFlags(user).isAdmin) {
          clearAuthToken();
          window.location.href = ADMIN_LOGIN_URL;
          return;
        }
        rememberPublicCode(user);
        cacheUser(user, getAuthToken());
        // Same role-based routing as the email login form
        // (publisher / network / brand / creator / onboarding).
        navigateTo(router, homePathForUser(user));
      })
      .catch(() => {
        router.replace("/onboarding");
      });
  }, [params, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff9fd] px-6">
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={<CenteredCardSkeleton />}
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
