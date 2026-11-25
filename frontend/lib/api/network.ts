import { apiFetch } from "@/lib/api/client";
import type { User } from "@/lib/api/types";

export type JoinInvitation = {
  token: string;
  channel: string;
  email?: string | null;
  expires_at?: string | null;
  publisher: {
    code?: string | null;
    name?: string | null;
    username?: string | null;
  };
  community?: { code?: string | null; name?: string | null } | null;
};

export type NetworkActivitySummary = {
  clicks_total: number;
  clicks_valid: number;
  signups: number;
  applications: number;
  leads: number;
  conversions: number;
  actions_approved: number;
  actions_pending: number;
};

export type NetworkActivityEvent = {
  id: number;
  activity_type: string;
  status?: string | null;
  title?: string | null;
  reference_id?: string | null;
  occurred_at?: string | null;
};

export type NetworkCommunityRow = {
  id?: number | null;
  code?: string | null;
  name?: string | null;
  status?: string | null;
  joined_at?: string | null;
  clicks_total?: number;
  ppr?: number;
  earning?: {
    settled_usd: number;
    pending_usd: number;
    total_usd: number;
    currency: string;
  };
  campaigns?: Array<{
    name?: string | null;
    status?: string | null;
    scope?: string | null;
  }>;
};

export type NetworkDashboard = {
  member: {
    name: string;
    status: string;
    status_code?: string;
    public_code?: string | null;
    joined_at?: string | null;
    left_at?: string | null;
    released_at?: string | null;
  };
  publisher: {
    name?: string | null;
    code?: string | null;
  };
  communities: NetworkCommunityRow[];
  earning_total?: {
    settled_usd: number;
    pending_usd: number;
    total_usd: number;
    currency: string;
  };
  activity: NetworkActivitySummary;
  recent_activity?: NetworkActivityEvent[];
  assigned_campaigns: Array<{
    name?: string;
    status?: string;
    community_id?: number | null;
    community_name?: string | null;
  }>;
  lifecycle?: {
    can_leave: boolean;
    creator_eligible: boolean;
    message?: string | null;
  };
};

export type NetworkOpportunityCampaign = {
  assignment_id: number;
  program_id: number;
  title: string;
  status?: string | null;
  pricing_model?: string | null;
  promotion_type?: string | null;
  company?: string | null;
  location?: string | null;
  destination_url?: string | null;
  reference_id: string;
  share_code: string;
  can_share: boolean;
};

export type NetworkOpportunities = {
  member: {
    name: string;
    public_code: string;
  };
  campaigns: NetworkOpportunityCampaign[];
  xml_job_refs: string[];
  note?: string;
};

export function fetchJoinInvitation(token: string) {
  const params = new URLSearchParams({ token });
  return apiFetch<{ invitation: JoinInvitation }>(
    `/api/v1/join/invitation?${params.toString()}`,
  ).then((d) => d.invitation);
}

export function acceptJoinInvitation(input: {
  token: string;
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
  captcha_id?: string;
  captcha_answer?: string;
}) {
  return apiFetch<{
    message: string;
    token: string;
    user: User;
    member: {
      id: number;
      status: string;
      publisher: { code?: string | null; name?: string | null };
      communities?: Array<{
        id: number;
        code?: string | null;
        name?: string | null;
        status?: string | null;
        joined_at?: string | null;
      }>;
    };
    join?: {
      added_community: boolean;
      already_in_community: boolean;
      is_returning_member: boolean;
      communities_count: number;
      community?: { code?: string | null; name?: string | null } | null;
    };
    redirect: string;
  }>("/api/v1/join/invitation/accept", {
    method: "POST",
    auth: Boolean(
      typeof window !== "undefined" &&
        localStorage.getItem("joborio_auth_token"),
    ),
    body: JSON.stringify(input),
  });
}

export function fetchNetworkDashboard() {
  return apiFetch<NetworkDashboard>("/api/v1/network/dashboard", {
    auth: true,
  });
}

export function fetchNetworkWallet() {
  return apiFetch<import("@/lib/api/wallet").AccountWallet>(
    "/api/v1/network/wallet",
    { auth: true },
  );
}

export function fetchNetworkOpportunities() {
  return apiFetch<NetworkOpportunities>("/api/v1/network/opportunities", {
    auth: true,
  });
}

export function leaveNetworkMembership(notes?: string) {
  return apiFetch<{
    member: {
      id: number;
      status: string;
      left_at?: string | null;
      released_at?: string | null;
      publisher?: { name?: string | null; code?: string | null };
    };
    message: string;
    creator_eligible: boolean;
  }>("/api/v1/network/membership/leave", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ notes: notes || undefined }),
  });
}
