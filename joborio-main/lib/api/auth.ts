import { apiFetch } from "@/lib/api/client";
import type { User } from "@/lib/api/types";

type AuthPayload = { user: User; token: string };

export function register(input: {
  name: string;
  email: string;
  password: string;
  captcha_id?: string;
  captcha_answer?: string;
  referral_code?: string;
}) {
  return apiFetch<AuthPayload>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: {
  email: string;
  password: string;
  captcha_id?: string;
  captcha_answer?: string;
}) {
  return apiFetch<AuthPayload>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchMe() {
  return apiFetch<User>("/api/v1/auth/me", { auth: true });
}

export function logoutApi() {
  return apiFetch<{ message: string }>("/api/v1/auth/logout", {
    method: "POST",
    auth: true,
  });
}
