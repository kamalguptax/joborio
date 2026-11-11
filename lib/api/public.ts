import { apiFetch } from "@/lib/api/client";

export function healthCheck() {
  return apiFetch<{ ok: boolean; service: string }>("/api/v1/health");
}

export type OAuthProvider = {
  id: string;
  redirect_url: string;
};

export function fetchAuthProviders() {
  return apiFetch<{ providers: OAuthProvider[] }>("/api/v1/auth/providers");
}

export function logout() {
  return apiFetch<{ message: string }>("/api/v1/auth/logout", {
    method: "POST",
    auth: true,
  });
}

export function verifyPprRegistration(id: number, token: string) {
  return apiFetch<Record<string, unknown>>(
    `/api/v1/ppr/verify/${id}?token=${encodeURIComponent(token)}`,
  );
}
