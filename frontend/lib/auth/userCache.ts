import type { User } from "@/lib/api/types";

/**
 * Remembers the signed-in user (name, roles, ...) so the header can show the
 * account avatar instantly on page load, before /auth/me answers.
 * The cache is tied to the login token, so a different login never sees it.
 */
const KEY = "joborio_user_cache";

const tokenTag = (token: string) => token.slice(-12);

export function cacheUser(user: User, token: string | null): void {
  if (typeof window === "undefined" || !token) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ t: tokenTag(token), user }));
  } catch {
    /* storage full / blocked: ignore */
  }
}

export function readCachedUser(token: string): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { t?: string; user?: User };
    if (parsed.t !== tokenTag(token) || !parsed.user) return null;
    return parsed.user;
  } catch {
    return null;
  }
}

export function clearCachedUser(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
