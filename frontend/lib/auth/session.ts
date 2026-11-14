import { publicCodeForUser } from "@/lib/tracking/subid";

const TOKEN_KEY = "joborio_auth_token";
const CODE_KEY = "joborio_public_code";

export function rememberPublicCode(user: {
  id: number;
  public_code?: string | null;
}): string {
  const code = publicCodeForUser(user);
  if (typeof window !== "undefined") {
    localStorage.setItem(CODE_KEY, code);
  }
  return code;
}

export function getPublicCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CODE_KEY);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CODE_KEY);
}

export function postLoginRedirect(hasCreator: boolean): string {
  return hasCreator ? "/creator/dashboard" : "/onboarding";
}
