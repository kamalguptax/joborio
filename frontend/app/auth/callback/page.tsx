"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { fetchMe } from "@/lib/api/auth";
import {
  postLoginRedirect,
  rememberPublicCode,
  setAuthToken,
} from "@/lib/auth/session";

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
        rememberPublicCode(user);
        router.replace(postLoginRedirect(!!user.creator));
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
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#fff9fd]">
          <p className="text-sm text-slate-500">Loading…</p>
        </main>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
