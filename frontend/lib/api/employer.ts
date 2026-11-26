import { apiFetch, apiFetchWithMeta } from "@/lib/api/client";

export function registerEmployer(body: {
  company_name: string;
  website?: string;
  country_code?: string;
}) {
  return apiFetch<{ employer: Record<string, unknown> }>(
    "/api/v1/employer/onboarding",
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
    },
  );
}

export function fetchEmployerMe() {
  return apiFetch<{
    employer: Record<string, unknown>;
    can_go_live?: boolean;
    billing_missing?: string[];
  }>("/api/v1/employer/me", {
    auth: true,
  });
}

export type EmployerBillingPayload = {
  company_name?: string;
  website?: string;
  country_code?: string;
  business_email: string;
  phone?: string;
  primary_contact?: string;
  gst_number: string;
  billing_address: string;
  payment_method?: "upi" | "bank" | "card" | "invoice";
  payment_upi_id?: string;
  payment_account_name?: string;
  payment_bank_name?: string;
  payment_account_number?: string;
  payment_ifsc?: string;
};

export type RazorpayConfig = {
  enabled: boolean;
  key_id: string | null;
  usd_inr_rate: number;
  mode: "test" | "live" | string;
  currency?: string;
};

export function fetchEmployerBilling() {
  return apiFetch<{
    employer: Record<string, unknown>;
    can_go_live: boolean;
    missing: string[];
    missing_labels?: string[];
    prepaid_balance_usd: number;
    razorpay: RazorpayConfig;
  }>("/api/v1/employer/billing", { auth: true });
}

export function fetchRazorpayConfig() {
  return apiFetch<RazorpayConfig>("/api/v1/employer/payments/razorpay/config", {
    auth: true,
  });
}

export type RazorpayOrderResponse = {
  key_id: string;
  order_id: string;
  amount_paise: number;
  amount_usd: number;
  currency: string;
  fx_rate: number;
  purpose: "wallet" | "program_budget" | string;
  program_id: number | null;
  name: string;
  description: string;
  prefill: { email?: string; name?: string };
};

export function createRazorpayOrder(body: {
  amount_usd: number;
  purpose?: "wallet" | "program_budget";
  program_id?: number;
}) {
  return apiFetch<RazorpayOrderResponse>(
    "/api/v1/employer/payments/razorpay/order",
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
    },
  );
}

