import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/Skeleton";
import PublisherEarningsClient from "./PublisherEarningsClient";

export default function PublisherEarningsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PublisherEarningsClient />
    </Suspense>
  );
}
