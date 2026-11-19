import { getApiBaseUrl } from "@/lib/config";

export type TopEarner = {
  handle: string;
  name: string;
  /** Absolute photo URL, or null when the creator has no photo. */
  photoUrl: string | null;
  paidUsd: number;
};

const PHOTO_KEYS = [
  "profile_photo_url",
  "photo_url",
  "avatar_url",
  "profile_photo",
  "profile_photo_path",
  "avatar",
  "image",
] as const;

/** Turns whatever the API returns (full URL, "/path" or a storage path) into a usable URL. */
function resolvePhotoUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim();
  if (!v) return null;
  if (/^(https?:)?\/\//i.test(v) || v.startsWith("data:")) return v;
  const base = getApiBaseUrl().replace(/\/$/, "");
  if (v.startsWith("/")) return `${base}${v}`;
  return `${base}/storage/${v.replace(/^storage\//, "")}`;
}

function photoOf(c: Record<string, unknown>): string | null {
  for (const key of PHOTO_KEYS) {
    const url = resolvePhotoUrl(c[key]);
    if (url) return url;
  }
  return null;
}

function paidOf(c: Record<string, unknown>): number {
  const payout = c.payout as { paid_usd?: unknown } | undefined;
  const stats = c.stats as { paid_usd?: unknown } | undefined;
  return Number(payout?.paid_usd ?? stats?.paid_usd ?? 0) || 0;
}

let cache: Promise<TopEarner[]> | null = null;

async function load(): Promise<TopEarner[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/public/creators?per_page=50`, {
    headers: { Accept: "application/json" },
  });
  const json = await res.json();
  if (!json?.success || !Array.isArray(json.data)) return [];
  return (json.data as Record<string, unknown>[])
    .map((c) => ({
      handle: String(c.handle ?? ""),
      name: String(c.name ?? c.handle ?? ""),
      photoUrl: photoOf(c),
      paidUsd: paidOf(c),
    }))
    .filter((c) => c.handle)
    .sort((a, b) => b.paidUsd - a.paidUsd);
}

/**
 * Approved creators ranked by money paid out, highest first.
 * One request per page load, shared by every orbit on the page.
 */
export function fetchTopEarners(): Promise<TopEarner[]> {
  if (!cache) {
    cache = load().catch(() => {
      cache = null;
      return [];
    });
  }
  return cache;
}
