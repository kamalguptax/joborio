"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageSkeleton } from "@/components/ui/Skeleton";

/** Reports live under Invite Team → View reports. */
export default function PublisherReportsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/publisher/network?tab=reports");
  }, [router]);

  return <PageSkeleton />;
}
