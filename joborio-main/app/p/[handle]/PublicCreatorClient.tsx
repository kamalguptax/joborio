"use client";

import { useEffect, useState } from "react";
import PublicCreatorView, {
  type PublicCreator,
  type PublicListing,
} from "@/components/public/PublicCreatorView";
import { getApiBaseUrl } from "@/lib/config";
import { useResolvedParam } from "@/lib/hooks/useResolvedParam";
import { STATIC_EXPORT_PLACEHOLDER, creatorProfilePath } from "@/lib/staticExport";

export default function PublicCreatorClient() {
  const pathHandle = useResolvedParam("handle", /^\/p\/([^/]+)/);
  const [queryHandle, setQueryHandle] = useState("");
  const [ready, setReady] = useState(false);
  const handle =
    pathHandle && pathHandle !== STATIC_EXPORT_PLACEHOLDER ? pathHandle : queryHandle;
  const [data, setData] = useState<{
    creator: PublicCreator;
    listings: PublicListing[];
  } | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get("handle")?.trim() ?? "";
    setQueryHandle(fromQuery);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!handle) {
      setMissing(true);
      return;
    }
    setData(null);
    setMissing(false);
    fetch(
      `${getApiBaseUrl()}/api/v1/public/creators/${encodeURIComponent(handle)}`,
      { headers: { Accept: "application/json" } },
    )
      .then(async (res) => {
        if (res.status === 404) {
          setMissing(true);
          return;
        }
        const json = await res.json();
        if (!json.success) {
          setMissing(true);
          return;
        }
        setData(json.data);
      })
      .catch(() => setMissing(true));
  }, [handle, ready]);

  if (missing) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-500">
        Creator not found.
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-400">
        Loading…
      </main>
    );
  }

  const profilePath = creatorProfilePath(data.creator.handle || handle);
  const pageUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${profilePath}`
      : profilePath;

  return (
    <PublicCreatorView
      creator={data.creator}
      listings={data.listings}
      pageUrl={pageUrl}
    />
  );
}
