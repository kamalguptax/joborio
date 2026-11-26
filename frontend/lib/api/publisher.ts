import { apiFetch } from "@/lib/api/client";
import type { PublisherDashboard } from "@/lib/api/publisherAuth";

export type PublisherCommunity = {
  id: number;
  code: string;
  name: string;
  category?: string | null;
  categories?: string[];
  commission_percent?: number | null;
  description?: string | null;
  country_code?: string | null;
  campaign_access: string;
  xml_job_refs?: string[];
  xml_jobs_count?: number;
  status: string;
  members_count: number;
  clicks_total?: number;
  manager_user_id?: number | null;
  manager?: { id: number; name: string; email: string } | null;
  join_url?: string | null;
  join_path?: string | null;
  created_at?: string | null;
};

/** Prefer current site origin + path so production never shows API localhost. */
function rewriteLocalUrl(raw: string): string {
  if (typeof window === "undefined" || !raw) return raw;
  if (raw.startsWith("/")) {
    return `${window.location.origin}${raw}`;
  }
  try {
    const u = new URL(raw);
    if (
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1" ||
      u.hostname.endsWith(".local")
    ) {
      return `${window.location.origin}${u.pathname}${u.search}${u.hash}`;
    }
  } catch {
    /* keep raw */
  }
  return raw;
}

export function absoluteSiteUrl(
  pathOrUrl: string | null | undefined,
  fallbackUrl?: string | null,
): string {
  const raw = (pathOrUrl ?? "").trim();
  if (raw) return rewriteLocalUrl(raw);
  return rewriteLocalUrl((fallbackUrl ?? "").trim());
}

export function communityJoinUrl(
  row: Pick<PublisherCommunity, "join_url" | "join_path">,
): string {
  return absoluteSiteUrl(row.join_path, row.join_url);
}

export type PublisherTeamMember = {
  id: number;
  user_id: number;
  role: string;
  name?: string | null;
  email?: string | null;
};

export type PublisherInvitation = {
  id: number;
  token: string;
  email?: string | null;
  channel: string;
  status: string;
  expires_at?: string | null;
  community?: { id: number; code: string; name: string } | null;
  path: string;
  created_at?: string | null;
};

export type NetworkMemberActivitySummary = {
  clicks_total: number;
  clicks_valid: number;
  clicks_duplicate?: number;
  signups: number;
  applications: number;
  leads: number;
  conversions: number;
};

export type NetworkMemberRow = {
  id: number;
  display_name?: string | null;
  email?: string | null;
  status: string;
  joined_at?: string | null;
  registered_at?: string | null;
  last_activity_at?: string | null;
  left_at?: string | null;
  released_at?: string | null;
  communities?: Array<{
    id: number;
    code: string;
    name: string;
    status: string;
  }>;
  activity?: NetworkMemberActivitySummary;
  earnings?: {
    settled_usd: number;
    pending_usd: number;
    total_usd: number;
    currency: string;
  } | null;
};

export type PublisherDashboardRange =
  | "1d"
  | "yesterday"
  | "3d"
  | "7d"
  | "30d"
  | "all";

export function fetchPublisherDashboard(range: PublisherDashboardRange = "1d") {
  const q = new URLSearchParams({ range });
  return apiFetch<
    PublisherDashboard & {
      recent_communities?: PublisherCommunity[];
      range?: { key: string; label: string; start?: string | null; end?: string | null };
    }
  >(`/api/v1/publisher/dashboard?${q}`, { auth: true });
}

export function fetchPublisherCommunities() {
  return apiFetch<{ communities: PublisherCommunity[] }>(
    "/api/v1/publisher/communities",
    { auth: true },
  ).then((d) => d.communities);
}

export type PublisherCommunityDashboard = {
  community: PublisherCommunity;
  summary: {
    members_active: number;
    members_total: number;
    clicks: number;
    signups: number;
    applications: number;
    conversions: number;
    pending_invites: number;
    xml_jobs_count: number;
    publisher_earnings_usd?: number | null;
    campaigns_earned_usd?: number | null;
    campaigns_pending_usd?: number | null;
    campaigns_total_usd?: number | null;
    member_settled_usd?: number | null;
    member_pending_usd?: number | null;
  };
  members: NetworkMemberRow[];
  assignments: Array<{
    id: number;
    status: string;
    pricing_model?: string | null;
    accepted_rate_usd?: string | number | null;
    program_title?: string | null;
    scope?: string | null;
    earned_usd?: number | null;
    pending_usd?: number | null;
    total_usd?: number | null;
  }>;
  recent_activity: Array<{
    id: number;
    activity_type: string;
    title?: string | null;
    member_name?: string | null;
    occurred_at?: string | null;
  }>;
  can_view_financials: boolean;
};

