"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { fetchMe } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { clearAuthToken, getAuthToken } from "@/lib/auth/session";
import { homePathForUser } from "@/lib/auth/redirect";
import { sanitizeNextParam } from "@/lib/auth/safeRedirect";
import { CenteredCardSkeleton } from "@/components/ui/Skeleton";

/**
 * For login / signup / register pages. A signed-in user is sent straight to their
 * dashboard (or to ?next=) and never sees the form. Visitors without a valid
 * session see the page as usual.
 *
 * Auth is client-side (token in localStorage), so the check runs in the browser
 * once, on mount. Signing in from the form later does not re-trigger it.
 */
export default function GuestOnly({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!getAuthToken()) {
      setIsGuest(true);
      return;
    }

    fetchMe()
      .then((me) => {
        if (cancelled) return;
        const next = sanitizeNextParam(
          new URLSearchParams(window.location.search).get("next"),
        );
        router.replace(next ?? homePathForUser(me));
      })
      .catch((err) => {
        if (cancelled) return;
        // Only drop the token when the server says it is no longer valid; if the
        // API is merely unreachable, keep it and let the visitor see the form.
        if (err instanceof ApiClientError && (err.status === 401 || err.status === 403)) {
          clearAuthToken();
        }
        setIsGuest(true);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!isGuest) return <CenteredCardSkeleton />;
  return <>{children}</>;
}
