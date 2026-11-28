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

export type PublisherDashboardCommunity = {
  id: number;
  code: string;
  name: string;
  category?: string | null;
  status: string;
  active_members?: number;
  xml_jobs_count?: number;
  clicks?: number;
  earnings_usd?: number | null;
  member_settled_usd?: number | null;
  member_pending_usd?: number | null;
  promoting?: Array<{
    assignment_id: number;
    title?: string | null;
    pricing_model?: string | null;
    promotion_type?: string | null;
    scope?: string | null;
  }>;
  promoting_members?: Array<{
    id: number;
    name: string;
    is_promoting?: boolean;
  }>;
  promoting_members_total?: number;
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
  network?: {
    publisher_earnings_usd?: number | null;
    publisher_payable_usd?: number | null;
    publisher_paid_usd?: number | null;
    member_settled_usd?: number | null;
    member_pending_usd?: number | null;
    clicks?: number;
    signups?: number;
    applications?: number;
    conversions?: number;
    financials_visible?: boolean;
  };
  communities?: PublisherDashboardCommunity[];
  recent_communities?: PublisherDashboardCommunity[];
  recent_activity?: PublisherRecentActivity[];
  nav: Array<{ id: string; label: string; href: string }>;
};

export type PublisherRecentActivity = {
  id: string;
  kind: "member_activity" | "invite_accepted" | "ledger" | string;
  activity_type: string;
  label: string;
  title?: string | null;
  member_name?: string | null;
  community_name?: string | null;
  amount_usd?: number | null;
  occurred_at?: string | null;
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
  // Collected later, in publisher onboarding.
  country?: "IN" | "AE" | "US";
  niche_ids?: number[];
  job_preferences?: string[];
  network_type?: string;
  social_url?: string;
  website_url?: string;
  integration_preference?: string;
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

export function fetchPublisherDashboard(
  range: "1d" | "yesterday" | "3d" | "7d" | "30d" | "all" = "1d",
) {
  const q = new URLSearchParams({ range });
  return apiFetch<PublisherDashboard>(`/api/v1/publisher/dashboard?${q}`, {
    auth: true,
  });
}
