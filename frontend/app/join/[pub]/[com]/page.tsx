import { Suspense } from "react";
import JoinInviteClient from "./JoinInviteClient";
import { STATIC_EXPORT_PLACEHOLDER } from "@/lib/staticExport";

export function generateStaticParams() {
  return [{ pub: STATIC_EXPORT_PLACEHOLDER, com: STATIC_EXPORT_PLACEHOLDER }];
}

export default function JoinInvitePage() {
  return (
    <Suspense
      fallback={
        <p className="px-4 py-16 text-center text-sm text-slate-400">
          Loading invitation…
        </p>
      }
    >
      <JoinInviteClient />
    </Suspense>
  );
}
