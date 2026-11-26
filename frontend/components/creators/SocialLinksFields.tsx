"use client";

import SocialIcon, { SOCIAL_BG } from "@/components/creators/SocialIcon";
import { SOCIAL_PLATFORMS, type SocialKey } from "@/lib/socialLinks";

/** One input per platform shown on the public profile card. */
export default function SocialLinksFields({
  values,
  onChange,
  keys,
  title,
  hint,
}: {
  values: Partial<Record<SocialKey, string>>;
  onChange: (key: SocialKey, value: string) => void;
  /** Limit to a subset of platforms (for splitting across cards). */
  keys?: SocialKey[];
  title?: string;
  hint?: string;
}) {
  const platforms = keys?.length
    ? SOCIAL_PLATFORMS.filter((p) => keys.includes(p.key))
    : [...SOCIAL_PLATFORMS];

  if (platforms.length === 0) return null;

  return (
    <fieldset className={title || hint ? "mt-5" : "mt-4"}>
      {title ? <legend className="text-sm font-semibold">{title}</legend> : null}
      {hint ? (
        <p className={`text-xs text-slate-500 ${title ? "mt-1" : ""}`}>{hint}</p>
      ) : null}
      <div className={`grid gap-3 sm:grid-cols-2 ${title || hint ? "mt-3" : ""}`}>
        {platforms.map((p) => (
          <label key={p.key} className="block">
            <span className="mb-1 flex items-center gap-2 text-[13px] font-semibold text-slate-700">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-white"
                style={{ background: SOCIAL_BG[p.key] }}
              >
                <SocialIcon platform={p.key} size={12} />
              </span>
              {p.label}
            </span>
            <input
              value={values[p.key] ?? ""}
              onChange={(e) => onChange(p.key, e.target.value)}
              placeholder={p.placeholder}
              inputMode="url"
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
