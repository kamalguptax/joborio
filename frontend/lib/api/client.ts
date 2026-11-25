import { getApiBaseUrl } from "@/lib/config";
import type { ApiSuccess } from "@/lib/api/types";
import { getAuthToken } from "@/lib/auth/session";

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
  }
}

type LooseApiBody = {
  success?: boolean;
  data?: unknown;
  meta?: Record<string, unknown>;
  error?: { code?: string; message?: string; details?: unknown };
  message?: string;
  errors?: Record<string, string[] | string>;
};

function firstValidationMessage(
  errors: Record<string, string[] | string> | undefined,
): string | null {
  if (!errors || typeof errors !== "object") return null;
  for (const value of Object.values(errors)) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (Array.isArray(value)) {
      const first = value.find((v) => typeof v === "string" && v.trim());
      if (typeof first === "string") return first.trim();
    }
  }
  return null;
}

function friendlyApiMessage(raw: string, details?: unknown): string {
  const text = raw.trim();
  const fromDetails = firstValidationMessage(
    details && typeof details === "object"
      ? (details as Record<string, string[] | string>)
      : undefined,
  );
  const message = fromDetails || text;

  if (/already been taken|has already been taken|email.*unique/i.test(message)) {
    return "This email is already registered. Sign in or use a different email.";
  }
  if (/username.*taken|handle.*taken/i.test(message)) {
    return message;
  }
  return message || "Something went wrong. Please try again.";
}

function throwFromBody(json: LooseApiBody, status: number): never {
  if (json.error?.message || json.error?.code) {
    throw new ApiClientError(
      json.error.code || "API_ERROR",
      friendlyApiMessage(String(json.error.message ?? "Request failed."), json.error.details),
      status,
      json.error.details,
    );
  }

  const laravelField = firstValidationMessage(json.errors);
  if (laravelField || typeof json.message === "string") {
    throw new ApiClientError(
      "VALIDATION_ERROR",
      friendlyApiMessage(laravelField || String(json.message), json.errors),
      status,
      json.errors,
    );
  }

  throw new ApiClientError(
    "API_ERROR",
    `Request failed (${status || "network"}). Please try again.`,
    status,
  );
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = false, headers, ...rest } = options;
  const token = auth ? getAuthToken() : null;
  const isFormData =
    typeof FormData !== "undefined" && rest.body instanceof FormData;

  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}${path}`, {
      ...rest,
      headers: {
        Accept: "application/json",
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiClientError(
      "NETWORK_ERROR",
      `Cannot reach API at ${getApiBaseUrl()}. Check backend URL and CORS.`,
      0,
    );
  }

  let json: LooseApiBody;
  try {
    json = (await res.json()) as LooseApiBody;
  } catch {
    throw new ApiClientError(
      "INVALID_RESPONSE",
      `API returned non-JSON (${res.status}). Check ${getApiBaseUrl()}${path}`,
      res.status,
    );
  }

  if (!json.success) {
    throwFromBody(json, res.status);
  }

  return (json as ApiSuccess<T>).data;
}

export async function apiFetchWithMeta<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<{ data: T; meta: Record<string, unknown> }> {
  const { auth = false, headers, ...rest } = options;
  const token = auth ? getAuthToken() : null;

  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}${path}`, {
      ...rest,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiClientError(
      "NETWORK_ERROR",
      `Cannot reach API at ${getApiBaseUrl()}. Check backend URL and CORS.`,
      0,
    );
  }

  let json: LooseApiBody;
  try {
    json = (await res.json()) as LooseApiBody;
  } catch {
    throw new ApiClientError(
      "INVALID_RESPONSE",
      `API returned non-JSON (${res.status}). Check ${getApiBaseUrl()}${path}`,
      res.status,
    );
  }

  if (!json.success) {
    throwFromBody(json, res.status);
  }

  return {
    data: (json as ApiSuccess<T>).data,
    meta: json.meta ?? {},
  };
}
