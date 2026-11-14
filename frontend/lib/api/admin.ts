import { apiFetch, apiFetchWithMeta } from "@/lib/api/client";
import type { Listing } from "@/lib/api/types";
import { refreshSyndicationCache } from "@/lib/api/syndication";

export { refreshSyndicationCache };

export type AdminListingInput = Partial<Listing> & {
  title?: string;
  destination_url?: string;
  status?: string;
};

export function adminListListings(params?: {
  status?: string;
  source?: string;
  page?: number;
  per_page?: number;
}) {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.source) q.set("source", params.source);
  if (params?.page) q.set("page", String(params.page));
  if (params?.per_page) q.set("per_page", String(params.per_page));
  const query = q.toString();
  return apiFetchWithMeta<Listing[]>(
    `/api/v1/admin/listings${query ? `?${query}` : ""}`,
    { auth: true },
  );
}

export function adminCreateListing(body: AdminListingInput) {
  return apiFetch<Listing>("/api/v1/admin/listings", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function adminUpdateListing(id: number, body: AdminListingInput) {
  return apiFetch<Listing>(`/api/v1/admin/listings/${id}`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function adminDeleteListing(id: number) {
  return apiFetch<{ message: string }>(`/api/v1/admin/listings/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export function adminIngestListings() {
  return apiFetch<Record<string, unknown>>("/api/v1/admin/listings/ingest", {
    method: "POST",
    auth: true,
  });
}

export function adminFraudQueue(page = 1) {
  return apiFetchWithMeta<Array<Record<string, unknown>>>(
    `/api/v1/admin/fraud-queue?page=${page}`,
    { auth: true },
  );
}

export function adminResolveFraud(
  id: number,
  body: { status: "resolved" | "dismissed"; admin_notes?: string },
) {
  return apiFetch<Record<string, unknown>>(
    `/api/v1/admin/fraud-queue/${id}/resolve`,
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
    },
  );
}

export function adminDisputes(page = 1) {
  return apiFetchWithMeta<Array<Record<string, unknown>>>(
    `/api/v1/admin/disputes?page=${page}`,
    { auth: true },
  );
}

export function adminResolveDispute(
  id: number,
  body: { status: "upheld" | "rejected"; admin_notes?: string },
) {
  return apiFetch<Record<string, unknown>>(
    `/api/v1/admin/disputes/${id}/resolve`,
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
    },
  );
}

export function adminPayoutPreview(mode: "all" | "auto" | "manual" = "all") {
  return apiFetch<Record<string, unknown>>(
    `/api/v1/admin/payouts/preview?mode=${mode}`,
    { auth: true },
  );
}

export function adminCreatePayoutBatch(mode: "auto" | "manual" = "manual") {
  return apiFetch<Record<string, unknown>>("/api/v1/admin/payouts/batches", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ mode }),
  });
}

export function adminCompletePayoutBatch(batchId: number) {
  return apiFetch<Record<string, unknown>>(
    `/api/v1/admin/payouts/batches/${batchId}/complete`,
    {
      method: "POST",
      auth: true,
    },
  );
}

export function adminPayoutTransactions(params?: {
  view?: "users";
  page?: number;
  user_id?: number;
  search?: string;
}) {
  const q = new URLSearchParams();
  if (params?.view) q.set("view", params.view);
  if (params?.page) q.set("page", String(params.page));
  if (params?.user_id) q.set("user_id", String(params.user_id));
  if (params?.search) q.set("search", params.search);
  return apiFetchWithMeta<Array<Record<string, unknown>>>(
    `/api/v1/admin/payouts/transactions?${q}`,
    { auth: true },
  );
}

export function adminListPayoutBatches() {
  return apiFetch<Array<Record<string, unknown>>>(
    "/api/v1/admin/payouts/batches",
    { auth: true },
  );
}

export const CAMPAIGN_TYPES = [
  { id: "job", label: "Jobs" },
  { id: "course", label: "Courses" },
  { id: "tool", label: "Tools" },
  { id: "branding", label: "Branding promotion" },
  { id: "post_promote", label: "Post promote (like / comment / repost)" },
  { id: "other", label: "Other" },
] as const;

export type CampaignTypeId = (typeof CAMPAIGN_TYPES)[number]["id"];

export function adminListPrograms(page = 1, promotionType?: string) {
  const q = new URLSearchParams({ page: String(page) });
  if (promotionType) q.set("promotion_type", promotionType);
  return apiFetchWithMeta<Array<Record<string, unknown>>>(
    `/api/v1/admin/programs?${q}`,
    { auth: true },
  );
}

export function adminCreateProgram(body: {
  title: string;
  description?: string;
  destination_url: string;
  company_name?: string;
  promotion_type: CampaignTypeId;
  pricing_model: "ppc" | "ppr" | "ppa" | "ppe";
  rate_usd: number;
  budget_total_usd: number;
  trial_without_ip?: boolean;
  target_countries?: string[];
  country_code?: string;
  is_remote?: boolean;
  category?: string;
  post_url?: string;
  engagement_actions?: Array<"like" | "comment" | "repost">;
  engage_brief?: string;
}) {
  return apiFetch<{ program: Record<string, unknown> }>(
    "/api/v1/admin/programs",
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
    },
  );
}

export type CampaignEarningRow = {
  id: number | null;
  title: string;
  pricing_model?: string;
  status?: string;
  employer?: string | null;
  budget_total_usd?: number | null;
  budget_spent_usd?: number | null;
  earning_count: number;
  gross_usd: number;
  platform_fee_usd: number;
  net_usd: number;
  pending_usd: number;
  approved_usd: number;
  payable_usd: number;
  paid_usd: number;
  ppc_usd: number;
  ppr_usd: number;
  ppa_usd: number;
};

export type CampaignEarningsOverview = {
  campaigns: CampaignEarningRow[];
  organic: CampaignEarningRow;
  totals: Omit<CampaignEarningRow, "id" | "title" | "pricing_model" | "status" | "employer">;
  currency: string;
  currency_symbol: string;
};

export function adminCampaignEarnings() {
  return apiFetch<CampaignEarningsOverview>("/api/v1/admin/campaign-earnings", {
    auth: true,
  });
}

export function adminActivateProgram(programId: number) {
  return apiFetch<{ program: Record<string, unknown> }>(
    `/api/v1/admin/programs/${programId}/activate`,
    { method: "POST", auth: true },
  );
}

export function adminPauseProgram(programId: number) {
  return apiFetch<{ program: Record<string, unknown> }>(
    `/api/v1/admin/programs/${programId}/pause`,
    { method: "POST", auth: true },
  );
}

export type AdminOverview = {
  counts: Record<string, number>;
  syndication_source: Record<string, unknown>;
  syndication_feeds?: SyndicationFeedRow[];
  recent_clicks: Array<Record<string, unknown>>;
  recent_signups: Array<Record<string, unknown>>;
  click_dedup_minutes?: number;
};

export type SyndicationFeedRow = {
  id: number;
  name: string;
  slug: string;
  feed_url: string;
  format: string;
  job_xpath: string;
  country_code?: string | null;
  is_active: boolean;
  use_sample_when_empty: boolean;
  sample_path?: string | null;
  sort_order: number;
  last_fetched_at?: string | null;
  last_job_count: number;
  last_error?: string | null;
  last_publisher?: string | null;
  last_build_date?: string | null;
};

export function adminListSyndicationFeeds() {
  return apiFetch<SyndicationFeedRow[]>("/api/v1/admin/syndication-feeds", {
    auth: true,
  });
}

export function adminCreateSyndicationFeed(body: Partial<SyndicationFeedRow>) {
  return apiFetch<SyndicationFeedRow>("/api/v1/admin/syndication-feeds", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function adminUpdateSyndicationFeed(
  id: number,
  body: Partial<SyndicationFeedRow>,
) {
  return apiFetch<SyndicationFeedRow>(`/api/v1/admin/syndication-feeds/${id}`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function adminDeleteSyndicationFeed(id: number) {
  return apiFetch<{ deleted: boolean }>(
    `/api/v1/admin/syndication-feeds/${id}`,
    { method: "DELETE", auth: true },
  );
}

export function adminRefreshSyndicationFeed(id: number) {
  return apiFetch<{
    feed: SyndicationFeedRow;
    job_count: number;
    source: Record<string, unknown>;
  }>(`/api/v1/admin/syndication-feeds/${id}/refresh`, {
    method: "POST",
    auth: true,
  });
}

export function adminRefreshAllSyndicationFeeds() {
  return apiFetch<{
    total_in_feed: number;
    sources: Array<Record<string, unknown>>;
    source: Record<string, unknown>;
  }>("/api/v1/admin/syndication-feeds/refresh-all", {
    method: "POST",
    auth: true,
  });
}

export function adminProbeSyndicationFeed(id: number) {
  return apiFetch<{
    job_count: number;
    source: Record<string, unknown>;
    sample_jobs: Array<Record<string, unknown>>;
  }>(`/api/v1/admin/syndication-feeds/${id}/probe`, {
    method: "POST",
    auth: true,
  });
}

export function adminOverview() {
  return apiFetch<AdminOverview>("/api/v1/admin/overview", { auth: true });
}

export type TrackedWebsiteRow = {
  id: number;
  name: string;
  domain: string;
  public_key: string;
  is_active: boolean;
  created_at?: string;
  pageviews_count?: number;
  events_total_count?: number;
  last_event_at?: string | null;
  script_url: string;
  embed_snippet: string;
  install_note?: string;
};

export function adminListTrackedWebsites() {
  return apiFetch<TrackedWebsiteRow[]>("/api/v1/admin/tracked-websites", {
    auth: true,
  });
}

export function adminCreateTrackedWebsite(body: {
  name: string;
  domain: string;
  is_active?: boolean;
}) {
  return apiFetch<TrackedWebsiteRow>("/api/v1/admin/tracked-websites", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function adminTrackedWebsiteDetail(id: number) {
  return apiFetch<{
    site: TrackedWebsiteRow;
    stats: Record<string, number>;
    recent_events: Array<Record<string, unknown>>;
  }>(`/api/v1/admin/tracked-websites/${id}`, { auth: true });
}

export function adminUpdateTrackedWebsite(
  id: number,
  body: Partial<{ name: string; domain: string; is_active: boolean }>,
) {
  return apiFetch<TrackedWebsiteRow>(`/api/v1/admin/tracked-websites/${id}`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function adminDeleteTrackedWebsite(id: number) {
  return apiFetch<{ deleted: boolean }>(`/api/v1/admin/tracked-websites/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export type AdminUserRow = {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  public_code?: string;
  roles?: Array<{ name: string }>;
  creator?: {
    id: number;
    handle: string;
    trust_tier?: string;
    approval_status?: string;
    approved_at?: string | null;
    social_links?: Record<string, string> | null;
    onboarding_completed_at?: string | null;
  } | null;
  employer?: { id: number; company_name: string } | null;
};

export function adminListUsers(params?: {
  search?: string;
  role?: string;
  approval_status?: string;
  page?: number;
}) {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.role) q.set("role", params.role);
  if (params?.approval_status) q.set("approval_status", params.approval_status);
  if (params?.page) q.set("page", String(params.page));
  const query = q.toString();
  return apiFetchWithMeta<AdminUserRow[]>(
    `/api/v1/admin/users${query ? `?${query}` : ""}`,
    { auth: true },
  );
}

export function adminGetUser(id: number) {
  return apiFetch<{
    user: AdminUserRow & Record<string, unknown>;
    recent_attribution_events: Array<Record<string, unknown>>;
    ppr_registrations: Array<Record<string, unknown>>;
    activity_summary?: {
      clicks_total: number;
      clicks_counted: number;
      signups_total: number;
      ppr_total: number;
    };
    earnings_summary?: {
      pending_usd: number;
      approved_usd: number;
      payable_usd: number;
      paid_usd: number;
      gross_usd: number;
      net_usd: number;
      ledger_count: number;
    } | null;
    earnings_by_type?: Record<
      string,
      {
        pending_usd: number;
        approved_usd: number;
        payable_usd: number;
        paid_usd: number;
        net_usd: number;
        count: number;
      }
    > | null;
    earnings_by_campaign?: Array<Record<string, unknown>>;
    recent_earnings?: Array<Record<string, unknown>>;
  }>(`/api/v1/admin/users/${id}`, { auth: true });
}

export function adminUpdateUser(
  id: number,
  body: {
    is_active?: boolean;
    name?: string;
    creator_approval_status?: "pending" | "approved" | "rejected";
  },
) {
  return apiFetch<AdminUserRow>(`/api/v1/admin/users/${id}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function adminActivity(params?: {
  type?: "clicks" | "signups";
  view?: "users";
  page?: number;
  event_type?: string;
  fraud_status?: string;
  user_id?: number;
  creator_id?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
  earning?: string;
  category?: string;
  is_counted?: boolean;
}) {
  const q = new URLSearchParams();
  if (params?.type) q.set("type", params.type);
  if (params?.view) q.set("view", params.view);
  if (params?.page) q.set("page", String(params.page));
  if (params?.event_type) q.set("event_type", params.event_type);
  if (params?.fraud_status) q.set("fraud_status", params.fraud_status);
  if (params?.user_id) q.set("user_id", String(params.user_id));
  if (params?.creator_id) q.set("creator_id", String(params.creator_id));
  if (params?.search) q.set("search", params.search);
  if (params?.date_from) q.set("date_from", params.date_from);
  if (params?.date_to) q.set("date_to", params.date_to);
  if (params?.earning) q.set("earning", params.earning);
  if (params?.category) q.set("category", params.category);
  if (params?.is_counted !== undefined) q.set("is_counted", params.is_counted ? "1" : "0");
  return apiFetchWithMeta<Array<Record<string, unknown>>>(
    `/api/v1/admin/activity?${q}`,
    { auth: true },
  );
}

export function adminSyndicationJobs(params?: {
  per_page?: number;
  group_by_category?: boolean;
  feed?: string;
}) {
  const q = new URLSearchParams();
  if (params?.per_page) q.set("per_page", String(params.per_page));
  if (params?.group_by_category) q.set("group_by_category", "1");
  if (params?.feed) q.set("feed", params.feed);
  return apiFetchWithMeta<{
    jobs: Array<Record<string, unknown>>;
    grouped_by_category?: Record<string, Array<Record<string, unknown>>>;
    filters: Record<string, string[]>;
    source: Record<string, unknown>;
  }>(`/api/v1/syndication/vigyapanam/jobs?${q}`, { auth: false });
}

export type JobMasterAdminRow = {
  id: number;
  type: string;
  parent_id: number | null;
  name: string;
  slug: string;
  code?: string | null;
  sort_order: number;
  is_active: boolean;
  parent?: { id: number; name: string; type: string } | null;
};

const MASTER_TYPES = [
  "country",
  "state",
  "city",
  "category",
  "job_type",
  "experience",
  "education",
  "company",
] as const;

export { MASTER_TYPES };

export function adminListJobMasters(type: string, page = 1) {
  return apiFetchWithMeta<JobMasterAdminRow[]>(
    `/api/v1/admin/job-masters?type=${encodeURIComponent(type)}&page=${page}`,
    { auth: true },
  );
}

export function adminCreateJobMaster(body: Record<string, unknown>) {
  return apiFetch<JobMasterAdminRow>("/api/v1/admin/job-masters", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function adminUpdateJobMaster(id: number, body: Record<string, unknown>) {
  return apiFetch<JobMasterAdminRow>(`/api/v1/admin/job-masters/${id}`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function adminDeactivateJobMaster(id: number) {
  return apiFetch<{ message: string }>(`/api/v1/admin/job-masters/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export type SecretFieldMeta = {
  configured: boolean;
  source: "database" | "env" | "none";
  masked: string | null;
};

export type AdminPlatformSettings = {
  maps: {
    google_maps_enabled: boolean;
    geolocation_tracking: boolean;
    google_maps_api_key: SecretFieldMeta;
    google_maps_browser_api_key: SecretFieldMeta;
  };
  general: {
    frontend_url: string;
  };
  referral: {
    bonus_usd: number;
    bonus_threshold_usd: number;
    override_percent: number;
    override_months: number;
  };
  payout: {
    platform_fee_percent: number;
    min_payout_usd: number;
    ppc_rate_usd: number;
    ppr_rate_usd: number;
    ppa_rate_usd: number;
    ppc_hold_days: number;
    ppc_hold_days_higher: number;
    ppr_hold_days: number;
    ppa_hold_days: number;
    currency?: string;
    currency_symbol?: string;
  };
  integrations: {
    openai_api_key: SecretFieldMeta;
  };
  env_fallback_note?: string;
};

export function adminFetchPlatformSettings() {
  return apiFetch<AdminPlatformSettings>("/api/v1/admin/platform-settings", {
    auth: true,
  });
}

export function adminUpdatePlatformSettings(body: {
  maps?: {
    google_maps_enabled?: boolean;
    geolocation_tracking?: boolean;
    google_maps_api_key?: string;
    google_maps_browser_api_key?: string;
  };
  general?: { frontend_url?: string };
  referral?: {
    bonus_usd?: number;
    bonus_threshold_usd?: number;
    override_percent?: number;
    override_months?: number;
  };
  payout?: {
    platform_fee_percent?: number;
    min_payout_usd?: number;
    ppc_rate_usd?: number;
    ppr_rate_usd?: number;
    ppa_rate_usd?: number;
    ppc_hold_days?: number;
    ppc_hold_days_higher?: number;
    ppr_hold_days?: number;
    ppa_hold_days?: number;
    currency?: string;
  };
  integrations?: { openai_api_key?: string };
}) {
  return apiFetch<AdminPlatformSettings>("/api/v1/admin/platform-settings", {
    method: "PUT",
    auth: true,
    body: JSON.stringify(body),
  });
}

export type AdminPublisherRow = {
  id: number;
  code: string;
  username: string;
  display_name: string;
  country_code: string;
  network_type: string;
  status: string;
  status_label: string;
  created_at?: string | null;
};

export function adminListPublishers(status = "all") {
  const q = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<{ publishers: AdminPublisherRow[] }>(
    `/api/v1/admin/publishers${q}`,
    { auth: true },
  ).then((d) => d.publishers);
}

export function adminActivatePublisher(id: number) {
  return apiFetch<{
    publisher: {
      id: number;
      status: string;
      status_label: string;
      activated_at?: string | null;
    };
  }>(`/api/v1/admin/publishers/${id}/activate`, {
    method: "POST",
    auth: true,
  });
}
