"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Opportunities merged into Campaigns — keep old links working. */
export default function CreatorOpportunitiesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/creator/campaigns");
  }, [router]);
  return (
    <main className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
      Opening Campaigns…
    </main>
  );
}
