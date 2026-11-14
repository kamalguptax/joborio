"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { saveReferralCode } from "@/lib/auth/referralStorage";

/** Persists ?ref=CODE from signup URL for onboarding. */
export default function ReferralCapture() {
  const params = useSearchParams();

  useEffect(() => {
    const ref = params.get("ref");
    if (ref) saveReferralCode(ref);
  }, [params]);

  return null;
}
