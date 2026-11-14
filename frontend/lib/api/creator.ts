import { apiFetch, apiFetchWithMeta } from "@/lib/api/client";
import type { Listing, Niche } from "@/lib/api/types";

export type CreatorListingRow = {
  listing: Listing;
  is_pinned: boolean;
  is_hidden: boolean;
  tracked_url: string;
};

export function fetchNiches() {
  return apiFetch<Niche[]>("/api/v1/niches");
}

export function createCreatorOnboarding(body: {
  handle: string;
  bio?: string;
  social_links: {
    linkedin?: string;
    instagram?: string;
    community?: string;
    website?: string;
  };
  niche_ids?: number[];
  audience_countries?: string[];
  audience_size_estimate?: number;
  referral_code?: string;
  promote_job_types?: string[];
}) {
  return apiFetch<{ creator: { handle: string }; public_url: string }>(
    "/api/v1/creator/onboarding",
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
    },
  );
}

export function updateCreatorProfile(body: {
  bio?: string;
  profile_photo_path?: string;
  accent_color?: string;
  social_links?: Record<string, string>;
  niche_ids?: number[];
  audience_countries?: string[];
  audience_size_estimate?: number;
}) {
  return apiFetch<{
    creator: Record<string, unknown>;
    public_url: string;
    link_live: boolean;
  }>("/api/v1/creator/onboarding", {
    method: "PUT",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function fetchCreatorDashboard() {
  return apiFetch<Record<string, unknown>>("/api/v1/creator/dashboard", {
    auth: true,
  });
}

export type CreatorClickRow = {
  id: number;
  event_type: string;
  is_counted: boolean;
  fraud_status?: string | null;
  ip_address?: string | null;
  created_at?: string;
  meta?: { title?: string; clicked_at?: string; duplicate_of_event_id?: number };
  listing?: { title?: string } | null;
};

export function fetchCreatorClicks(page = 1) {
  return apiFetchWithMeta<CreatorClickRow[]>(
    `/api/v1/creator/clicks?page=${page}`,
    { auth: true },
  );
}

export function fetchCreatorListings() {
  return apiFetch<CreatorListingRow[]>("/api/v1/creator/listings", {
    auth: true,
  });
}

export type CreatorOpportunityTargeting = {
  keywords: string[];
  industry: string[];
  brands: string[];
  audience_type: string[];
  work_mode: string[];
  currency: string;
};

export type CreatorOpportunityPreferences = {
  salary_min?: number | null;
  salary_max?: number | null;
  experience?: string[];
  duration?: string | null;
  education?: string[];
  skills?: string[];
};

export type CreatorJobPreferences = {
  niche_ids: number[];
  countries: string[];
  prefer_remote: boolean;
  job_types?: string[];
  opportunity_categories?: string[];
  opportunity_targeting?: CreatorOpportunityTargeting;
  opportunity_preferences?: CreatorOpportunityPreferences;
  visible_preference_keys?: string[];
  options?: {
    categories: string[];
    experience_levels: string[];
    work_modes: string[];
    currencies: string[];
    preference_keys_by_category: Record<string, string[]>;
  };
};

export function fetchCreatorJobPreferences() {
  return apiFetch<CreatorJobPreferences>("/api/v1/creator/job-preferences", {
    auth: true,
  });
}

export function updateCreatorJobPreferences(body: {
  niche_ids?: number[];
  countries?: string[];
  prefer_remote?: boolean;
  job_types?: string[];
  opportunity_categories?: string[];
  opportunity_targeting?: CreatorOpportunityTargeting;
  opportunity_preferences?: CreatorOpportunityPreferences;
}) {
  return apiFetch<CreatorJobPreferences & { listings_synced?: number }>(
    "/api/v1/creator/job-preferences",
    {
      method: "PUT",
      auth: true,
      body: JSON.stringify(body),
    },
  );
}

export function fetchCreatorPreferredJobs() {
  return apiFetch<Listing[]>("/api/v1/creator/preferred-jobs", { auth: true });
}

export function patchCreatorListing(
  listingId: number,
  body: { is_pinned?: boolean; is_hidden?: boolean },
) {
  return apiFetch<CreatorListingRow & { listing: Listing }>(
    `/api/v1/creator/listings/${listingId}`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(body),
    },
  );
}

export function fetchCreatorEarnings(page = 1) {
  return apiFetch<Array<Record<string, unknown>>>(
    `/api/v1/creator/earnings?page=${page}`,
    { auth: true },
  );
}

export type CreatorRegistrationRow = {
  id: number;
  email_masked: string;
  status: string;
  created_at: string;
  email_verified_at?: string | null;
  listing?: { id: number; title: string; company_name?: string | null };
  earning?: { id: number; net_usd: string | number; state: string } | null;
};

export function fetchCreatorRegistrations(params?: {
  status?: string;
  page?: number;
  program_id?: number;
  listing_id?: number;
}) {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.page) q.set("page", String(params.page));
  if (params?.program_id) q.set("program_id", String(params.program_id));
  if (params?.listing_id) q.set("listing_id", String(params.listing_id));
  const query = q.toString();
  return apiFetchWithMeta<CreatorRegistrationRow[]>(
    `/api/v1/creator/registrations${query ? `?${query}` : ""}`,
    { auth: true },
  );
}

export type PayoutAccount = {
  payout_method: string | null;
  payout_currency?: string | null;
  currency_symbol?: string | null;
  payout_holder_name: string | null;
  payout_upi_id: string | null;
  payout_paypal_email: string | null;
  payout_bank_name: string | null;
  payout_account_number: string | null;
  payout_ifsc: string | null;
  min_payout_usd: number;
  platform_fee_percent?: number;
  auto_payout_eligible: boolean;
};

export type CreatorTransaction = {
  id: string;
  kind: "credit" | "debit";
  title: string;
  description?: string | null;
  amount_usd: number | string;
  status: string;
  occurred_at?: string | null;
};

export function fetchCreatorTransactions(page = 1) {
  return apiFetchWithMeta<CreatorTransaction[]>(
    `/api/v1/creator/transactions?page=${page}`,
    { auth: true },
  );
}

export function fetchPayoutAccount() {
  return apiFetch<PayoutAccount>("/api/v1/creator/payout-account", { auth: true });
}

export function savePayoutAccount(body: Partial<PayoutAccount>) {
  return apiFetch<PayoutAccount>("/api/v1/creator/payout-account", {
    method: "PUT",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function recordJobActivity(body: {
  reference_id: string;
  action: "view" | "apply";
  title?: string;
  company?: string;
}) {
  return apiFetch<{ tracked: boolean; event_id: number; earning_id?: number | null }>(
    "/api/v1/creator/job-activity",
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
    },
  );
}

export function fetchTrackLink(listingId: number) {
  return apiFetch<{ tracked_url: string; token: string; listing_id: number }>(
    `/api/v1/creator/listings/${listingId}/track-link`,
    { auth: true },
  );
}

export type CreatorCampaignRow = {
  program: Record<string, unknown> & {
    id: number;
    title: string;
    pricing_model: string;
    promotion_type?: string;
    rate_usd: string;
    budget_total_usd: string;
    status: string;
    post_url?: string | null;
    engagement_actions?: string[] | null;
    engage_brief?: string | null;
    listing?: { id: number; title: string };
  };
  joined: boolean;
};

export function submitPostPromote(
  programId: number,
  body: {
    actions_done: Array<"like" | "comment" | "repost">;
    proof_url?: string;
    proof_note?: string;
  },
) {
  return apiFetch<{ submission: Record<string, unknown> }>(
    `/api/v1/creator/campaigns/${programId}/post-promote`,
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
    },
  );
}

export function fetchCreatorCampaigns() {
  return apiFetch<{ campaigns: CreatorCampaignRow[] }>(
    "/api/v1/creator/campaigns",
    { auth: true },
  ).then((d) => d.campaigns);
}

export function optInCampaign(programId: number) {
  return apiFetch<{ joined: boolean }>(
    `/api/v1/creator/campaigns/${programId}/opt-in`,
    { method: "POST", auth: true },
  );
}

export function optOutCampaign(programId: number) {
  return apiFetch<{ joined: boolean }>(
    `/api/v1/creator/campaigns/${programId}/opt-out`,
    { method: "POST", auth: true },
  );
}

export type CreatorReferralDashboard = {
  referral_code: string;
  referral_url: string;
  currency?: string;
  currency_symbol?: string;
  terms: {
    bonus_usd: number;
    bonus_threshold_usd: number;
    override_percent: number;
    override_months: number;
  };
  stats: {
    signups: number;
    active_referrals: number;
    bonus_earned_usd: number;
    override_earned_usd: number;
    total_referral_usd: number;
  };
  referred_creators: Array<{
    id: number;
    handle: string;
    joined_at: string;
    approved_earnings_usd: number;
    is_active: boolean;
    bonus_paid: boolean;
  }>;
};

export function fetchCreatorReferrals() {
  return apiFetch<CreatorReferralDashboard>("/api/v1/creator/referrals", {
    auth: true,
  });
}

export function claimCreatorReferral(referral_code: string) {
  return apiFetch<{
    attached: boolean;
    already: boolean;
    referred_by_creator_id: number | null;
  }>("/api/v1/creator/referrals/claim", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ referral_code }),
  });
}

export type UserNotificationRow = {
  id: number;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export function fetchCreatorNotifications() {
  return apiFetchWithMeta<UserNotificationRow[]>("/api/v1/creator/notifications", {
    auth: true,
  });
}

export function markAllNotificationsRead() {
  return apiFetch<{ ok: boolean }>("/api/v1/creator/notifications/read-all", {
    method: "POST",
    auth: true,
  });
}

export function fetchTrustTierDetails() {
  return apiFetch<Record<string, unknown>>("/api/v1/creator/trust-tier", {
    auth: true,
  });
}

export function fetchAiStudioQuota() {
  return apiFetch<{ used: number; cap: number; remaining: number }>(
    "/api/v1/creator/ai-studio/quota",
    { auth: true },
  );
}

export function generateAiPost(body: { listing_id: number; platform: string }) {
  return apiFetch<{
    content: string;
    platform: string;
    tracked_url: string;
    remaining: number;
  }>("/api/v1/creator/ai-studio/generate", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}
