import { getApiBaseUrl } from "@/lib/config";

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

const PUBLIC_SITE = "https://joborio.com";

/** Link a creator copies. Opening it on JobOrio counts the click, then sends the visitor to the employer site. */
export function shareJobUrl(code: string, referenceId: string): string {
  const params = new URLSearchParams({
    code: code.trim(),
    ref: referenceId,
  });
  return `${PUBLIC_SITE}/go/?${params.toString()}`;
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
