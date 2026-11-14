/* Minimal types for Maps JS API (full types via @types/google.maps optional). */
export namespace GoogleMapsStub {
  export type Map = object;
  export type Marker = object;
  export type LatLngBounds = object;
  export type InfoWindow = object;
}

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
      };
    };
    __joborioMapsLoading?: Promise<void>;
    __joborioMapsKey?: string;
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

export async function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Maps only load in the browser"));
  }

  if (window.google?.maps) {
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

  window.__joborioMapsLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return window.__joborioMapsLoading;
}

export type MapMarker = {
  id?: string | number;
  lat: number;
  lng: number;
  title?: string;
  subtitle?: string;
  count?: number;
};
