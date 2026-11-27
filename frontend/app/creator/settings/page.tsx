"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const TARGET = "/creator/profile?tab=preferences";

/** Settings now live on the Profile page. Old links and bookmarks still work. */
export default function CreatorSettingsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace(TARGET);
  }, [router]);
  return (
    <p className="text-sm text-slate-500">
      Settings moved to your{" "}
      <Link href={TARGET} className="font-semibold text-violet-700 hover:underline">
        profile
      </Link>
      . Redirecting…
    </p>
  );
}
