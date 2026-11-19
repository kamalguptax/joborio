/* Minimal types for Maps JS API (full types via @types/google.maps optional). */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace GoogleMapsStub {
  export type Map = object;
  export type Marker = object;
  export type LatLngBounds = object;
  export type InfoWindow = object;
}

export type GooglePlaceResult = {
  formatted_address?: string;
  name?: string;
  address_components?: Array<{
    long_name?: string;
    short_name?: string;
    types?: string[];
  }>;
  geometry?: {
    location?: { lat: () => number; lng: () => number };
  };
};

declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (
          el: HTMLElement,
          opts: Record<string, unknown>,
        ) => GoogleMapsStub.Map & {
          fitBounds: (b: GoogleMapsStub.LatLngBounds, padding?: number) => void;
          setCenter: (c: { lat: number; lng: number }) => void;
          setZoom: (z: number) => void;
        };
        Marker: new (opts: Record<string, unknown>) => GoogleMapsStub.Marker & {
          setMap: (m: unknown) => void;
          addListener: (event: string, fn: () => void) => void;
        };
        LatLngBounds: new () => GoogleMapsStub.LatLngBounds & {
          extend: (p: { lat: number; lng: number }) => void;
        };
        InfoWindow: new (opts: { content: string }) => {
          open: (opts: { anchor: unknown; map: unknown }) => void;
        };
        Geocoder: new () => {
          geocode: (
            request: { location: { lat: number; lng: number } },
            callback: (
              results: Array<{
                formatted_address?: string;
                address_components?: Array<{
                  long_name?: string;
                  short_name?: string;
                  types?: string[];
                }>;
              }> | null,
              status: string,
            ) => void,
          ) => void;
        };
        places?: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts?: {
              types?: string[];
              fields?: string[];
              componentRestrictions?: { country?: string | string[] };
            },
          ) => {
            addListener: (event: string, fn: () => void) => void;
            getPlace: () => GooglePlaceResult;
          };
        };
      };
    };
    __joborioMapsLoading?: Promise<void>;
    __joborioMapsKey?: string;
    gm_authFailure?: () => void;
  }
}

export function getGoogleMapsApiKey(): string {
  return (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "").trim();
}

export async function resolveGoogleMapsApiKey(): Promise<string> {
  if (typeof window !== "undefined" && window.__joborioMapsKey) {
    return window.__joborioMapsKey;
  }

  const env = getGoogleMapsApiKey();
  if (env) {
    if (typeof window !== "undefined") {
      window.__joborioMapsKey = env;
    }
    return env;
  }

  const { fetchMapsConfig } = await import("@/lib/api/maps");
  const cfg = await fetchMapsConfig();
  const key = (cfg.browser_api_key || "").trim();
  if (typeof window !== "undefined") {
    window.__joborioMapsKey = key;
  }
  return key;
}

export function mapsEnabled(): boolean {
  return getGoogleMapsApiKey().length > 0;
}

export async function mapsEnabledAsync(): Promise<boolean> {
  if (getGoogleMapsApiKey()) {
    return true;
  }
  try {
    const { fetchMapsConfig } = await import("@/lib/api/maps");
    const cfg = await fetchMapsConfig();
    return Boolean(cfg.enabled && cfg.browser_api_key);
  } catch {
    return false;
  }
}

export async function loadGoogleMaps(opts?: {
  libraries?: Array<"places">;
}): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Maps only load in the browser"));
  }

  const wantPlaces = Boolean(opts?.libraries?.includes("places"));
  if (window.google?.maps) {
    if (wantPlaces && !window.google.maps.places) {
      return Promise.reject(
        new Error(
          "Google Maps loaded without Places. Refresh the page so Places can load.",
        ),
      );
    }
    return Promise.resolve();
  }

  const key = await resolveGoogleMapsApiKey();
  if (!key) {
    return Promise.reject(
      new Error(
        "Google Maps API key is not set. Add it in Admin → Platform settings or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.",
      ),
    );
  }

  if (window.__joborioMapsLoading) {
    return window.__joborioMapsLoading;
  }

  // Always include places so autocomplete and maps share one script load.
  const libraries = "places";

  window.__joborioMapsLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=${libraries}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return window.__joborioMapsLoading;
}

export function countryCodeFromPlace(place: GooglePlaceResult): string | undefined {
  const comp = place.address_components?.find((c) =>
    (c.types ?? []).includes("country"),
  );
  const code = comp?.short_name?.trim().toUpperCase();
  return code && code.length === 2 ? code : undefined;
}

export function labelFromPlace(place: GooglePlaceResult): string {
  return (
    place.formatted_address?.trim() ||
    place.name?.trim() ||
    ""
  );
}

export type MapMarker = {
  id?: string | number;
  lat: number;
  lng: number;
  title?: string;
  subtitle?: string;
  count?: number;
};
