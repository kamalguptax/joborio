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
  gst_number: string;
  billing_address: string;
  payment_method: "upi" | "bank" | "card" | "invoice";
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
  trial_without_ip?: boolean;
  target_niche_ids?: number[];
  target_countries?: string[];
  min_trust_tier?: string;
  auto_ads_platforms?: Array<"meta" | "linkedin">;
  post_url?: string;
  engagement_actions?: Array<"like" | "comment" | "repost">;
  engage_brief?: string;
}) {
  return apiFetch<{
    program: Record<string, unknown>;
    went_live?: boolean;
    can_go_live?: boolean;
    billing_missing?: string[];
    message?: string;
  }>("/api/v1/employer/programs", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
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
