/** Placeholder segment for `output: "export"` (real id read from URL on static hosts). */
export const STATIC_EXPORT_PLACEHOLDER = "static";

/** Static-export-safe job URL. Pretty `/jobs/s/{id}` paths 404 on hosts without a rewrite. */
export function syndicatedJobPath(referenceId: string): string {
  return `/jobs/s/static/?ref=${encodeURIComponent(referenceId)}`;
}

export function listingJobPath(id: string | number): string {
  return `/jobs/static/?id=${encodeURIComponent(String(id))}`;
}

/** Static-export-safe public profile. Pretty `/p/{handle}` paths 404 on Nginx. */
export function creatorProfilePath(handle: string): string {
  return `/p/static/?handle=${encodeURIComponent(handle)}`;
}

/**
 * Network invite path for static export.
 * Always use `/join/static/static/` (the only exported page). Pretty
 * `/join/{pub}/{com}/` links 404 on hosts without the Hostinger rewrite.
 */
export function joinInvitePath(pub: string, com: string, token: string): string {
  const q = new URLSearchParams({
    token,
    pub: pub.trim() || "PUB",
    com: com.trim() || "ALL",
  });
  return `/join/${STATIC_EXPORT_PLACEHOLDER}/${STATIC_EXPORT_PLACEHOLDER}/?${q.toString()}`;
}

/** Static-export-safe admin user detail. Pretty `/admin/users/{id}` 404s without Apache rewrite. */
export function adminUserPath(
  id: string | number,
  tab?: "activity" | "earnings" | "payouts" | "profile",
): string {
  const q = new URLSearchParams({ id: String(id) });
  if (tab) q.set("tab", tab);
  return `/admin/users/${STATIC_EXPORT_PLACEHOLDER}/?${q.toString()}`;
}

/** Publisher community dashboard (static-export safe). */
export function publisherCommunityPath(
  id: string | number,
  opts?: { from?: "reports" | "communities" | "earnings" | "dashboard" },
): string {
  const q = new URLSearchParams({ id: String(id) });
  if (opts?.from) q.set("from", opts.from);
  return `/publisher/communities/${STATIC_EXPORT_PLACEHOLDER}/?${q.toString()}`;
}

export function resolveDynamicParam(
  param: string | undefined,
  pathname: string,
  regex: RegExp,
): string {
  if (param && param !== STATIC_EXPORT_PLACEHOLDER) {
    return decodeURIComponent(param);
  }
  const m = pathname.match(regex);
  return m?.[1] ? decodeURIComponent(m[1]) : "";
}
