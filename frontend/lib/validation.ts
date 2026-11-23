import type { ApiClientError } from "@/lib/api/client";

/** Simple, forgiving checks used by the auth forms (the API stays the source of truth). */

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** "company.com" -> "https://company.com" so people don't have to type the scheme. */
export function normalizeUrl(value: string): string {
  const v = value.trim();
  if (!v) return "";
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`;
}

/** 15-character Indian GSTIN, e.g. 22AAAAA0000A1Z5. */
export function isValidGstin(value: string): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value.trim().toUpperCase());
}

/** 10-character Indian PAN, e.g. ABCDE1234F. */
export function isValidPan(value: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value.trim().toUpperCase());
}

export function nameProblem(value: string, label = "Full name"): string | null {
  const v = value.trim();
  if (!v) return `${label} is required.`;
  if (v.length < 2) return `Enter a valid ${label.toLowerCase()}.`;
  if (!/\p{L}/u.test(v)) return `${label} must contain letters.`;
  return null;
}

export function emailProblem(value: string): string | null {
  const v = value.trim();
  if (!v) return "Email is required.";
  if (!isValidEmail(v)) return "Enter a valid email address.";
  return null;
}

/** For choosing a new password (signup). */
export function newPasswordProblem(value: string): string | null {
  if (!value) return "Password is required.";
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    return "Use both letters and numbers in your password.";
  }
  return null;
}

export function confirmPasswordProblem(password: string, confirm: string): string | null {
  if (!confirm) return "Confirm your password.";
  if (password !== confirm) return "Passwords do not match.";
  return null;
}

function firstMessage(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const first = value.find((v) => typeof v === "string" && v.trim());
    return typeof first === "string" ? first.trim() : null;
  }
  return null;
}

/** Maps API validation details ({ field: ["message"] }) onto form field keys. */
export function apiFieldErrors<K extends string>(
  err: ApiClientError,
  map: Record<string, K>,
): Partial<Record<K, string>> {
  const out: Partial<Record<K, string>> = {};
  const d = err.details;
  if (d && typeof d === "object" && !Array.isArray(d)) {
    for (const [key, value] of Object.entries(d as Record<string, unknown>)) {
      const field = map[key];
      const message = firstMessage(value);
      if (field && message) out[field] = message;
    }
  }
  return out;
}
