"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps, mapsEnabledAsync, type MapMarker } from "@/lib/maps/googleMaps";

type Props = {
  markers: MapMarker[];
  height?: number;
  className?: string;
  emptyMessage?: string;
};

type MapHandle = {
  fitBounds: (b: unknown, padding?: number) => void;
  setCenter: (c: { lat: number; lng: number }) => void;
  setZoom: (z: number) => void;
};

export default function GoogleMapPanel({
  markers,
  height = 360,
  className = "",
  emptyMessage = "Add a Google Maps API key to see the map.",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MapHandle | null>(null);
  const markerRefs = useRef<Array<{ setMap: (m: unknown) => void }>>([]);

  useEffect(() => {
    let cancelled = false;

    mapsEnabledAsync()
      .then((ok) => {
        if (cancelled) return;
        if (!ok) {
          setError(emptyMessage);
          return;
        }
        return loadGoogleMaps();
      })
      .then(() => {
        if (cancelled) return;
        const mapsApi = window.google?.maps;
        if (cancelled || !containerRef.current || !mapsApi) {
          return;
        }

        const center =
          markers.length > 0
            ? { lat: markers[0].lat, lng: markers[0].lng }
            : { lat: 20, lng: 0 };

        if (!mapRef.current) {
          mapRef.current = new mapsApi.Map(containerRef.current, {
            center,
            zoom: markers.length === 1 ? 8 : 2,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          }) as MapHandle;
        }

        const map = mapRef.current;
        if (!map) {
          return;
        }

        markerRefs.current.forEach((m) => m.setMap(null));
        markerRefs.current = [];

        const bounds = new mapsApi.LatLngBounds();

        markers.forEach((m) => {
          const position = { lat: m.lat, lng: m.lng };
          bounds.extend(position);
          const marker = new mapsApi.Marker({
            position,
            map,
            title: m.title ?? (m.count ? `${m.count} events` : "Location"),
          });
          if (m.subtitle || m.count) {
            const info = new mapsApi.InfoWindow({
              content: `<div style="font-family:sans-serif;font-size:13px"><strong>${m.title ?? "Event"}</strong><br/>${m.subtitle ?? ""}${m.count ? `<br/>${m.count} events` : ""}</div>`,
            });
            marker.addListener("click", () =>
              info.open({ anchor: marker, map }),
            );
          }
          markerRefs.current.push(marker);
        });

        if (markers.length > 1) {
          map.fitBounds(bounds, 48);
        } else if (markers.length === 1) {
          map.setCenter(center);
          map.setZoom(8);
        }
      })
      .catch((e: Error) => setError(e.message || emptyMessage));

    return () => {
      cancelled = true;
    };
  }, [markers, emptyMessage]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500 ${className}`}
        style={{ minHeight: height }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden rounded-2xl border border-slate-200 ${className}`}
      style={{ height }}
    />
  );
}
