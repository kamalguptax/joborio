"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";
import type { Listing } from "@/lib/api/types";
import GoogleMapPanel from "@/components/maps/GoogleMapPanel";
import { recordJobActivity } from "@/lib/api/creator";
import { getAuthToken } from "@/lib/auth/session";
import { loginUrlWithNext } from "@/lib/auth/safeRedirect";
import { STATIC_EXPORT_PLACEHOLDER, listingJobPath } from "@/lib/staticExport";

function listingIdFromLocation(): string {
  const query = new URLSearchParams(window.location.search).get("id");
  if (query) return query;
  const match = window.location.pathname.match(/^\/jobs\/(?!s\/)([^/]+)/);
  const segment = match?.[1] ? decodeURIComponent(match[1]) : "";
  return segment && segment !== STATIC_EXPORT_PLACEHOLDER ? segment : "";
}

export default function JobDetailClient() {
  const router = useRouter();
  const [idParam, setIdParam] = useState("");
  const listingId = Number(idParam);
  const [listing, setListing] = useState<Listing | null>(null);
  const [missing, setMissing] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const raw = listingIdFromLocation();
    if (!getAuthToken()) {
      setSignedIn(false);
      router.replace(loginUrlWithNext(raw ? listingJobPath(raw) : "/jobs"));
      return;
    }
    setSignedIn(true);
    setIdParam(raw);
  }, [router]);

  useEffect(() => {
    if (!idParam) return;
    if (!Number.isFinite(listingId)) {
      setMissing(true);
      return;
    }
    setMissing(false);
    setListing(null);
    fetch(`${getApiBaseUrl()}/api/v1/listings/${listingId}`, {
      headers: { Accept: "application/json" },
    })
      .then(async (res) => {
        if (!res.ok) {
          setMissing(true);
          return;
        }
        const json = await res.json();
        if (!json.success) {
          setMissing(true);
          return;
        }
        setListing(json.data);
      })
      .catch(() => setMissing(true));
  }, [listingId]);

  useEffect(() => {
    if (!signedIn || !listing) return;
    void recordJobActivity({
      reference_id: `listing:${listing.id}`,
      action: "view",
      title: listing.title,
      company: listing.company_name ?? undefined,
    }).catch(() => undefined);
  }, [signedIn, listing]);

  if (missing) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-500">
        Listing not found.
      </main>
    );
  }

  if (!signedIn || !listing) {
    const returnTo = idParam ? listingJobPath(idParam) : "/jobs";
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fff9fd] px-5 text-[#172b63]">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">Sign in to view this job</h1>
          <Link
            href={loginUrlWithNext(returnTo)}
            className="mt-6 inline-block rounded-full bg-[#172b63] px-5 py-2.5 text-sm font-bold text-white"
          >
            {signedIn ? "Loading…" : "Sign in"}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff9fd] pb-20 pt-32 text-[#172b63]">
      <div className="mx-auto max-w-2xl px-5 sm:px-8">
        <Link href="/jobs" className="text-sm font-semibold text-purple-600">
          ← All opportunities
        </Link>
        <h1 className="mt-6 text-3xl font-bold">{listing.title}</h1>
        <p className="mt-2 text-slate-500">
          {listing.company_name} ·{" "}
          {listing.location_label ??
            (listing.is_remote ? "Remote" : listing.country_code)}
        </p>
        {listing.description ? (
          <p className="mt-6 leading-7 text-slate-600">{listing.description}</p>
        ) : null}
        {"latitude" in listing &&
        "longitude" in listing &&
        listing.latitude != null &&
        listing.longitude != null ? (
          <div className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
              Location
            </h2>
            <GoogleMapPanel
              className="mt-3"
              height={280}
              markers={[
                {
                  lat: Number(listing.latitude),
                  lng: Number(listing.longitude),
                  title: listing.title,
                  subtitle: listing.location_label ?? undefined,
                },
              ]}
            />
          </div>
        ) : null}
        <p className="mt-6 font-semibold text-purple-600">
          Creator earn rate: ${Number(listing.ppc_rate_usd ?? 0.03).toFixed(2)} /
          click
        </p>
        <a
          href={listing.destination_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-bold text-white"
        >
          Open listing
        </a>
        <p className="mt-6 text-sm text-slate-500">
          Creators: copy a <strong>tracked</strong> link from{" "}
          <Link href="/creator/opportunities" className="text-purple-600">
            your dashboard
          </Link>{" "}
          to earn on clicks.
        </p>
      </div>
    </main>
  );
}
