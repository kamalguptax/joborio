"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Eye } from "lucide-react";
import ShareLinkButton from "@/components/share/ShareLinkButton";
import SocialIcon, { SOCIAL_BG } from "@/components/creators/SocialIcon";
import { DEFAULT_AVATAR } from "@/lib/defaultAvatar";
import { SOCIAL_PLATFORMS, normalizeSocialUrl, type SocialKey } from "@/lib/socialLinks";
import { creatorProfilePath } from "@/lib/staticExport";

type Props = {
  /** Values currently typed in the form (preview updates live, before saving). */
  name: string;
  handle: string;
  bio: string;
  accent: string;
  avatarUrl: string | null;
  coverUrl?: string | null;
  niches: string[];
  socialLinks: Record<string, string>;
  /** Handle that is saved on the server — the shared link always uses this one. */
  savedHandle: string;
  loaded: boolean;
};

/** Live preview of the signed-in creator's public profile + share tools. */
export default function CreatorProfilePreview({
  name,
  handle,
  bio,
  accent,
  avatarUrl,
  coverUrl,
  niches,
  socialLinks,
  savedHandle,
  loaded,
}: Props) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  // window is client-only; read it after mount so server and client HTML match.
  useEffect(() => setOrigin(window.location.origin), []);

  const path = savedHandle ? creatorProfilePath(savedHandle) : "";
  const pageUrl = origin && path ? `${origin}${path}` : "";

  const displayName = name.trim() || (handle ? `@${handle}` : "Your name");
  const showHandle = Boolean(handle);
  const socials: Array<{ key: SocialKey; label: string }> = SOCIAL_PLATFORMS.filter((p) =>
    Boolean(normalizeSocialUrl(p.key, socialLinks[p.key])),
  ).map((p) => ({ key: p.key, label: p.label }));

  async function copyLink() {
    if (!pageUrl) return;
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <aside className="space-y-4 xl:sticky xl:top-6" aria-label="Public profile preview">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        <Eye size={14} aria-hidden="true" />
        Live preview
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div
          className="relative h-24 overflow-hidden"
          style={{
            background: `linear-gradient(120deg, ${accent}55 0%, #a855f733 55%, #38bdf833 100%)`,
          }}
        >
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="px-5 pb-6">
          <span
            className="-mt-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl text-2xl font-bold text-white shadow-lg ring-4 ring-white"
            style={{ background: `linear-gradient(135deg, ${accent}, #a855f7)` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl || DEFAULT_AVATAR} alt="" className="h-full w-full object-cover" />
          </span>

          <h3 className="mt-3 break-words text-xl font-bold text-[#0F1B3D]">{displayName}</h3>
          {showHandle ? (
            <p className="text-sm font-semibold text-slate-500">@{handle}</p>
          ) : null}

          <p
            className={`mt-3 whitespace-pre-line break-words text-sm leading-relaxed ${
              bio.trim() ? "text-slate-600" : "italic text-slate-400"
            }`}
          >
            {bio.trim() || "Your bio will show here. Add a short intro in Public profile."}
          </p>

          {niches.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {niches.slice(0, 5).map((n) => (
                <span
                  key={n}
                  className="rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ background: `${accent}15`, color: accent }}
                >
                  {n}
                </span>
              ))}
              {niches.length > 5 ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                  +{niches.length - 5}
                </span>
              ) : null}
            </div>
          ) : null}

          {socials.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {socials.map((s) => (
                <span
                  key={s.key}
                  title={s.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white"
                  style={{ background: SOCIAL_BG[s.key] }}
                >
                  <SocialIcon platform={s.key} size={14} />
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#0F1B3D]">Share your profile</h3>
        {pageUrl ? (
          <>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-1.5">
              <input
                readOnly
                value={pageUrl}
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Your public profile link"
                className="min-w-0 flex-1 bg-transparent text-xs text-slate-600 outline-none"
              />
              <button
                type="button"
                onClick={() => void copyLink()}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-violet-50"
              >
                {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ShareLinkButton
                url={pageUrl}
                title={`Check out ${displayName} on JobOrio`}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
              />
              <Link
                href={path}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
              >
                <ExternalLink size={16} aria-hidden="true" />
                View public page
              </Link>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              The public page shows your last saved details. Save your changes to update it.
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            {loaded ? "Your public link appears here once your username is set." : "Loading your link…"}
          </p>
        )}
      </div>
    </aside>
  );
}
