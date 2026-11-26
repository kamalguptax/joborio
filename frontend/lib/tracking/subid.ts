import { APP_URL, getApiBaseUrl } from "@/lib/config";

export function publicCodeForUser(user: {
  id: number;
  public_code?: string | null;
}): string {
  const stored = user.public_code?.trim();
  if (stored) return stored;
  return `VIG${String(user.id).padStart(3, "0")}`;
}

/** Add or replace subid on a WhatJobs / XML deeplink. */
export function withSubid(url: string, code: string): string {
  const id = code.trim();
  if (!url || !id) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("subid", id);
    return parsed.toString();
  } catch {
    const join = url.includes("?") ? "&" : "?";
    return `${url}${join}subid=${encodeURIComponent(id)}`;
  }
}

/** Public site used in copied share links (current origin in browser, else APP_URL). */
function publicSiteBase(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }
  const fromEnv = (APP_URL || "").replace(/\/$/, "");
  return fromEnv || "https://joborio.sevenapps.in";
}

/**
 * Link a creator / network member copies.
 * Member reference is always in the URL as `code` (and mirrored as `subid`).
 * Opening it on JobOrio counts the click, then sends the visitor outbound with the same subid.
 */
export function shareJobUrl(code: string, referenceId: string): string {
  const memberRef = code.trim();
  const params = new URLSearchParams({
    code: memberRef,
    subid: memberRef,
    ref: referenceId,
  });
  return `${publicSiteBase()}/go/?${params.toString()}`;
}

/** Campaign / employer destination share for network members (and creators when destination is known). */
export function shareDestinationUrl(
  code: string,
  destination: string,
  opts?: { title?: string; referenceId?: string },
): string {
  const memberRef = code.trim();
  const params = new URLSearchParams({
    code: memberRef,
    subid: memberRef,
    to: destination,
  });
  if (opts?.title) params.set("title", opts.title);
  if (opts?.referenceId) params.set("ref", opts.referenceId);
  return `${publicSiteBase()}/go/?${params.toString()}`;
}

/** API hop that records the click and redirects to the employer URL with subid. */
export function trackedClickUrl(
  code: string,
  destination: string,
  title?: string,
  referenceId?: string,
): string {
  const params = new URLSearchParams({ to: destination });
  if (title) params.set("title", title);
  if (referenceId) params.set("ref", referenceId);
  return `${getApiBaseUrl()}/api/v1/go/${encodeURIComponent(code)}?${params.toString()}`;
}
