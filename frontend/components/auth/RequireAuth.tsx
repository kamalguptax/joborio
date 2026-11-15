"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/auth/session";
import { loginUrlWithNext } from "@/lib/auth/safeRedirect";
import { CenteredCardSkeleton } from "@/components/ui/Skeleton";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/**
 * Renders children only when a login token exists. Otherwise sends the visitor to
 * /login/?next=<current path> and returns here after sign-in.
 * Auth is client-side (token in localStorage), so the check runs in the browser.
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  // Server + first hydration render see `null` (shows the loader), then the real token.
  const token = useSyncExternalStore(subscribe, getAuthToken, () => null);

  useEffect(() => {
    // Read the token directly: the hook value is still the server snapshot on first effect.
    if (!getAuthToken()) router.replace(loginUrlWithNext(pathname));
  }, [pathname, router, token]);

  if (!token) {
    return (
      <CenteredCardSkeleton />
    );
  }
  return <>{children}</>;
}
