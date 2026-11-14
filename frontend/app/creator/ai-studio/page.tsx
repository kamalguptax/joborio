"use client";

import { useEffect, useState } from "react";
import {
  fetchAiStudioQuota,
  fetchCreatorListings,
  generateAiPost,
} from "@/lib/api/creator";

const platforms = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "twitter", label: "X / Twitter" },
];

export default function AiStudioPage() {
  const [quota, setQuota] = useState({ used: 0, cap: 5, remaining: 5 });
  const [listings, setListings] = useState<
    Array<{ listing: { id: number; title: string }; tracked_url: string }>
  >([]);
  const [listingId, setListingId] = useState("");
  const [platform, setPlatform] = useState("whatsapp");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAiStudioQuota().then(setQuota);
    fetchCreatorListings().then((rows) => setListings(rows));
  }, []);

  const run = async () => {
    setError(null);
    setOutput("");
    if (!listingId) {
      setError("Pick a listing.");
      return;
    }
    try {
      const res = await generateAiPost({
        listing_id: Number(listingId),
        platform,
      });
      setOutput(res.content);
      setQuota((q) => ({
        ...q,
        used: res.remaining + 1 > q.cap ? q.cap : q.used + 1,
        remaining: res.remaining,
      }));
    } catch {
      setError("Generation failed or monthly cap reached.");
    }
  };

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
          Module K · AI Post Studio
        </p>
        <h1 className="mt-1 text-3xl font-bold">AI Post Studio</h1>
        <p className="mt-2 text-slate-500">
          Generate share-ready captions with your tracked link.{" "}
          <strong>{quota.remaining}</strong> of {quota.cap} generations left this month.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-700">Listing</label>
          <select
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Select…</option>
            {listings.map((row) => (
              <option key={row.listing.id} value={row.listing.id}>
                {row.listing.title}
              </option>
            ))}
          </select>

          <label className="mt-4 block text-sm font-semibold text-slate-700">Platform</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {platforms.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatform(p.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  platform === p.id
                    ? "bg-purple-600 text-white"
                    : "border border-slate-200 text-slate-600"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {error ? (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          ) : null}

          <button
            type="button"
            onClick={run}
            disabled={quota.remaining <= 0}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            Generate post
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-xs font-bold uppercase text-slate-400">Output</p>
          {output ? (
            <textarea
              readOnly
              value={output}
              className="mt-3 h-64 w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed"
            />
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Your caption will appear here with the tracked URL embedded.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
