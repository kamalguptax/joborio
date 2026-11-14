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

/** Static-export-safe network invite. Pretty `/join/{pub}/{com}` needs host rewrite. */
export function joinInvitePath(pub: string, com: string, token: string): string {
  const q = new URLSearchParams({
    token,
    pub,
    com,
  });
  return `/join/${STATIC_EXPORT_PLACEHOLDER}/${STATIC_EXPORT_PLACEHOLDER}/?${q.toString()}`;
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
