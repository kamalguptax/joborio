"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const TARGET = "/creator/profile?tab=payout";

/** The payout account now lives in the Profile page ("Payout account" tab). Old links still work. */
export default function CreatorPayoutRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace(TARGET);
  }, [router]);
  return (
    <p className="text-sm text-slate-500">
      Payout account moved to your{" "}
      <Link href={TARGET} className="font-semibold text-violet-700 hover:underline">
        profile
      </Link>
      . Redirecting…
    </p>
  );
}
