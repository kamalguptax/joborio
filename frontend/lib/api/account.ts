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
 * Each returns { user } (or { message }) in the usual { success, data } envelope.
 */
export function updateAccountProfile(input: { name: string; username?: string }) {
  return apiFetch<{ user: User; message?: string }>("/api/v1/auth/profile", {
    method: "PUT",
    auth: true,
    body: JSON.stringify(input),
  });
}

export function changeAccountPassword(input: {
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
