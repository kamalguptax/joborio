import { apiFetchWithMeta } from "@/lib/api/client";
import type { Listing } from "@/lib/api/types";

export async function fetchListings(params?: {
  search?: string;
  page?: number;
  per_page?: number;
  type?: string;
  category?: string;
  country_code?: string;
}) {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  if (params?.per_page) q.set("per_page", String(params.per_page));
  if (params?.type) q.set("type", params.type);
  if (params?.category) q.set("category", params.category);
  if (params?.country_code) q.set("country_code", params.country_code);

  const query = q.toString();
  return apiFetchWithMeta<Listing[]>(
    `/api/v1/listings${query ? `?${query}` : ""}`,
  );
}

export async function fetchListing(id: number) {
  const { data } = await apiFetchWithMeta<Listing>(`/api/v1/listings/${id}`);
  return data;
}
