import { Suspense } from "react";
import JoinInviteClient from "./JoinInviteClient";
import { STATIC_EXPORT_PLACEHOLDER } from "@/lib/staticExport";
import { CenteredCardSkeleton } from "@/components/ui/Skeleton";

export function generateStaticParams() {
  return [{ pub: STATIC_EXPORT_PLACEHOLDER, com: STATIC_EXPORT_PLACEHOLDER }];
}

export default function JoinInvitePage() {
  return (
    <Suspense
      fallback={<CenteredCardSkeleton />}
    >
      <JoinInviteClient />
    </Suspense>
  );
}
