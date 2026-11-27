"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  Check,
  Copy,
  Globe,
  MapPin,
  MousePointerClick,
  Search,
  Send,
  Share2,
  Sparkles,
  Users,
  Wallet,
  Wifi,
} from "lucide-react";
import SocialIcon from "@/components/creators/SocialIcon";
import { initialsOf, nameRepeatsHandle } from "@/lib/creatorIdentity";
import { formatMoney } from "@/lib/money";

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
  name?: string | null;
  bio?: string | null;
  accent_color?: string;
  cover_url?: string | null;
  avatar_url?: string | null;
  niches?: Array<{ name: string }>;
  social_links?: {
    linkedin?: string;
    instagram?: string;
    community?: string;
    website?: string;
  } | null;
  public_code?: string | null;
  audience_countries?: string[];
  payout?: {
    ready?: boolean;
    method_label?: string | null;
    currency?: string;
    paid_usd?: number;
    /** Paid out in the previous calendar month (computed by the API). */
    paid_last_month_usd?: number;
    policy_path?: string;
  };
  stats?: {
    verified_clicks?: number;
    paid_usd?: number;
    paid_last_month_usd?: number;
  };
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
  const paidUsd = Number(creator.payout?.paid_usd ?? creator.stats?.paid_usd ?? 0);
  // Calculated by the API (previous calendar month). Always shown, $0.00 when nothing was paid.
  const paidLastMonthUsd = Number(
    creator.payout?.paid_last_month_usd ?? creator.stats?.paid_last_month_usd ?? 0,
  );
  const currency = creator.payout?.currency || "USD";
  const displayName = creator.name?.trim() || `@${creator.handle}`;
  // Don't print the same name twice ("Jonathan Mark" + "@jonathanmark").
  const showHandle = !nameRepeatsHandle(creator.name, creator.handle);
  const [idCopied, setIdCopied] = useState(false);
  const [allNiches, setAllNiches] = useState(false);
  const clicks = Number(creator.stats?.verified_clicks ?? 0);

  const copyLink = async () => {
    await navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyId = async () => {
    if (!creator.public_code) return;
    try {
      await navigator.clipboard.writeText(creator.public_code);
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  const shareText = `Check out opportunities from @${creator.handle} on JobOrio: ${pageUrl}`;
  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const telegramShare = `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`;

  const socialEntries = useMemo(() => {
    const links = creator.social_links ?? {};
    return [
      { label: "Website", href: links.website, icon: <Globe size={14} aria-hidden="true" /> },
      { label: "LinkedIn", href: links.linkedin, icon: <SocialIcon platform="linkedin" size={14} /> },
      { label: "Instagram", href: links.instagram, icon: <SocialIcon platform="instagram" size={14} /> },
      { label: "Community", href: links.community, icon: <Users size={14} aria-hidden="true" /> },
    ].filter(
      (item): item is { label: string; href: string; icon: React.ReactElement } =>
        Boolean(item.href),
    );
  }, [creator.social_links]);

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

  const niches = creator.niches ?? [];
  const NICHE_LIMIT = 6;
  const shownNiches = allNiches ? niches : niches.slice(0, NICHE_LIMIT);
  const hiddenNiches = niches.length - NICHE_LIMIT;

  const actionBtn =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500";

  return (
    <main className="min-h-svh bg-gradient-to-b from-[#fbf7ff] via-[#fff9fd] to-white pb-24 pt-24 text-[#172b63] sm:pt-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-8">
        {/* ——— Profile card ——— */}
        <div
          className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white"
          style={{ boxShadow: `0 30px 70px -30px ${accent}55, 0 2px 6px rgba(23,43,99,0.04)` }}
        >
          <div
            className="relative h-32 overflow-hidden sm:h-40"
            style={{
              background: `linear-gradient(120deg, ${accent}40 0%, #a855f733 50%, #38bdf833 100%)`,
            }}
          >
            <span
              aria-hidden="true"
              className="absolute -left-12 -top-20 h-60 w-60 rounded-full blur-3xl"
              style={{ background: `${accent}55` }}
            />
            <span
              aria-hidden="true"
              className="absolute -right-10 top-2 h-52 w-52 rounded-full bg-pink-300/40 blur-3xl"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 opacity-60"
              style={{
                backgroundImage: "radial-gradient(rgba(23,43,99,0.10) 1px, transparent 1px)",
                backgroundSize: "18px 18px",
              }}
            />
            {creator.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={creator.cover_url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
          </div>

          <div className="relative px-5 pb-8 sm:px-10">
            <div className="-mt-12 flex flex-wrap items-end justify-between gap-4 sm:-mt-14">
              <div
                className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[28px] text-4xl font-bold text-white shadow-xl ring-[6px] ring-white sm:h-28 sm:w-28 sm:text-5xl"
                style={{ background: `linear-gradient(135deg, ${accent}, #a855f7)` }}
              >
                {creator.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={creator.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  initialsOf(creator.name, creator.handle)
                )}
              </div>

              <div className="flex flex-wrap gap-2 sm:pb-1">
                <button
                  type="button"
                  onClick={copyLink}
                  className={`${actionBtn} border border-slate-200 bg-white text-slate-700 hover:border-purple-300 hover:text-purple-700`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copied" : "Copy link"}
                </button>
                <a
                  href={whatsappShare}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${actionBtn} bg-[#25D366] text-white shadow-sm shadow-emerald-500/30 hover:brightness-95`}
                >
                  <Share2 size={16} />
                  WhatsApp
                </a>
                <a
                  href={telegramShare}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${actionBtn} bg-[#229ED9] text-white shadow-sm shadow-sky-500/30 hover:brightness-95`}
                >
                  <Send size={16} />
                  Telegram
                </a>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="break-words text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                {displayName}
              </h1>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                <BadgeCheck size={14} aria-hidden="true" />
                Verified creator
              </span>
            </div>

            {showHandle || creator.public_code ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {showHandle ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                    @{creator.handle}
                  </span>
                ) : null}
                {creator.public_code ? (
                  <button
                    type="button"
                    onClick={copyId}
                    title="Copy creator ID"
                    aria-label={`Copy creator ID ${creator.public_code}`}
                    className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-3 pr-2.5 text-sm transition hover:border-purple-300"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      ID
                    </span>
                    <span className="font-mono text-[13px] font-bold tracking-wide text-[#172b63]">
                      {creator.public_code}
                    </span>
                    {idCopied ? (
                      <Check size={14} className="text-emerald-600" aria-hidden="true" />
                    ) : (
                      <Copy
                        size={14}
                        className="text-slate-400 group-hover:text-purple-600"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                ) : null}
              </div>
            ) : null}

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600">
              {creator.bio || "Opportunities matched to this creator\u2019s niche and audience."}
            </p>

            {niches.length ? (
              <div className="mt-5">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Niches
                </p>
                <div className="flex flex-wrap gap-2">
                  {shownNiches.map((n) => (
                    <span
                      key={n.name}
                      className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 ring-1 ring-purple-100"
                    >
                      {n.name}
                    </span>
                  ))}
                  {hiddenNiches > 0 ? (
                    <button
                      type="button"
                      onClick={() => setAllNiches((v) => !v)}
                      className="rounded-full border border-dashed border-purple-300 px-3 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-50"
                    >
                      {allNiches ? "Show less" : `+${hiddenNiches} more`}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {socialEntries.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {socialEntries.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-purple-300 hover:text-purple-700"
                  >
                    {item.icon}
                    {item.label}
                  </a>
                ))}
              </div>
            ) : null}

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                  <MousePointerClick size={18} aria-hidden="true" />
                </span>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Verified clicks
                </p>
                <p className="mt-0.5 text-2xl font-bold">{clicks.toLocaleString("en-US")}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <CalendarClock size={18} aria-hidden="true" />
                </span>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-700/70">
                  Paid last month
                </p>
                <p className="mt-0.5 text-2xl font-bold text-emerald-700">
                  {formatMoney(paidLastMonthUsd, currency)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                  <Wallet size={18} aria-hidden="true" />
                </span>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Total paid out
                </p>
                <p className="mt-0.5 text-2xl font-bold">{formatMoney(paidUsd, currency)}</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Payouts follow the{" "}
              <Link
                href={creator.payout?.policy_path || "/payout-policy"}
                className="font-semibold text-violet-700 hover:underline"
              >
                Payout policy
              </Link>
              .
            </p>
          </div>
        </div>

        {/* ——— Opportunities ——— */}
        <div className="mb-5 mt-12 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <Sparkles size={18} aria-hidden="true" />
            </span>
            <h2 className="text-xl font-bold">Opportunities for you</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
              {filtered.length}
            </span>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <label className="relative flex-1 sm:w-64">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                placeholder="Search title, company…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
              />
            </label>
            <label
              className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
                remoteOnly
                  ? "border-purple-300 bg-purple-50 text-purple-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-purple-200"
              }`}
            >
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                className="sr-only"
              />
              <Wifi size={15} aria-hidden="true" />
              Remote only
            </label>
          </div>
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              {listings.length === 0
                ? "New listings appear as this creator adds opportunities."
                : "No listings match your search. Try clearing filters."}
            </div>
          ) : (
            filtered.map((listing, i) => {
              const href = listing.tracked_url ?? listing.destination_url;
              const company = listing.company_name ?? "Company";
              const ppc = Number(listing.ppc_rate_usd ?? 0.03);
              const ppr = Number(listing.ppr_rate_usd ?? 0);
              const tones = [
                "bg-violet-100 text-violet-700",
                "bg-sky-100 text-sky-700",
                "bg-emerald-100 text-emerald-700",
                "bg-amber-100 text-amber-700",
                "bg-rose-100 text-rose-700",
              ];
              return (
                <article
                  key={listing.id}
                  className="group flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-900/5 sm:flex-row sm:items-center sm:gap-5 sm:p-6"
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${tones[i % tones.length]}`}
                  >
                    {company.trim()[0]?.toUpperCase() ?? "J"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold leading-snug sm:text-lg">{listing.title}</h3>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                      <span className="font-medium text-slate-600">{company}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        {listing.is_remote ? <Wifi size={13} /> : <MapPin size={13} />}
                        {listing.location_label ?? (listing.is_remote ? "Remote" : "Global")}
                      </span>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                        Up to ${ppc.toFixed(2)} / verified click
                      </span>
                      {ppr > 0 ? (
                        <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-bold text-pink-700 ring-1 ring-pink-100">
                          Up to ${ppr.toFixed(2)} / verified registration
                        </span>
                      ) : null}
                      {listing.category ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {listing.category}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-500/20 transition hover:shadow-lg hover:shadow-purple-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
                    >
                      View opportunity
                      <ArrowUpRight
                        size={16}
                        aria-hidden="true"
                        className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </a>
                  ) : null}
                </article>
              );
            })
          )}
        </div>

        <div className="mt-12 rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6 text-center sm:p-8">
          <p className="text-lg font-bold">Want your own profile with payout?</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Share verified opportunities with your audience and get paid for what counts.
          </p>
          <Link
            href="/creator/register"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#172b63] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#0F1B3D]"
          >
            Join as a creator
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </main>
  );
}
