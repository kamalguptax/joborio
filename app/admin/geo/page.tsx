"use client";

import { useEffect, useMemo, useState } from "react";
import GoogleMapPanel from "@/components/maps/GoogleMapPanel";
import { adminTrafficMap } from "@/lib/api/maps";
import type { MapMarker } from "@/lib/maps/googleMaps";

export default function AdminGeoPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Awaited<ReturnType<typeof adminTrafficMap>> | null>(
    null,
  );

  useEffect(() => {
    adminTrafficMap(days)
      .then(setData)
      .catch(() => setData(null));
  }, [days]);

  const markers: MapMarker[] = useMemo(() => {
    if (!data) return [];
    const clicks = (data.click_markers ?? []).map((m, i) => ({
      id: `c-${i}`,
      lat: m.lat,
      lng: m.lng,
      title: m.country_code ? `Country ${m.country_code}` : "Click cluster",
      count: m.count,
      subtitle: m.source === "gps" ? "GPS click" : "Country aggregate",
    }));
    const web = (data.website_markers ?? []).map((m, i) => ({
      id: `w-${i}`,
      lat: m.lat,
      lng: m.lng,
      title: "Website visitor",
      count: m.count,
      subtitle: "Embed geolocation",
    }));
    return [...clicks, ...web];
  }, [data]);

  return (
    <>
      <h1 className="text-2xl font-bold">Geo traffic map</h1>
      <p className="mt-1 text-sm text-slate-400">
        PPC clicks (country centroids + GPS) and website embed locations from the
        last {days} days.
      </p>

      <div className="mt-4 flex gap-2">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              days === d ? "bg-amber-500 text-zinc-950" : "border border-white/20"
            }`}
          >
            {d} days
          </button>
        ))}
      </div>

      <div className="mt-6">
        <GoogleMapPanel
          markers={markers}
          height={480}
          emptyMessage="Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in the frontend and GOOGLE_MAPS_API_KEY on the API for maps."
        />
      </div>

      <p className="mt-4 text-xs text-slate-500">
        {markers.length} map points · Enable Maps JavaScript API + Geocoding API in
        Google Cloud. Website embeds send optional GPS when visitors allow location.
      </p>
    </>
  );
}
