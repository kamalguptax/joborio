const PRODUCTION_API = "https://api.joborio.com";

function isLocalApiUrl(url: string): boolean {
  return (
    url.includes("127.0.0.1") ||
    url.includes("localhost:8000") ||
    url === "http://localhost:8000"
  );
}

/**
 * API base for all browser requests.
 * Defaults to production server — not 127.0.0.1 (avoids stale Next env cache in dev).
 */
export function getApiBaseUrl(): string {
  const useLocalApi = process.env.NEXT_PUBLIC_USE_LOCAL_API === "true";
  const envUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

  if (useLocalApi && envUrl && isLocalApiUrl(envUrl)) {
    return envUrl;
  }

  if (envUrl && !isLocalApiUrl(envUrl)) {
    return envUrl;
  }

  return PRODUCTION_API;
}

export const API_BASE_URL = PRODUCTION_API;

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "JobOrio";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" ? window.location.origin : "");
