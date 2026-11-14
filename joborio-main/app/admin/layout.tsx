"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { fetchMe } from "@/lib/api/auth";
import { getAuthToken } from "@/lib/auth/session";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace("/login");
      return;
    }
    fetchMe()
      .then((u) => {
        const isAdmin = u.roles?.some((r) => r.name === "admin");
        if (!isAdmin) {
          router.replace("/creator/dashboard");
          return;
        }
        setOk(true);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  if (!ok) {
    return (
      <div className="admin-console flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-500" />
          <p className="mt-4 text-sm text-zinc-500">Verifying admin access…</p>
        </div>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
