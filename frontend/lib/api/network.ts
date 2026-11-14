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

export type NetworkDashboard = {
  member: {
    name: string;
    status: string;
    status_code?: string;
    joined_at?: string | null;
    left_at?: string | null;
    released_at?: string | null;
  };
  publisher: {
    name?: string | null;
    code?: string | null;
  };
  communities: Array<{
    code?: string | null;
    name?: string | null;
    status?: string | null;
  }>;
  activity: {
    clicks_total: number;
    clicks_valid: number;
    signups: number;
    applications: number;
    leads: number;
    conversions: number;
    actions_approved: number;
    actions_pending: number;
  };
  assigned_campaigns: Array<{
    name?: string;
    status?: string;
  }>;
  lifecycle?: {
    can_leave: boolean;
    creator_eligible: boolean;
    message?: string | null;
  };
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