export function fetchPublisherCommunityDashboard(communityId: number) {
  return apiFetch<PublisherCommunityDashboard>(
    `/api/v1/publisher/communities/${communityId}/dashboard`,
    { auth: true },
  );
}

export function createPublisherCommunity(body: {
  name: string;
  category?: string;
  categories?: string[];
  commission_percent: number;
  description?: string;
  country_code?: string;
  campaign_access?: string;
  status?: string;
  manager_user_id?: number | null;
  program_ids?: number[];
  xml_job_refs?: string[];
}) {
  return apiFetch<{
    community: PublisherCommunity;
    assigned_program_ids?: number[];
    xml_job_refs?: string[];
  }>("/api/v1/publisher/communities", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  }).then((d) => d.community);
}

export function updatePublisherCommunity(
  id: number,
  body: Partial<{
    name: string;
    category: string;
    categories: string[];
    commission_percent: number;
    description: string;
    country_code: string;
    campaign_access: string;
    status: string;
    manager_user_id: number | null;
  }>,
) {
  return apiFetch<{ community: PublisherCommunity }>(
    `/api/v1/publisher/communities/${id}`,
    {
      method: "PUT",
      auth: true,
      body: JSON.stringify(body),
    },
  ).then((d) => d.community);
}

export function fetchPublisherTeam() {
  return apiFetch<{
    team: PublisherTeamMember[];
    membership_role: string;
    can_invite_managers: boolean;
  }>("/api/v1/publisher/team", { auth: true });
}

export function invitePublisherManager(input: {
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
}) {
  return apiFetch<{
    member: PublisherTeamMember;
    message: string;
  }>("/api/v1/publisher/team/managers", {
    method: "POST",
    auth: true,
    body: JSON.stringify(input),
  });
}

export function fetchPublisherInvitations(communityId?: number | null) {
  const q =
    communityId != null
      ? `?community_id=${encodeURIComponent(String(communityId))}`
      : "";
  return apiFetch<{ invitations: PublisherInvitation[] }>(
    `/api/v1/publisher/invitations${q}`,
    { auth: true },
  ).then((d) => d.invitations);
}

export function createPublisherInvitation(body: {
  community_id: number;
  email?: string;
  channel?: string;
  expires_in_days?: number;
}) {
  return apiFetch<{ invitation: PublisherInvitation; invite_url: string }>(
    "/api/v1/publisher/invitations",
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
    },
  );
}

export function fetchPublisherMembers(communityId?: number | null) {
  const q =
    communityId != null
      ? `?community_id=${encodeURIComponent(String(communityId))}`
      : "";
  return apiFetch<{
    members: NetworkMemberRow[];
    can_view_earnings?: boolean;
  }>(`/api/v1/publisher/members${q}`, { auth: true });
}

export function removePublisherMember(id: number, notes?: string) {
  return apiFetch<{ member: NetworkMemberRow; message: string }>(
    `/api/v1/publisher/members/${id}/remove`,
    {
      method: "POST",
      auth: true,
      body: JSON.stringify({ notes: notes || undefined }),
    },
  );
}

export function releasePublisherMember(
  id: number,
  input?: { notes?: string; settle_pending?: boolean },
) {
  return apiFetch<{
    member: NetworkMemberRow;
    message: string;
    creator_eligible: boolean;
  }>(`/api/v1/publisher/members/${id}/release`, {
    method: "POST",
    auth: true,
    body: JSON.stringify(input ?? {}),
  });
}

