"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, RefreshCw, UserX, WifiOff } from "lucide-react";
import Logo from "@/components/layout/Logo";
import PublicCreatorView, {
  type PublicCreator,
  type PublicListing,
} from "@/components/public/PublicCreatorView";
import { getApiBaseUrl } from "@/lib/config";
import { useResolvedParam } from "@/lib/hooks/useResolvedParam";
import { STATIC_EXPORT_PLACEHOLDER, creatorProfilePath } from "@/lib/staticExport";
import { CenteredCardSkeleton } from "@/components/ui/Skeleton";

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
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

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
    setFailed(false);
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
      .catch(() => setFailed(true));
  }, [handle, ready, attempt]);

  if (missing || failed) {
    const cleanHandle = handle.replace(/^@/, "");
    const Icon = failed ? WifiOff : UserX;
    return (
      <main className="flex min-h-svh flex-col bg-gradient-to-b from-[#fbf7ff] via-[#fff9fd] to-white text-[#172b63]">
        <header className="px-4 py-5 sm:px-8">
          <Logo tone="dark" />
        </header>

        <div className="flex flex-1 items-center justify-center px-4 pb-24 sm:px-8">
          <section className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-7 text-center shadow-[0_1px_2px_rgba(15,27,61,0.04),0_28px_60px_-34px_rgba(91,53,213,0.35)] sm:p-10">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-50 to-blue-50 text-violet-600 ring-1 ring-violet-100">
              <Icon size={28} aria-hidden="true" />
            </span>

            {!failed && cleanHandle ? (
              <p className="mx-auto mt-5 inline-flex max-w-full items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                <span className="truncate">@{cleanHandle}</span>
              </p>
            ) : null}

            <h1 className={`${failed || !cleanHandle ? "mt-6" : "mt-3"} text-2xl font-bold tracking-tight text-[#0F1B3D]`}>
              {failed ? "Couldn’t load this profile" : "Profile not public"}
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-[15px] leading-7 text-slate-500">
              {failed
                ? "Something went wrong while fetching this creator. Check your connection and try again."
                : "Only approved creators are shown on the website with their profile and payout status."}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {failed ? (
                <button
                  type="button"
                  onClick={() => setAttempt((n) => n + 1)}
                  className="btn-tap inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB] px-6 text-sm font-semibold text-white shadow-[0_14px_30px_-16px_rgba(91,53,213,0.7)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
                >
                  <RefreshCw size={16} aria-hidden="true" />
                  Try again
                </button>
              ) : (
                <Link
                  href="/creators"
                  className="btn-tap group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB] px-6 text-sm font-semibold text-white shadow-[0_14px_30px_-16px_rgba(91,53,213,0.7)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
                >
                  Browse creators
                  <ArrowRight size={16} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              )}
              <Link
                href="/"
                className="btn-tap inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50/50 hover:text-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
              >
                Back to home
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <CenteredCardSkeleton />
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
