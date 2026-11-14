import { apiFetch } from "@/lib/api/client";
import type { User } from "@/lib/api/types";

export type CaptchaChallenge = {
  captcha_id: string;
  question: string;
  provider?: "math" | "turnstile";
  site_key?: string;
};

export type BrandRegisterInput = {
  company_name: string;
  trading_name: string;
  entity_region: "IN" | "US" | "UK" | "AE" | "OTHER";
  gst_number?: string;
  pan_number?: string;
  tax_id?: string;
  billing_address?: string;
  website?: string;
  email: string;
  password: string;
  password_confirmation: string;
  accepted_terms: boolean;
  captcha_id: string;
  captcha_answer: string;
};

export function fetchCaptcha(options?: { math?: boolean }) {
  const q = options?.math ? "?math=1" : "";
  return apiFetch<CaptchaChallenge>(`/api/v1/auth/captcha${q}`);
}

export function registerBrand(body: BrandRegisterInput) {
  return apiFetch<{
    verification_required: boolean;
    email: string;
    message: string;
    otp_sent?: boolean;
  }>("/api/v1/auth/brand/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function verifyEmailOtp(body: { email: string; otp: string }) {
  return apiFetch<{ user: User; token: string; message: string }>(
    "/api/v1/auth/email/verify-otp",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export function resendEmailOtp(body: { email: string }) {
  return apiFetch<{ message: string; otp_sent?: boolean; debug_otp?: string }>(
    "/api/v1/auth/email/resend-otp",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export function forgotPassword(body: {
  email: string;
  captcha_id: string;
  captcha_answer: string;
}) {
  return apiFetch<{ message: string }>("/api/v1/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function resetPassword(body: {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}) {
  return apiFetch<{ message: string }>("/api/v1/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