export type MarketplaceCampaign = {
  id: number;
  title: string;
  pricing_model: string;
  promotion_type?: string | null;
  /** job = job programs; campaign = course/tool/branding/etc. */
  source_kind?: "job" | "campaign" | string | null;
  rate_usd: string | number;
  budget_total_usd?: string | number;
  status: string;
  employer?: string | null;
  category?: string | null;
  country_code?: string | null;
  listing_title?: string | null;
  destination_url?: string | null;
  already_assigned: boolean;
  assigned_community_ids?: number[];
  assigned_community_count?: number;
};

export type PublisherAssignment = {
  id: number;
  status: string;
  pricing_model?: string | null;
  accepted_rate_usd?: string | number | null;
  rate_version?: number;
  destination_url?: string | null;
  program?: {
    id: number;
    title: string;
    pricing_model?: string;
    status?: string;
  } | null;
  community?: { id: number; code: string; name: string } | null;
};

export function fetchPublisherMarketplace(opts?: {
  type?: "all" | "job" | "campaign";
  community_id?: number | null;
}) {
  const q = new URLSearchParams();
  if (opts?.type && opts.type !== "all") q.set("type", opts.type);
  if (opts?.community_id) q.set("community_id", String(opts.community_id));
  const qs = q.toString();
  return apiFetch<{ campaigns: MarketplaceCampaign[] }>(
    `/api/v1/publisher/marketplace${qs ? `?${qs}` : ""}`,
    { auth: true },
  ).then((d) => d.campaigns);
}

export function fetchPublisherAssignments() {
  return apiFetch<{ assignments: PublisherAssignment[] }>(
    "/api/v1/publisher/assignments",
    { auth: true },
  ).then((d) => d.assignments);
}

