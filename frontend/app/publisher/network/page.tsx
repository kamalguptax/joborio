import { Suspense } from "react";
import PublisherNetworkClient from "./PublisherNetworkClient";

export default function PublisherNetworkPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-slate-500">Loading network invites…</p>
      }
    >
      <PublisherNetworkClient />
    </Suspense>
  );
}
