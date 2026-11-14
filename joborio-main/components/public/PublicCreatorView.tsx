"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Copy,
  Check,
  MapPin,
  Share2,
  Sparkles,
  Search,
  Send,
} from "lucide-react";

export type PublicListing = {
  id: number;
  title: string;
  company_name?: string | null;
  location_label?: string | null;
  is_remote?: boolean;
  destination_url?: string;
  tracked_url?: string;
  is_pinned?: boolean;
  ppc_rate_usd?: string | number | null;
  ppr_rate_usd?: string | number | null;
  category?: string | null;
  experience_level?: string | null;
};

export type PublicCreator = {
  handle: string;
  bio?: string | null;
  accent_color?: string;
  niches?: Array<{ name: string }>;
};

export default function PublicCreatorView({
  creator,
  listings,
  pageUrl,
}: {
  creator: PublicCreator;
  listings: PublicListing[];
  pageUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const accent = creator.accent_color ?? "#633BFF";

  const copyLink = async () => {
    await navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = `Check out opportunities from @${creator.handle} on JobOrio: ${pageUrl}`;
  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const telegramShare = `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((listing) => {
      if (remoteOnly && !listing.is_remote) return false;
      if (!q) return true;
      const hay = [
        listing.title,
        listing.company_name,
        listing.location_label,
        listing.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [listings, query, remoteOnly]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fff9fd] to-white pb-24 pt-28 text-[#172b63]">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <div
          className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(23,43,99,0.08)]"
          style={{ boxShadow: `0 24px 60px ${accent}15` }}
        >
          <div
            className="h-2 w-full"
            style={{
              background: `linear-gradient(90deg, ${accent}, #a855f7)`,
            }}
          />
          <div className="p-8 sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-2xl font-bold text-white">
                  {creator.handle.slice(0, 2).toUpperCase()}
                </div>
                <p className="text-sm font-semibold text-purple-600">
                  JobOrio creator
                </p>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  @{creator.handle}
                </h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-purple-200"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copied" : "Copy link"}
                </button>
                <a
                  href={whatsappShare}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white"
                >
                  <Share2 size={16} />
                  WhatsApp
                </a>
                <a
                  href={telegramShare}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#229ED9] px-4 py-2 text-sm font-semibold text-white"
                >
                  <Send size={16} />
                  Telegram
                </a>
              </div>
            </div>

            {creator.bio ? (
              <p className="mt-6 text-base leading-7 text-slate-600">
                {creator.bio}
              </p>
            ) : (
              <p className="mt-6 text-slate-500">
                Opportunities matched to this creator&apos;s niche and audience.
              </p>
            )}

            {creator.niches?.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {creator.niches.map((n) => (
                  <span
                    key={n.name}
                    className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700"
                  >
                    {n.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mb-4 mt-10 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-purple-600" />
            <h2 className="text-xl font-bold">Opportunities for you</h2>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <label className="relative flex-1 sm:w-56">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                placeholder="Search title, company…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-full border border-slate-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-purple-300"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                className="rounded border-slate-300"
              />
              Remote only
            </label>
          </div>
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              {listings.length === 0
                ? "New listings appear as your profile and feed refresh."
                : "No listings match your search. Try clearing filters."}
            </div>
          ) : (
            filtered.map((listing) => (
              <article
                key={listing.id}
                className="rounded-2xl border border-[#E9EEF6] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <h3 className="text-lg font-bold">{listing.title}</h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                  <MapPin size={14} />
                  {listing.company_name ?? "Company"} ·{" "}
                  {listing.location_label ??
                    (listing.is_remote ? "Remote" : "Global")}
                </p>
                <div className="mt-3 space-y-1 text-sm font-semibold text-purple-600">
                  <p>
                    Up to $
                    {Number(listing.ppc_rate_usd ?? 0.03).toFixed(2)} / verified
                    click
                  </p>
                  {listing.ppr_rate_usd != null &&
                  Number(listing.ppr_rate_usd) > 0 ? (
                    <p className="text-pink-600">
                      Up to $
                      {Number(listing.ppr_rate_usd).toFixed(2)} / verified
                      registration
                    </p>
                  ) : null}
                </div>
                {listing.tracked_url || listing.destination_url ? (
                  <a
                    href={listing.tracked_url ?? listing.destination_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-bold text-white"
                  >
                    View opportunity
                    <ArrowRight size={16} />
                  </a>
                ) : null}
              </article>
            ))
          )}
        </div>

        <p className="mt-12 text-center text-sm text-slate-500">
          Want your own link?{" "}
          <Link href="/signup" className="font-bold text-purple-600">
            Join JobOrio
          </Link>
        </p>
      </div>
    </main>
  );
}