export function verifyRazorpayPayment(body: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  return apiFetch<{
    order: Record<string, unknown>;
    prepaid_balance_usd: number;
    message: string;
  }>("/api/v1/employer/payments/razorpay/verify", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function fetchEmployerPaymentHistory() {
  return apiFetch<{
    orders: Array<Record<string, unknown>>;
    prepaid_balance_usd: number;
  }>("/api/v1/employer/payments/history", { auth: true });
}

export function saveEmployerBilling(body: EmployerBillingPayload) {
  return apiFetch<{
    employer: Record<string, unknown>;
    can_go_live: boolean;
    missing: string[];
    missing_labels?: string[];
  }>("/api/v1/employer/billing", {
    method: "PUT",
    auth: true,
    body: JSON.stringify(body),
  });
}

export type EmployerJobPreferences = {
  niche_ids: number[];
  countries: string[];
  remote_only: boolean;
  job_types?: string[];
};

export function fetchEmployerJobPreferences() {
  return apiFetch<EmployerJobPreferences>("/api/v1/employer/job-preferences", {
    auth: true,
  });
}

export function updateEmployerJobPreferences(body: EmployerJobPreferences) {
  return apiFetch<EmployerJobPreferences>("/api/v1/employer/job-preferences", {
    method: "PUT",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function fetchEmployerPreferredJobs() {
  return apiFetch<Array<Record<string, unknown>>>(
    "/api/v1/employer/preferred-jobs",
    { auth: true },
  );
}

export function fetchEmployerPrograms() {
  return apiFetch<Array<Record<string, unknown>>>("/api/v1/employer/programs", {
    auth: true,
  });
}

export function fetchEmployerProgramStats(programId: number) {
  return apiFetch<Record<string, unknown>>(
    `/api/v1/employer/programs/${programId}`,
    { auth: true },
  );
}

export function pauseEmployerProgram(programId: number) {
  return apiFetch<{ program: Record<string, unknown> }>(
    `/api/v1/employer/programs/${programId}/pause`,
    { method: "POST", auth: true },
  );
}

export function resumeEmployerProgram(programId: number) {
  return apiFetch<{ program: Record<string, unknown> }>(
    `/api/v1/employer/programs/${programId}/resume`,
    { method: "POST", auth: true },
  );
}

export function goLiveEmployerProgram(programId: number) {
  return apiFetch<{ program: Record<string, unknown> }>(
    `/api/v1/employer/programs/${programId}/go-live`,
    { method: "POST", auth: true },
  );
}

export function syncEmployerProgramAds(
  programId: number,
  platforms?: Array<"meta" | "linkedin">,
) {
  return apiFetch<{
    ad_syncs: Array<Record<string, unknown>>;
    message?: string;
  }>(`/api/v1/employer/programs/${programId}/sync-ads`, {
    method: "POST",
    auth: true,
    body: JSON.stringify(platforms ? { platforms } : {}),
  });
}

export function createEmployerProgram(body: {
  title: string;
  description?: string;
  destination_url: string;
  pricing_model: "ppc" | "ppr" | "ppa" | "ppe";
  promotion_type?: "job" | "course" | "tool" | "branding" | "post_promote" | "other";
  rate_usd: number;
  budget_total_usd: number;
  daily_budget_usd?: number;
  currency?: string;
  brand_category?: string;
  category?: string;
  conversion_model_code?: string;
  wizard_payload?: Record<string, unknown>;
  as_draft?: boolean;
  trial_without_ip?: boolean;
  target_niche_ids?: number[];
  target_countries?: string[];
  min_trust_tier?: string;
  country_code?: string;
  is_remote?: boolean;
  auto_ads_platforms?: Array<"meta" | "linkedin">;
  post_url?: string;
  engagement_actions?: Array<"like" | "comment" | "repost">;
  engage_brief?: string;
  lead_type?: string;
  required_fields?: string[];
  qualification_rules?: string;
  starts_at?: string;
  ends_at?: string;
}) {
  return apiFetch<{
    program: Record<string, unknown>;
    went_live?: boolean;
    can_go_live?: boolean;
    billing_missing?: string[];
    billing_missing_labels?: string[];
    message?: string;
  }>("/api/v1/employer/programs", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function updateEmployerProgram(
  programId: number,
  body: Partial<{
    title: string;
    description: string;
    destination_url: string;
    pricing_model: "ppc" | "ppr" | "ppa" | "ppe";
    promotion_type: "job" | "course" | "tool" | "branding" | "post_promote" | "other";
    rate_usd: number;
    budget_total_usd: number;
    trial_without_ip: boolean;
    target_niche_ids: number[];
    target_countries: string[];
    min_trust_tier: string;
    auto_ads_platforms: Array<"meta" | "linkedin">;
    post_url: string;
    engagement_actions: Array<"like" | "comment" | "repost">;
    engage_brief: string;
    starts_at: string;
    ends_at: string;
  }>,
) {
  return apiFetch<{ program: Record<string, unknown> }>(
    `/api/v1/employer/programs/${programId}`,
    {
      method: "PUT",
      auth: true,
      body: JSON.stringify(body),
    },
  );
}

export function fetchProgramApplications(programId: number, page = 1) {
  return apiFetchWithMeta<Array<Record<string, unknown>>>(
    `/api/v1/employer/programs/${programId}/applications?page=${page}`,
    { auth: true },
  );
}

export function confirmPpaApplication(programId: number, applicationId: number) {
  return apiFetch<{ application: Record<string, unknown> }>(
    `/api/v1/employer/programs/${programId}/applications/${applicationId}/confirm`,
    { method: "POST", auth: true },
  );
}

export function rejectPpaApplication(programId: number, applicationId: number) {
  return apiFetch<{ application: Record<string, unknown> }>(
    `/api/v1/employer/programs/${programId}/applications/${applicationId}/reject`,
    { method: "POST", auth: true },
  );
}

export function disputePpaApplication(
  programId: number,
  applicationId: number,
  reason: string,
) {
  return apiFetch<{ dispute: Record<string, unknown> }>(
    `/api/v1/employer/programs/${programId}/applications/${applicationId}/dispute`,
    {
      method: "POST",
      auth: true,
      body: JSON.stringify({ reason }),
    },
  );
}

export type PostPromoteSubmissionRow = {
  id: number;
  status: string;
  actions_done?: string[];
  proof_url?: string | null;
  proof_note?: string | null;
  review_note?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  creator?: { id: number; handle?: string };
};

export function fetchPostPromoteSubmissions(programId: number) {
  return apiFetch<{ submissions: PostPromoteSubmissionRow[] }>(
    `/api/v1/employer/programs/${programId}/post-promote`,
    { auth: true },
  ).then((d) => d.submissions);
}

export function approvePostPromoteSubmission(
  programId: number,
  submissionId: number,
  reviewNote?: string,
) {
  return apiFetch<{ submission: PostPromoteSubmissionRow }>(
    `/api/v1/employer/programs/${programId}/post-promote/${submissionId}/approve`,
    {
      method: "POST",
      auth: true,
      body: JSON.stringify({ review_note: reviewNote }),
    },
  );
}

export function rejectPostPromoteSubmission(
  programId: number,
  submissionId: number,
  reviewNote?: string,
) {
  return apiFetch<{ submission: PostPromoteSubmissionRow }>(
    `/api/v1/employer/programs/${programId}/post-promote/${submissionId}/reject`,
    {
      method: "POST",
      auth: true,
      body: JSON.stringify({ review_note: reviewNote }),
    },
  );
}

/* —— Brand portal modules —— */

export function fetchEmployerWallet() {
  return apiFetch<{
    tiles: Array<{ l: string; v: number; n: string }>;
    expenditure: Array<{
      id: number;
      name: string;
      budget: number;
      spent: number;
      pending: number;
      status: string;
    }>;
    ledger: Array<{
      id: string;
      date: string | null;
      type: string;
      campaign: string;
      debit: number | null;
      credit: number | null;
      status?: string;
    }>;
    prepaid_balance_usd: number;
    can_go_live: boolean;
    missing_labels: string[];
  }>("/api/v1/employer/wallet", { auth: true });
}

export function fetchEmployerLeads(params?: { status?: string; q?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.q) qs.set("q", params.q);
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiFetch<{
    stats: Array<{ l: string; v: number }>;
    leads: Array<Record<string, unknown>>;
  }>(`/api/v1/employer/leads${suffix}`, { auth: true });
}

export function disputeEmployerLead(applicationId: number, reason: string) {
  return apiFetch<{ dispute: Record<string, unknown> }>(
    `/api/v1/employer/leads/${applicationId}/dispute`,
    {
      method: "POST",
      auth: true,
      body: JSON.stringify({ reason }),
    },
  );
}

export function fetchEmployerComplaints() {
  return apiFetch<{
    stats: Array<{ l: string; v: number }>;
    complaints: Array<Record<string, unknown>>;
  }>("/api/v1/employer/complaints", { auth: true });
}

export function createEmployerComplaint(body: {
  campaign_id: number;
  campaign_ref?: string;
  platform: string;
  post_url: string;
  category: string;
  urgency?: string;
  description: string;
  additional_urls?: string;
  evidence?: string[];
  seen_on: string;
}) {
  return apiFetch<{ complaint: Record<string, unknown> }>(
    "/api/v1/employer/complaints",
    { method: "POST", auth: true, body: JSON.stringify(body) },
  );
}

export function fetchEmployerTeam() {
  return apiFetch<{
    members: Array<{
      id: number;
      name: string;
      email: string;
      role: string;
      status: string;
      can_remove: boolean;
    }>;
    roles: string[];
    permission_matrix: string[][];
  }>("/api/v1/employer/team", { auth: true });
}

export function inviteEmployerTeamMember(body: {
  email: string;
  name?: string;
  role: string;
}) {
  return apiFetch<{ member: Record<string, unknown> }>(
    "/api/v1/employer/team",
    { method: "POST", auth: true, body: JSON.stringify(body) },
  );
}

export function updateEmployerTeamMember(memberId: number, role: string) {
  return apiFetch<{ member: Record<string, unknown> }>(
    `/api/v1/employer/team/${memberId}`,
    { method: "PUT", auth: true, body: JSON.stringify({ role }) },
  );
}

export function removeEmployerTeamMember(memberId: number) {
  return apiFetch<{ deleted: boolean }>(
    `/api/v1/employer/team/${memberId}`,
    { method: "DELETE", auth: true },
  );
}

export function fetchEmployerAssets() {
  return apiFetch<{
    assets: Array<{
      id: number;
      x: string;
      ver: string;
      st: string;
      asset_type: string;
    }>;
  }>("/api/v1/employer/assets", { auth: true });
}

export function createEmployerAsset(body: {
  file_name: string;
  asset_type:
    | "logo"
    | "banner"
    | "promotional_image"
    | "brand_guideline"
    | "other";
  program_id?: number;
}) {
  return apiFetch<{ asset: Record<string, unknown> }>(
    "/api/v1/employer/assets",
    { method: "POST", auth: true, body: JSON.stringify(body) },
  );
}

export function fetchEmployerSupportTickets() {
  return apiFetch<{
    tickets: Array<{
      id: string;
      numeric_id: number;
      subj: string;
      cat: string;
      pri: string;
      status: string;
      description: string;
      timeline: Array<{ text: string; at: string; actor?: string }>;
    }>;
  }>("/api/v1/employer/support/tickets", { auth: true });
}

export function createEmployerSupportTicket(body: {
  subject: string;
  category: string;
  priority: string;
  description: string;
}) {
  return apiFetch<{
    ticket: {
      id: string;
      numeric_id: number;
      subj: string;
      cat: string;
      pri: string;
      status: string;
      description: string;
      timeline: Array<{ text: string; at: string; actor?: string }>;
    };
  }>("/api/v1/employer/support/tickets", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export function fetchEmployerTracking() {
  return apiFetch<{
    diagnostics: Array<{ k: string; v: string }>;
    keys: Array<{
      id: number;
      mask: string;
      created: string;
      status: string;
      can_revoke: boolean;
    }>;
    programs: Array<{
      id: number;
      code: string;
      title: string;
      status: string;
    }>;
  }>("/api/v1/employer/tracking", { auth: true });
}

export function generateEmployerTrackingLink(body: {
  program_id: number;
  destination_url?: string;
  sub1?: string;
  sub2?: string;
}) {
  return apiFetch<{ link: string; program_id: number }>(
    "/api/v1/employer/tracking/link",
    { method: "POST", auth: true, body: JSON.stringify(body) },
  );
}

export function sendEmployerTrackingTest(programId?: number) {
  return apiFetch<{
    ok: boolean;
    message: string;
    event_id: string;
    received_at: string;
  }>("/api/v1/employer/tracking/test", {
    method: "POST",
    auth: true,
    body: JSON.stringify(programId ? { program_id: programId } : {}),
  });
}

export function createEmployerApiKey(name?: string) {
  return apiFetch<{
    key: Record<string, unknown>;
    secret: string;
    message: string;
  }>("/api/v1/employer/tracking/keys", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ name }),
  });
}

export function revokeEmployerApiKey(keyId: number) {
  return apiFetch<{ revoked: boolean }>(
    `/api/v1/employer/tracking/keys/${keyId}/revoke`,
    { method: "POST", auth: true },
  );
}

export function fetchEmployerNotificationPreferences() {
  return apiFetch<{
    preferences: Array<{
      l: string;
      sev: string;
      in_app: boolean;
      email: boolean;
      critical?: boolean;
    }>;
  }>("/api/v1/employer/notification-preferences", { auth: true });
}

export function saveEmployerNotificationPreferences(
  preferences: Array<{
    l: string;
    sev: string;
    in_app: boolean;
    email: boolean;
    critical?: boolean;
  }>,
) {
  return apiFetch<{ preferences: Array<Record<string, unknown>> }>(
    "/api/v1/employer/notification-preferences",
    {
      method: "PUT",
      auth: true,
      body: JSON.stringify({ preferences }),
    },
  );
}

export function fetchEmployerSettings() {
  return apiFetch<{
    settings: {
      twofa: boolean;
      session_timeout: boolean;
      allow_data_export: boolean;
      recent_logins: Array<{ text: string }>;
    };
  }>("/api/v1/employer/settings", { auth: true });
}

export function saveEmployerSettings(body: {
  twofa?: boolean;
  session_timeout?: boolean;
  allow_data_export?: boolean;
}) {
  return apiFetch<{ settings: Record<string, unknown> }>(
    "/api/v1/employer/settings",
    { method: "PUT", auth: true, body: JSON.stringify(body) },
  );
}
