"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { fetchMe } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { clearAuthToken, getAuthToken } from "@/lib/auth/session";
import {
  canVisit,
  hasLoginRole,
  homePathForRole,
  homePathForUser,
  navigateTo,
  nextForRole,
  type LoginRole,
} from "@/lib/auth/redirect";
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
export default function GuestOnly({
  children,
  prefer,
  role,
}: {
  children: ReactNode;
  prefer?: "employer";
  /**
   * Creator / brand / publisher pages: only a signed-in user of THIS account
   * type is sent on to the dashboard. Someone signed in as another type still
   * sees the form, so they can sign in with the right account.
   */
  role?: LoginRole;
}) {
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
        if (role) {
          if (!hasLoginRole(me, role)) {
            setIsGuest(true);
            return;
          }
          navigateTo(router, nextForRole(next, me, role) ?? homePathForRole(me, role));
          return;
        }
        navigateTo(
          router,
          next && canVisit(next, me) ? next : homePathForUser(me, { prefer }),
        );
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
  }, [router, prefer, role]);

  if (!isGuest) return <CenteredCardSkeleton />;
  return <>{children}</>;
}
