"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchMe, logoutApi } from "@/lib/api/auth";
import { clearAuthToken, getAuthToken } from "@/lib/auth/session";

const links = [
  { href: "/employer/dashboard", label: "Dashboard" },
  { href: "/employer/job-preferences", label: "Job preferences" },
  { href: "/employer/billing", label: "Company & payment" },
  { href: "/employer/programs", label: "Programs" },
  { href: "/employer/programs/new", label: "New program" },
];

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isOnboarding = pathname === "/employer/onboarding";
  const [ok, setOk] = useState(isOnboarding);

  useEffect(() => {
    if (isOnboarding) {
      return;
    }
    if (!getAuthToken()) {
      router.replace("/login");
      return;
    }
    fetchMe()
      .then((u) => {
        const isEmployer = u.roles?.some((r) => r.name === "employer");
        if (!isEmployer) {
          router.replace("/employer/onboarding");
          return;
        }
        setOk(true);
      })
      .catch(() => router.replace("/login"));
  }, [router, isOnboarding]);

  if (isOnboarding) {
    return <>{children}</>;
  }

  if (!ok) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7ff] text-[#172b63]">
        <p className="text-sm text-slate-500">Loading employer portal…</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7ff] text-[#172b63] pt-4">
      <nav
        aria-label="Employer"
        className="border-b border-slate-200/80 bg-white/80"
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-5 py-3">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
            Employer portal
          </span>
          <div className="flex flex-1 gap-4 text-sm font-semibold">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={
                  pathname === l.href
                    ? "text-purple-600"
                    : "text-slate-600 hover:text-purple-600"
                }
              >
                {l.label}
              </Link>
            ))}
          </div>
          <button
            type="button"
            className="text-sm text-slate-500 hover:text-red-600"
            onClick={async () => {
              try {
                await logoutApi();
              } catch {
                /* ignore */
              }
              clearAuthToken();
              router.push("/login");
            }}
          >
            Sign out
          </button>
        </div>
      </nav>
      <div className="mx-auto max-w-5xl px-5 py-8">{children}</div>
    </div>
  );
}
