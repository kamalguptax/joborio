import { apiFetch } from "@/lib/api/client";
import { getApiBaseUrl } from "@/lib/config";
import type { Listing } from "@/lib/api/types";

export type MapsConfig = {
  enabled: boolean;
  browser_api_key?: string;
  geolocation_tracking: boolean;
  server_geocoding: boolean;
};

export function fetchMapsConfig() {
  return apiFetch<MapsConfig>("/api/v1/maps/config");
}

export type ListingMapPoint = Pick<
  Listing,
  "id" | "title" | "company_name" | "location_label" | "country_code" | "is_remote"
> & {
  latitude: string | number;
  longitude: string | number;
};

export async function fetchListingMapPoints(params?: {
  country_code?: string;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.country_code) q.set("country_code", params.country_code);
  if (params?.limit) q.set("limit", String(params.limit));
  const query = q.toString();
  const base = getApiBaseUrl();
  const res = await fetch(
    `${base}/api/v1/listings/map-points${query ? `?${query}` : ""}`,
    { headers: { Accept: "application/json" } },
  );
  const json = await res.json();
  if (!json.success) {
    throw new Error("Could not load map points");
  }
  return json.data as ListingMapPoint[];
}

export type TrafficMapResponse = {
  days: number;
  click_markers: Array<{
    lat: number;
    lng: number;
    count: number;
    source?: string;
    country_code?: string;
  }>;
  website_markers: Array<{
    lat: number;
    lng: number;
    count: number;
    source?: string;
  }>;
};

export function adminTrafficMap(days = 30) {
  return apiFetch<TrafficMapResponse>(
    `/api/v1/admin/geo/traffic-map?days=${days}`,
    { auth: true },
  );
}
