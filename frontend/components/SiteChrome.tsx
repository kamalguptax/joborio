"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

/** Auth screens render their own split-screen shell (logo + form + brand panel). */
const AUTH_ROUTES = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/publisher/login",
  "/publisher/register",
  "/creator/register",
  "/brand/register",
  "/brand/verify",
]);

/** True for `/base` and anything under `/base/…`, but not `/base-something` (e.g. `/creators`). */
function inArea(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

export default function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const raw = usePathname() ?? "";
  const pathname =
    raw.length > 1 && raw.endsWith("/") ? raw.slice(0, -1) : raw;

  // Every page change starts at the top (unless the URL has a #hash target).
  useLayoutEffect(() => {
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  // Signed-in dashboards (creator, employer, publisher, admin) and auth /
  // onboarding screens use their own shells, so the marketing Header/Footer is hidden.
  const hideChrome =
    AUTH_ROUTES.has(pathname) ||
    ["/onboarding", "/auth", "/admin", "/creator", "/employer", "/publisher", "/network", "/p", "/verify", "/ppr"].some(
      (base) => inArea(pathname, base),
    );
  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="min-w-0 flex-1 overflow-x-clip">{children}</main>
      <Footer />
    </>
  );
}
