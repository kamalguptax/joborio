"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { fetchMe } from "@/lib/api/auth";
import {
  getAuthToken,
  rememberPublicCode,
  setAuthToken,
} from "@/lib/auth/session";
import { cacheUser } from "@/lib/auth/userCache";
import {
  homePathForRole,
  homePathForUser,
  navigateTo,
  type LoginRole,
} from "@/lib/auth/redirect";
import {
  OAUTH_ROLE_KEY,
  rejectWrongRole,
  wrongRoleFromServer,
  type WrongRoleError,
} from "@/lib/auth/loginRoleGate";
import { CenteredCardSkeleton } from "@/components/ui/Skeleton";

function AuthCallbackInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState("Completing sign-in…");
  const [wrongRole, setWrongRole] = useState<WrongRoleError | null>(null);

  useEffect(() => {
    const oauthError = params.get("error");
    if (oauthError) {
      try {
        sessionStorage.removeItem(OAUTH_ROLE_KEY);
      } catch {
        /* ignore */
      }
      const serverMessage = params.get("message");
      setMessage(
        serverMessage ||
          "Sign-in with Google or LinkedIn failed. Check API OAuth settings.",
      );
      // The server refused this account type for the login page that was used.
      if (oauthError === "wrong_role" && serverMessage) {
        setWrongRole(wrongRoleFromServer(serverMessage, params.get("use_login_path")));
      }
      return;
    }

    const token = params.get("token");
    if (!token) {
      setMessage("Missing token. Try signing in again.");
      return;
    }

    // Which login page started this Google / LinkedIn sign-in (if any).
    let loginRole: LoginRole | null = null;
    try {
      const stored = sessionStorage.getItem(OAUTH_ROLE_KEY);
      sessionStorage.removeItem(OAUTH_ROLE_KEY);
      if (stored === "creator" || stored === "employer" || stored === "publisher") {
        loginRole = stored;
      }
    } catch {
      /* ignore */
    }

    setAuthToken(token);

    fetchMe()
      .then(async (user) => {
        // Creator / Brand login page: only that account type may sign in.
        if (loginRole) {
          const wrong = await rejectWrongRole(user, loginRole);
          if (wrong) {
            setMessage(wrong.message);
            setWrongRole(wrong);
            return;
          }
        }
        rememberPublicCode(user);
        cacheUser(user, getAuthToken());
        // Same role-based routing as the email login form
        // (admin / publisher / network / brand / creator / onboarding).
        navigateTo(
          router,
          loginRole ? homePathForRole(user, loginRole) : homePathForUser(user),
        );
      })
      .catch(() => {
        router.replace("/onboarding");
      });
  }, [params, router]);

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#fff9fd] px-6">
      <div className="text-center">
        <p className="text-sm font-medium text-slate-600">{message}</p>
        {wrongRole ? (
          <Link
            href={wrongRole.linkHref}
            className="mt-3 inline-block text-sm font-semibold text-violet-700 underline"
          >
            {wrongRole.linkLabel}
          </Link>
        ) : null}
      </div>
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
