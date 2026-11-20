"use client";

import SocialIcon, { SOCIAL_BG } from "@/components/creators/SocialIcon";
import { SOCIAL_PLATFORMS, type SocialKey } from "@/lib/socialLinks";

/** One input per platform shown on the public profile card. */
export default function SocialLinksFields({
  values,
  onChange,
}: {
  values: Partial<Record<SocialKey, string>>;
  onChange: (key: SocialKey, value: string) => void;
}) {
  return (
    <fieldset className="mt-5">
      <legend className="text-sm font-semibold">Social links</legend>
      <p className="mt-1 text-xs text-slate-500">
        These show as icons on your public creator card. Paste a link or an @handle.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {SOCIAL_PLATFORMS.map((p) => (
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
