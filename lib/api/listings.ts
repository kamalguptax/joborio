import { apiFetchWithMeta } from "@/lib/api/client";
import type { Listing } from "@/lib/api/types";

export async function fetchListings(params?: {
  search?: string;
  page?: number;
  per_page?: number;
}) {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  if (params?.per_page) q.set("per_page", String(params.per_page));

  const query = q.toString();
  return apiFetchWithMeta<Listing[]>(
    `/api/v1/listings${query ? `?${query}` : ""}`,
  );
}

export async function fetchListing(id: number) {
  const { data } = await apiFetchWithMeta<Listing>(`/api/v1/listings/${id}`);
  return data;
}
