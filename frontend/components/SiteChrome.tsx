"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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

  // Publisher studio keeps site Header/Footer (same as creator). Hide only
  // full-bleed / alternate shells.
  const hideChrome =
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/network") ||
    pathname.startsWith("/p/") ||
    pathname.startsWith("/verify/") ||
    pathname.startsWith("/ppr/");
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
