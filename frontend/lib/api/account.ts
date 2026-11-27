import { apiFetch } from "@/lib/api/client";
import { getApiBaseUrl } from "@/lib/config";
import { getAuthToken } from "@/lib/auth/session";
import type { User } from "@/lib/api/types";

/**
 * Account (profile settings) endpoints shared by creator, brand and publisher.
 * NOTE: these paths are what the frontend expects from the API:
 *   PUT    /api/v1/auth/profile        { name, username? }
 *   PUT    /api/v1/auth/password       { current_password, password, password_confirmation }
 *   POST   /api/v1/auth/profile/photo  multipart, field "photo"
 *   DELETE /api/v1/auth/profile/photo
 *   POST   /api/v1/auth/profile/cover  multipart, field "cover"  -> { cover_url }
 *   DELETE /api/v1/auth/profile/cover
 *   POST   /api/v1/auth/password/otp   (no body) emails a 6-digit OTP to the signed-in user
 * PUT /api/v1/auth/password also takes { otp } and must reject a missing / wrong / expired OTP.
 * Each returns { user } (or { message }) in the usual { success, data } envelope.
 */
export function updateAccountProfile(input: { name: string; username?: string }) {
  return apiFetch<{ user: User; message?: string }>("/api/v1/auth/profile", {
    method: "PUT",
    auth: true,
    body: JSON.stringify(input),
  });
}

/** Emails a one-time code that must be sent along with the password change. */
export function requestPasswordChangeOtp() {
  return apiFetch<{ message?: string; otp_sent?: boolean }>("/api/v1/auth/password/otp", {
    method: "POST",
    auth: true,
  });
}

export function changeAccountPassword(input: {
  otp: string;
  current_password: string;
  password: string;
  password_confirmation: string;
}) {
  return apiFetch<{ message?: string }>("/api/v1/auth/password", {
    method: "PUT",
    auth: true,
    body: JSON.stringify(input),
  });
}

export async function uploadAccountPhoto(file: File): Promise<{ avatar_url: string | null }> {
  const body = new FormData();
  body.append("photo", file);
  const token = getAuthToken();
  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}/api/v1/auth/profile/photo`, {
      method: "POST",
      headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body,
    });
  } catch {
    throw new Error("Cannot reach the server. Check your connection.");
  }
  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    data?: { avatar_url?: string | null; user?: { avatar_url?: string | null } };
    message?: string;
    error?: { message?: string };
  } | null;
  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message || json?.message || "Could not upload the photo.");
  }
  return { avatar_url: json.data?.avatar_url ?? json.data?.user?.avatar_url ?? null };
}

export async function uploadCoverBanner(file: File): Promise<{ cover_url: string | null }> {
  const body = new FormData();
  body.append("cover", file);
  const token = getAuthToken();
  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}/api/v1/auth/profile/cover`, {
      method: "POST",
      headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body,
    });
  } catch {
    throw new Error("Cannot reach the server. Check your connection.");
  }
  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    data?: { cover_url?: string | null; user?: { cover_url?: string | null } };
    message?: string;
    error?: { message?: string };
  } | null;
  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message || json?.message || "Could not upload the cover banner.");
  }
  return { cover_url: json.data?.cover_url ?? json.data?.user?.cover_url ?? null };
}

export function removeCoverBanner() {
  return apiFetch<{ message?: string }>("/api/v1/auth/profile/cover", {
    method: "DELETE",
    auth: true,
  });
}

export function removeAccountPhoto() {
  return apiFetch<{ message?: string }>("/api/v1/auth/profile/photo", {
    method: "DELETE",
    auth: true,
  });
}

/** Tells the sidebar to reload the name / photo after a change. */
export function notifyAccountUpdated() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("joborio:account-updated"));
}
