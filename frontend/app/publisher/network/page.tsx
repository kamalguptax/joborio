import { Suspense } from "react";
import PublisherNetworkClient from "./PublisherNetworkClient";
import { PageSkeleton } from "@/components/ui/Skeleton";

export default function PublisherNetworkPage() {
  return (
    <Suspense
      fallback={
        <PageSkeleton />
      }
    >
      <PublisherNetworkClient />
    </Suspense>
  );
}
