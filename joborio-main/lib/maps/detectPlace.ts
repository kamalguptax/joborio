import { getApiBaseUrl } from "@/lib/config";
import { fetchMapsConfig } from "@/lib/api/maps";
import { loadGoogleMaps, resolveGoogleMapsApiKey } from "@/lib/maps/googleMaps";

export type DetectedPlace = {
  label: string;
  countryCode?: string;
};

function browserCoords(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 },
    );
  });
}

async function googleIpCoords(key: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(
    `https://www.googleapis.com/geolocation/v1/geolocate?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ considerIp: true }),
    },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { location?: { lat?: number; lng?: number } };
  if (typeof json.location?.lat !== "number" || typeof json.location?.lng !== "number") {
    return null;
  }
  return { lat: json.location.lat, lng: json.location.lng };
}

async function reverseOnApi(lat: number, lng: number): Promise<DetectedPlace | null> {
  const res = await fetch(
    `${getApiBaseUrl()}/api/v1/maps/reverse?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`,
    { headers: { Accept: "application/json" } },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as {
    success?: boolean;
    data?: { label?: string; country_code?: string | null };
  };
  const label = json.data?.label?.trim();
  if (!json.success || !label) return null;
  return {
    label,
    countryCode: json.data?.country_code || undefined,
  };
}

function labelFromComponents(
  results: Array<{
    formatted_address?: string;
    address_components?: Array<{ long_name?: string; short_name?: string; types?: string[] }>;
  }>,
): DetectedPlace | null {
  let city = "";
  let country = "";
  let countryCode = "";
  for (const result of results) {
    for (const part of result.address_components ?? []) {
      const types = part.types ?? [];
      if (
        !city &&
        (types.includes("locality") ||
          types.includes("postal_town") ||
          types.includes("administrative_area_level_2"))
      ) {
        city = part.long_name || "";
      }
      if (!country && types.includes("country")) {
        country = part.long_name || "";
        countryCode = part.short_name || "";
      }
    }
  }
  const label = city && country ? `${city}, ${country}` : results[0]?.formatted_address || "";
  if (!label) return null;
  return { label, countryCode: countryCode || undefined };
}

async function reverseWithMapsJs(lat: number, lng: number): Promise<DetectedPlace | null> {
  await loadGoogleMaps();
  const Geocoder = window.google?.maps.Geocoder;
  if (!Geocoder) return null;
  const geocoder = new Geocoder();
  const results = await new Promise<Parameters<typeof labelFromComponents>[0] | null>((resolve) => {
    geocoder.geocode({ location: { lat, lng } }, (found, status) => {
      resolve(status === "OK" && found?.length ? found : null);
    });
  });
  return results ? labelFromComponents(results) : null;
}

/** City and country from the browser position, or from Google’s IP location. */
export async function detectCurrentPlace(): Promise<DetectedPlace | null> {
  let tracking = true;
  try {
    const cfg = await fetchMapsConfig();
    tracking = cfg.geolocation_tracking;
    if (!cfg.enabled && !cfg.server_geocoding) return null;
  } catch {
    tracking = true;
  }
  if (!tracking) return null;

  const key = await resolveGoogleMapsApiKey().catch(() => "");
  const coords = (await browserCoords()) ?? (key ? await googleIpCoords(key).catch(() => null) : null);
  if (!coords) return null;

  const fromApi = await reverseOnApi(coords.lat, coords.lng).catch(() => null);
  if (fromApi) return fromApi;
  return reverseWithMapsJs(coords.lat, coords.lng).catch(() => null);
}
