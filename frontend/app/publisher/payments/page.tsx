import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/Skeleton";
import PublisherPaymentsClient from "./PublisherPaymentsClient";

export default function PublisherPaymentsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PublisherPaymentsClient />
    </Suspense>
  );
}
