import { getApiBaseUrl } from "@/lib/config";
import type { ApiError, ApiSuccess } from "@/lib/api/types";
import { getAuthToken } from "@/lib/auth/session";

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
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

  let json: ApiSuccess<T> | ApiError;
  try {
    json = (await res.json()) as ApiSuccess<T> | ApiError;
  } catch {
    throw new ApiClientError(
      "INVALID_RESPONSE",
      `API returned non-JSON (${res.status}). Check ${getApiBaseUrl()}${path}`,
      res.status,
    );
  }

  if (!json.success) {
    throw new ApiClientError(
      json.error.code,
      json.error.message,
      res.status,
    );
  }

  return json.data;
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

  let json: ApiSuccess<T> | ApiError;
  try {
    json = (await res.json()) as ApiSuccess<T> | ApiError;
  } catch {
    throw new ApiClientError(
      "INVALID_RESPONSE",
      `API returned non-JSON (${res.status}). Check ${getApiBaseUrl()}${path}`,
      res.status,
    );
  }

  if (!json.success) {
    throw new ApiClientError(
      json.error.code,
      json.error.message,
      res.status,
    );
  }

  return { data: json.data, meta: json.meta ?? {} };
}