export function assignPublisherCampaign(body: {
  program_id: number;
  community_id?: number | null;
  community_ids?: number[];
  notify_members?: boolean;
}) {
  return apiFetch<{
    assignment: PublisherAssignment;
    assignments?: PublisherAssignment[];
    notified_members?: number;
  }>("/api/v1/publisher/assignments", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function pausePublisherAssignment(id: number) {
  return apiFetch<{ assignment: PublisherAssignment }>(
    `/api/v1/publisher/assignments/${id}/pause`,
    { method: "POST", auth: true },
  ).then((d) => d.assignment);
}

export type CsvImportResult = {
  summary: {
    created: number;
    skipped_duplicates: number;
    failed: number;
    rows_processed: number;
  };
  errors: Array<{ row: number; email?: string; error: string }>;
  sample_invites: Array<{ email: string; invite_url: string }>;
};

export async function importPublisherInvitesCsv(input: {
  file: File;
  community_id?: number | null;
  expires_in_days?: number;
}): Promise<CsvImportResult> {
  const { getApiBaseUrl } = await import("@/lib/config");
  const { getAuthToken } = await import("@/lib/auth/session");
  const { ApiClientError } = await import("@/lib/api/client");

  const form = new FormData();
  form.append("file", input.file);
  if (input.community_id) form.append("community_id", String(input.community_id));
  if (input.expires_in_days) {
    form.append("expires_in_days", String(input.expires_in_days));
  }

  const token = getAuthToken();
  const res = await fetch(`${getApiBaseUrl()}/api/v1/publisher/invitations/import-csv`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });

  const json = (await res.json()) as
    | { success: true; data: CsvImportResult }
    | { success: false; error: { code: string; message: string } };

  if (!json.success) {
    throw new ApiClientError(json.error.code, json.error.message, res.status);
  }
  return json.data;
}

export type PublisherReport = {
  summary: {
    communities_total: number;
    communities_active: number;
    members_active: number;
    members_total: number;
    invites_pending: number;
    invites_accepted: number;
    campaigns_assigned_active: number;
    confirmed_actions: number;
    estimated_publisher_revenue_usd: number;
  };
  members_by_status: Record<string, number>;
  invites_by_status: Record<string, number>;
  communities: Array<{
    id: number;
    code: string;
    name: string;
    status: string;
    category?: string | null;
    active_members: number;
    members?: number;
    clicks?: number;
    earnings_usd?: number | null;
  }>;
  assignments: Array<{
    id: number;
    status: string;
    pricing_model?: string | null;
    accepted_rate_usd?: string | number | null;
    program_title?: string | null;
    community_id?: number | null;
    community_name?: string | null;
    clicks?: number;
    members?: number;
    earned_usd?: number | null;
    pending_usd?: number | null;
    earnings_usd?: number | null;
  }>;
  financials_visible?: boolean;
};

export function fetchPublisherReports() {
  return apiFetch<PublisherReport>("/api/v1/publisher/reports", { auth: true });
}

export type PublisherEarnings = {
  balances: {
    pending_usd: number;
    approved_usd: number;
    payable_usd: number;
    paid_usd: number;
    reversed_usd: number;
    lifetime_net_usd: number;
    entry_count: number;
  };
  commission: {
    commission_percent: string | number;
    currency: string;
    version: number;
    status: string;
    effective_from?: string | null;
  } | null;
  platform_fee_percent?: number;
  permitted_percentages?: number[];
  example_split?: {
    campaign_earnings_usd: number;
    platform_fee_percent: number;
    platform_fee_usd: number;
    creator_pool_usd: number;
    publisher_percent: number;
    publisher_usd: number;
    creators_percent_of_pool: number;
    creators_usd: number;
  };
  note: string;
  by_model?: Array<{
    pricing_model: string;
    label: string;
    credited_net_usd: number;
    pending_usd: number;
    assignment_count: number;
  }>;
  by_assignment: Array<{
    assignment_id: number;
    program_title?: string | null;
    community_name?: string | null;
    pricing_model?: string | null;
    accepted_rate_usd?: string | number | null;
    rate_version?: number;
    status: string;
    credited_net_usd: number;
    pending_usd?: number;
    payable_usd?: number;
    paid_usd?: number;
    entries?: PublisherEarningsEntry[];
  }>;
  member_settlements_pending: number;
  recent_entries: PublisherEarningsEntry[];
};

export type PublisherEarningsEntry = {
  id: number;
  entry_type: string;
  source: string;
  state: string;
  gross_usd: string | number;
  platform_fee_usd: string | number;
  net_usd: string | number;
  currency: string;
  reference?: string | null;
  community_name?: string | null;
  campaign_assignment_id?: number | null;
  program_title?: string | null;
  pricing_model?: string | null;
  reverses_ledger_id?: number | null;
  occurred_at?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
};

export function fetchPublisherEarnings() {
  return apiFetch<PublisherEarnings>("/api/v1/publisher/earnings", { auth: true });
}

export type PublisherCommissionConfig = {
  permitted_percentages: number[];
  platform_fee_percent?: number;
  note: string;
  example_split?: {
    campaign_earnings_usd: number;
    platform_fee_percent: number;
    platform_fee_usd: number;
    creator_pool_usd: number;
    publisher_percent: number;
    publisher_usd: number;
    creators_percent_of_pool: number;
    creators_usd: number;
  };
  commission: {
    commission_percent: string | number;
    currency: string;
    version: number;
    status: string;
    effective_from?: string | null;
  } | null;
};

export function fetchPublisherCommission() {
  return apiFetch<PublisherCommissionConfig>("/api/v1/publisher/commission", {
    auth: true,
  });
}

export function updatePublisherCommission(input: {
  commission_percent: number;
  notes?: string;
}) {
  return apiFetch<{
    commission: NonNullable<PublisherCommissionConfig["commission"]>;
    permitted_percentages: number[];
    message: string;
  }>("/api/v1/publisher/commission", {
    method: "PUT",
    auth: true,
    body: JSON.stringify(input),
  });
}

export type MemberActivityRecent = {
  id: number;
  activity_type: string;
  status?: string | null;
  tracking_id?: string | null;
  campaign_assignment_id?: number | null;
  title?: string | null;
  reference_id?: string | null;
  source?: string | null;
  occurred_at?: string | null;
};

export type PublisherMemberDashboard = {
  member: NetworkMemberRow & {
    communities?: Array<{
      id: number;
      code: string;
      name: string;
      status?: string | null;
    }>;
  };
  activity: {
    clicks_total: number;
    clicks_valid: number;
    clicks_duplicate?: number;
    signups: number;
    applications: number;
    leads: number;
    conversions: number;
    actions_approved: number;
    actions_pending: number;
  };
  dashboard?: {
    total_clicks: number;
    valid_clicks: number;
    duplicate_clicks?: number;
    ppr: number;
    applications: number;
    leads: number;
    conversions: number;
    actions_approved: number;
    actions_pending: number;
    total_earning_usd?: number | null;
    settled_usd?: number | null;
    pending_usd?: number | null;
  };
  earnings?: {
    settled_usd: number;
    pending_usd: number;
    total_usd: number;
    currency: string;
  } | null;
  settlements?: Array<{
    id: number;
    status: string;
    amount_usd: number;
    currency?: string;
    period_label?: string | null;
    community_name?: string | null;
    settled_at?: string | null;
    created_at?: string | null;
    notes?: string | null;
  }>;
  by_community?: Array<{
    id: number;
    code: string;
    name: string;
    status?: string | null;
    settled_usd?: number | null;
    pending_usd?: number | null;
    total_usd?: number | null;
  }>;
  recent?: MemberActivityRecent[];
  can_view_earnings?: boolean;
  note: string;
};

export function fetchPublisherMemberActivity(memberId: number) {
  return apiFetch<PublisherMemberDashboard>(
    `/api/v1/publisher/members/${memberId}/activity`,
    { auth: true },
  );
}

export type PublisherPaymentHistory = {
  summary: {
    publisher_paid_credits_usd: number;
    publisher_settlement_debits_usd: number;
    member_settlements_count: number;
    wallet_available_usd?: number;
    member_pending_usd?: number;
  };
  publisher_settlements: Array<{
    id: number;
    kind: string;
    entry_type: string;
    state: string;
    amount_usd: string | number;
    currency: string;
    reference?: string | null;
    community_name?: string | null;
    reverses_ledger_id?: number | null;
    occurred_at?: string | null;
    evidence?: import("@/lib/api/wallet").WalletEvidence;
  }>;
  member_settlements: Array<{
    id: number;
    kind: string;
    status: string;
    amount_usd: string | number;
    currency: string;
    period_label?: string | null;
    member_name?: string | null;
    member_email?: string | null;
    community_name?: string | null;
    settled_at?: string | null;
    created_at?: string | null;
    notes?: string | null;
    evidence?: import("@/lib/api/wallet").WalletEvidence;
    can_release?: boolean;
    wallet_shortfall_usd?: number;
    has_payout_account?: boolean;
    release_block_reason?: string | null;
    payout_account?: import("@/lib/api/wallet").WalletPayoutAccount | null;
  }>;
  note: string;
};

export function fetchPublisherPayments() {
  return apiFetch<PublisherPaymentHistory>("/api/v1/publisher/payments", {
    auth: true,
  });
}

export function fetchPublisherWallet() {
  return apiFetch<import("@/lib/api/wallet").AccountWallet>(
    "/api/v1/publisher/wallet",
    { auth: true },
  );
}

export function releasePublisherSettlement(
  settlementId: number,
  input: {
    evidence: File;
    evidence_note?: string;
    notes?: string;
  },
) {
  const body = new FormData();
  body.append("evidence", input.evidence);
  if (input.evidence_note) body.append("evidence_note", input.evidence_note);
  if (input.notes) body.append("notes", input.notes);
  return apiFetch<{
    id: number;
    status: string;
    amount_usd: number | string;
    settled_at?: string | null;
    evidence?: import("@/lib/api/wallet").WalletEvidence;
    member_name?: string | null;
    community_name?: string | null;
  }>(`/api/v1/publisher/settlements/${settlementId}/release`, {
    method: "POST",
    auth: true,
    body,
  });
}

export function publisherSettlementEvidenceUrl(settlementId: number) {
  return `/api/v1/publisher/settlements/${settlementId}/evidence`;
}

export type PublisherCredential = {
  id: number;
  name: string;
  key_prefix: string;
  webhook_secret_prefix?: string | null;
  outbound_webhook_url?: string | null;
  is_active: boolean;
  last_used_at?: string | null;
  revoked_at?: string | null;
  created_at?: string | null;
};

export type PublisherIntegrations = {
  integration_preference: string;
  modes: string[];
  inbound_webhook_url: string;
  xml_feed_hint: string;
  credentials: PublisherCredential[];
  webhook_events: Array<{
    id: number;
    direction: string;
    event_type: string;
    external_event_id?: string | null;
    status: string;
    http_status?: number | null;
    error_message?: string | null;
    processed_at?: string | null;
    created_at?: string | null;
  }>;
  note: string;
};

export function fetchPublisherIntegrations() {
  return apiFetch<PublisherIntegrations>("/api/v1/publisher/integrations", {
    auth: true,
  });
}

export function updatePublisherIntegrationPreference(
  integration_preference: string,
) {
  return apiFetch<{ integration_preference: string }>(
    "/api/v1/publisher/integrations/preference",
    {
      method: "PUT",
      auth: true,
      body: JSON.stringify({ integration_preference }),
    },
  );
}

export function createPublisherCredential(input: {
  name?: string;
  outbound_webhook_url?: string | null;
}) {
  return apiFetch<{
    credential: PublisherCredential;
    secrets: { api_key: string; webhook_secret: string };
    warning: string;
  }>("/api/v1/publisher/integrations/credentials", {
    method: "POST",
    auth: true,
    body: JSON.stringify(input),
  });
}

export function rotatePublisherCredential(id: number) {
  return apiFetch<{
    credential: PublisherCredential;
    secrets: { api_key: string; webhook_secret: string };
    warning: string;
  }>(`/api/v1/publisher/integrations/credentials/${id}/rotate`, {
    method: "POST",
    auth: true,
  });
}

export function updatePublisherCredential(
  id: number,
  input: { name?: string; outbound_webhook_url?: string | null },
) {
  return apiFetch<{ credential: PublisherCredential }>(
    `/api/v1/publisher/integrations/credentials/${id}`,
    {
      method: "PUT",
      auth: true,
      body: JSON.stringify(input),
    },
  );
}

export function revokePublisherCredential(id: number) {
  return apiFetch<{ credential: PublisherCredential }>(
    `/api/v1/publisher/integrations/credentials/${id}/revoke`,
    { method: "POST", auth: true },
  );
}

export function createPublisherMemberInvite(input: {
  email: string;
  community_id?: number | null;
  expires_in_days?: number;
}) {
  return apiFetch<{
    invitation: {
      id: number;
      email: string;
      channel: string;
      status: string;
      expires_at?: string | null;
      path: string;
    };
    invite_url: string;
  }>("/api/v1/publisher/integrations/members", {
    method: "POST",
    auth: true,
    body: JSON.stringify(input),
  });
}

export type PublisherNotificationPrefs = {
  email_invites: boolean;
  email_campaigns: boolean;
  email_settlements: boolean;
  email_security: boolean;
};

export type PublisherSettings = {
  user: { id: number; name: string; email: string };
  membership: { role: string };
  publisher: {
    id: number;
    code: string;
    username: string;
    display_name: string;
    country_code: string;
    network_type: string;
    social_url: string;
    website_url: string;
    integration_preference: string;
    niche_ids: number[];
    job_preferences: string[];
    notification_preferences: PublisherNotificationPrefs;
    status: string;
    status_label: string;
    is_activated: boolean;
  };
  sessions: Array<{
    id: number;
    name: string;
    last_used_at?: string | null;
    created_at?: string | null;
    is_current: boolean;
  }>;
};

export function fetchPublisherSettings() {
  return apiFetch<PublisherSettings>("/api/v1/publisher/settings", { auth: true });
}

export function updatePublisherProfile(input: {
  full_name?: string;
  country_code?: string;
  network_type?: string;
  social_url?: string;
  website_url?: string;
  niche_ids?: number[];
  job_preferences?: string[];
  notification_preferences?: Partial<PublisherNotificationPrefs>;
}) {
  return apiFetch<{
    publisher: PublisherSettings["publisher"];
    user: PublisherSettings["user"];
    message: string;
  }>("/api/v1/publisher/settings/profile", {
    method: "PUT",
    auth: true,
    body: JSON.stringify(input),
  });
}

export function updatePublisherPassword(input: {
  current_password: string;
  password: string;
  password_confirmation: string;
}) {
  return apiFetch<{ message: string }>("/api/v1/publisher/settings/password", {
    method: "PUT",
    auth: true,
    body: JSON.stringify(input),
  });
}

export function revokePublisherOtherSessions() {
  return apiFetch<{
    revoked: number;
    sessions: PublisherSettings["sessions"];
    message: string;
  }>("/api/v1/publisher/settings/sessions/revoke-others", {
    method: "POST",
    auth: true,
  });
}
