/** Social platforms a creator can link on their public profile (shown in this order). */
export const SOCIAL_PLATFORMS = [
  { key: "linkedin", label: "LinkedIn", placeholder: "https://www.linkedin.com/in/you", base: "https://www.linkedin.com/in/" },
  { key: "instagram", label: "Instagram", placeholder: "https://www.instagram.com/you", base: "https://www.instagram.com/" },
  { key: "tiktok", label: "TikTok", placeholder: "https://www.tiktok.com/@you", base: "https://www.tiktok.com/@" },
  { key: "telegram", label: "Telegram", placeholder: "https://t.me/yourchannel", base: "https://t.me/" },
  { key: "youtube", label: "YouTube", placeholder: "https://www.youtube.com/@you", base: "https://www.youtube.com/@" },
  { key: "whatsapp", label: "WhatsApp channel", placeholder: "https://whatsapp.com/channel/…", base: "" },
] as const;

export type SocialKey = (typeof SOCIAL_PLATFORMS)[number]["key"];
export type SocialLinks = Partial<Record<SocialKey | "community" | "website", string>>;

/**
 * Turns what a creator typed into a safe https URL, or null.
 * Accepts full links, "www.…" links and (where it makes sense) a bare @handle.
 * Anything with another scheme (javascript:, data:, …) is rejected.
 */
export function normalizeSocialUrl(key: SocialKey, value?: string | null): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return null;
  if (/[./]/.test(v)) return `https://${v.replace(/^\/+/, "")}`;
  const base = SOCIAL_PLATFORMS.find((p) => p.key === key)?.base;
  const handle = v.replace(/^@/, "");
  return base && handle ? `${base}${encodeURIComponent(handle)}` : null;
}
