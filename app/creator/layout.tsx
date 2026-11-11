"use client";

import { useEffect, useState } from "react";
import { fetchMe } from "@/lib/api/auth";
import CreatorShell from "@/components/creator/CreatorShell";
import { getAuthToken } from "@/lib/auth/session";
import { useRouter } from "next/navigation";

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [handle, setHandle] = useState<string | undefined>();

  useEffect(() => {
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
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  return <CreatorShell handle={handle}>{children}</CreatorShell>;
}
