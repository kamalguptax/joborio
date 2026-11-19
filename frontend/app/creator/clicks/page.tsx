"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Clicks now live under Earnings / Clicks. */
export default function CreatorClicksRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/creator/earnings#clicks");
  }, [router]);

  return (
    <p className="text-sm text-slate-500">Opening Earnings / Clicks…</p>
  );
}
