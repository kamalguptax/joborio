"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchMe } from "@/lib/api/auth";
import PublisherShell from "@/components/publisher/PublisherShell";
import { getAuthToken } from "@/lib/auth/session";

const PUBLIC_PATHS = new Set(["/publisher/register", "/publisher/login"]);

function normalizePath(path: string | null): string {
  if (!path) return "";
  // Static export uses trailingSlash — /publisher/login/ must still be public.
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

export default function PublisherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState<string | undefined>();
  const [role, setRole] = useState<"owner" | "manager" | undefined>();
  const path = normalizePath(pathname);
  const isPublic = PUBLIC_PATHS.has(path);

  useEffect(() => {
    if (isPublic) return;

    if (!getAuthToken()) {
      router.replace("/publisher/login");
      return;
    }

    fetchMe()
      .then((u) => {
        const isPublisher =
          u.roles?.some((r) => r.name === "publisher") ||
          (u.publisher_users?.some((m) => m.is_active) ?? false);

        if (!isPublisher) {
          router.replace("/publisher/login");
          return;
        }

        const active = u.publisher_users?.find((m) => m.is_active);
        setUsername(active?.publisher?.username ?? u.name);
        setRole(active?.role === "manager" ? "manager" : "owner");
      })
      .catch(() => router.replace("/publisher/login"));
  }, [router, isPublic, pathname]);

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <PublisherShell username={username} role={role}>
      {children}
    </PublisherShell>
  );
}
