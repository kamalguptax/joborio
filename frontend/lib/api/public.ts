import { apiFetch } from "@/lib/api/client";

export function healthCheck() {
  return apiFetch<{ ok: boolean; service: string }>("/api/v1/health");
}

export type OAuthProvider = {
  id: string;
  redirect_url: string;
};

export function fetchAuthProviders() {
  return apiFetch<{ providers: OAuthProvider[] }>("/api/v1/auth/providers");
}

export function logout() {
  return apiFetch<{ message: string }>("/api/v1/auth/logout", {
    method: "POST",
    auth: true,
  });
}

export function verifyPprRegistration(id: number, token: string) {
  return apiFetch<Record<string, unknown>>(
    `/api/v1/ppr/verify/${id}?token=${encodeURIComponent(token)}`,
  );
}

export type FeedbackType = "suggestion" | "bug" | "compliment" | "other";

export type FeedbackPayload = {
  type: FeedbackType;
  rating?: number | null;
  message: string;
  name?: string;
  email?: string;
  page_url?: string;
  /** Honeypot — must stay empty. */
  website?: string;
};

export function submitFeedback(payload: FeedbackPayload) {
  return apiFetch<{ received: boolean }>("/api/v1/feedback", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export function sendChatMessage(messages: ChatMessage[]) {
  return apiFetch<{ reply: string; source: "ai" | "kb" }>("/api/v1/chatbot/message", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });
}
