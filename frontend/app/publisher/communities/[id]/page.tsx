import { Suspense } from "react";
import CommunityDashboardClient from "./CommunityDashboardClient";
import { STATIC_EXPORT_PLACEHOLDER } from "@/lib/staticExport";
import { PageSkeleton } from "@/components/ui/Skeleton";

export function generateStaticParams() {
  return [{ id: STATIC_EXPORT_PLACEHOLDER }];
}

export default function PublisherCommunityDashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CommunityDashboardClient />
    </Suspense>
  );
}
