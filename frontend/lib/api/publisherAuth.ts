import { apiFetch } from "@/lib/api/client";
import type { User } from "@/lib/api/types";

export type PublisherProfile = {
  id: number;
  code: string;
  username: string;
  display_name: string;
  country_code: string;
  network_type: string;
  integration_preference: string;
  status: string;
  status_label: string;
  is_activated: boolean;
  social_url: string;
  website_url: string;
  job_preferences?: string[];
  niche_ids?: number[];
};

export type PublisherAuthPayload = {
  user: User;
  publisher: PublisherProfile;
  membership?: { role: string };
  token: string;
  message?: string;
};

export type PublisherDashboard = {
  publisher: PublisherProfile;
  membership: {
    role: string;
    can_view_financials?: boolean;
  };
  overview: {
    communities: number;
    members: number;
    active_campaigns: number;
    live_campaigns?: number;
    running_campaigns?: number;
    pending_invites: number;
    overall_earnings_usd?: number | null;
    total_payout_usd?: number | null;
    payable_usd?: number | null;
  };
  nav: Array<{ id: string; label: string; href: string }>;
};

export function checkPublisherUsername(username: string) {
  const params = new URLSearchParams({ username: username.trim() });
  return apiFetch<{
    username: string;
    available: boolean;
    valid: boolean;
    message: string;
  }>(`/api/v1/auth/publisher/check-username?${params.toString()}`);
}

export function registerPublisher(input: {
  full_name: string;
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
  country: "IN" | "AE" | "US";
  niche_ids: number[];
  job_preferences: string[];
  network_type: string;
  social_url: string;
  website_url: string;
  integration_preference: string;
  accepted_terms: boolean;
  captcha_id: string;
  captcha_answer: string;
}) {
  return apiFetch<PublisherAuthPayload>("/api/v1/auth/publisher/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function loginPublisher(input: {
  email: string;
  password: string;
  captcha_id: string;
  captcha_answer: string;
}) {
  return apiFetch<PublisherAuthPayload>("/api/v1/auth/publisher/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchPublisherDashboard() {
  return apiFetch<
    PublisherDashboard & {
      recent_communities?: Array<{
        id: number;
        code: string;
        name: string;
        category?: string | null;
        status: string;
      }>;
    }
  >("/api/v1/publisher/dashboard", {
    auth: true,
  });
}
