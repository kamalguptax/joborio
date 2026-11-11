/** Allow only same-app relative paths after login. */
export function sanitizeNextParam(next: string | null | undefined): string | null {
  if (!next) return null;
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  if (trimmed.includes("\\")) return null;
  return trimmed;
}

export function loginUrlWithNext(nextPath: string): string {
  return `/login/?next=${encodeURIComponent(nextPath)}`;
}
