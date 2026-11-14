"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Registrations now live under Performance → PPR (per campaign). */
export default function CreatorRegistrationsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/creator/performance?tab=ppr");
  }, [router]);

  return (
    <p className="text-sm text-slate-500">
      Redirecting to Performance for PPR registrations…
    </p>
  );
}
