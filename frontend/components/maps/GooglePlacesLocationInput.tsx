"use client";

import { useEffect, useRef, useState } from "react";
import {
  countryCodeFromPlace,
  labelFromPlace,
  loadGoogleMaps,
} from "@/lib/maps/googleMaps";

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: { label: string; countryCode?: string }) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
};

export default function GooglePlacesLocationInput({
  id,
  value,
  onChange,
  onPlaceSelect,
  className,
  placeholder = "Start typing a city…",
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const [hint, setHint] = useState<string | null>(null);
  const [mapsReady, setMapsReady] = useState(false);

  onChangeRef.current = onChange;
  onPlaceSelectRef.current = onPlaceSelect;

  useEffect(() => {
    let cancelled = false;

    const onAuthFailure = () => {
      if (cancelled) return;
      setMapsReady(false);
      setHint(
        "Google Maps key was rejected. Use the Maps JavaScript + Places key in Admin → Platform settings, allow joborio.com referrers, and enable billing.",
      );
    };

    window.gm_authFailure = onAuthFailure;

    loadGoogleMaps({ libraries: ["places"] })
      .then(() => {
        if (cancelled || !inputRef.current || !window.google?.maps?.places) {
          if (!cancelled) {
            setMapsReady(false);
            setHint(
              "Places library did not load. Enable Places API on your Google Cloud key.",
            );
          }
          return;
        }

        const autocomplete = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            // Broader than (cities) so “delhi” and areas still get suggestions.
            types: ["geocode"],
            fields: [
              "formatted_address",
              "address_components",
              "name",
              "geometry",
            ],
          },
        );
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const label = labelFromPlace(place);
          if (!label) return;
          onChangeRef.current(label);
          onPlaceSelectRef.current?.({
            label,
            countryCode: countryCodeFromPlace(place),
          });
          setHint("Selected from Google Places");
        });
        if (!cancelled) {
          setMapsReady(true);
          setHint("Type a city — pick a suggestion from the Google list");
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setMapsReady(false);
          const message =
            err instanceof Error ? err.message : "Google Maps failed to load";
          setHint(
            message.includes("API key")
              ? message
              : "Google location search unavailable — add Maps JavaScript API key (browser) in Admin → Platform settings, or type your city manually.",
          );
        }
      });

    return () => {
      cancelled = true;
      if (window.gm_authFailure === onAuthFailure) {
        delete window.gm_authFailure;
      }
    };
  }, []);

  return (
    <div className="relative z-20">
      <input
        ref={inputRef}
        id={id}
        type="text"
        autoComplete="off"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value);
          if (mapsReady) {
            setHint("Keep typing, then click a Google suggestion below");
          }
        }}
        placeholder={placeholder}
        className={className}
      />
      {hint ? (
        <p
          className={`mt-1.5 text-xs ${
            mapsReady ? "text-slate-500" : "text-amber-700"
          }`}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
