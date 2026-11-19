"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/config";
import { useResolvedParam } from "@/lib/hooks/useResolvedParam";
import { STATIC_EXPORT_PLACEHOLDER } from "@/lib/staticExport";

/**
 * joborio.com/r/{token} (or /r/static/?t=…) → api.joborio.com/r/{token}
 * Keeps share links on the public site, not the API host.
 */
export default function TrackingRedirectClient() {
  const pathToken = useResolvedParam("token", /^\/r\/([^/]+)/);
  const [queryToken, setQueryToken] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fromQuery =
      new URLSearchParams(window.location.search).get("t")?.trim() ?? "";
    setQueryToken(fromQuery);
    setReady(true);
  }, []);

  const token =
    pathToken && pathToken !== STATIC_EXPORT_PLACEHOLDER ? pathToken : queryToken;

  useEffect(() => {
    if (!ready || !token) return;
    const api = getApiBaseUrl().replace(/\/$/, "");
    window.location.replace(`${api}/r/${encodeURIComponent(token)}`);
  }, [ready, token]);

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#F8F8FB] px-4 text-center">
      <p className="text-sm font-semibold text-slate-600">
        {ready && !token ? "Invalid tracking link." : "Opening link…"}
      </p>
    </main>
  );
}
