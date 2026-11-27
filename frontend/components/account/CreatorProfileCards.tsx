"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/account/AccountCard";
import IndustryKeywordSelect from "@/components/job-preferences/IndustryKeywordSelect";
import SocialLinksFields from "@/components/creators/SocialLinksFields";
import { toast } from "@/components/ui/Toast";
import { notifyAccountUpdated } from "@/lib/api/account";
import {
  fetchCreatorJobPreferences,
  updateCreatorJobPreferences,
  updateCreatorProfile,
  type CreatorOpportunityTargeting,
} from "@/lib/api/creator";
import { SOCIAL_PLATFORMS, normalizeSocialUrl, type SocialKey } from "@/lib/socialLinks";

const PROFILE_SOCIALS: SocialKey[] = ["linkedin", "instagram", "youtube"];
const AUDIENCE_SOCIALS: SocialKey[] = ["tiktok", "telegram", "whatsapp"];

const primaryBtn =
  "inline-flex items-center justify-center rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60";
const ghostBtn =
  "inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-violet-700";

/**
 * Social links, saved in two groups (the same split the old Settings page had).
 * `socialLinks` lives in the parent so the live preview can read it.
 */
export function CreatorSocialsCard({
  variant,
  socialLinks,
  onChange,
  onSaved,
}: {
  variant: "profile" | "audience";
  socialLinks: Record<string, string>;
  onChange: (key: SocialKey, value: string) => void;
  onSaved?: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const isProfile = variant === "profile";
  const keys = isProfile ? PROFILE_SOCIALS : AUDIENCE_SOCIALS;

  const buildLinks = (): Record<string, string> | null => {
    const out: Record<string, string> = {};
    // Keep links the form does not edit (e.g. community, website).
    for (const [k, v] of Object.entries(socialLinks)) {
      if (!SOCIAL_PLATFORMS.some((p) => p.key === k) && typeof v === "string" && v.trim()) {
        out[k] = v;
      }
    }
    for (const p of SOCIAL_PLATFORMS) {
      const raw = socialLinks[p.key]?.trim();
      if (!raw) continue;
      if (!keys.includes(p.key)) {
        out[p.key] = raw;
        continue;
      }
      const url = normalizeSocialUrl(p.key, raw);
      if (!url) {
        toast.error(`Enter a valid ${p.label} link.`);
        return null;
      }
      out[p.key] = url;
    }
    return out;
  };

  const save = async () => {
    const social_links = buildLinks();
    if (!social_links) return;
    setSaving(true);
    try {
      await updateCreatorProfile({ social_links });
      notifyAccountUpdated();
      toast.success(isProfile ? "Profile socials saved." : "Audience channels saved.");
      onSaved?.();
    } catch {
      toast.error("Could not save links. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title={isProfile ? "Profile socials" : "Audience channels"}>
      <p className="text-sm text-slate-500">
        {isProfile
          ? "LinkedIn, Instagram, and YouTube show on your public creator card."
          : "TikTok, Telegram, and WhatsApp help match how you reach your audience."}
      </p>
      <SocialLinksFields
        values={socialLinks as Partial<Record<SocialKey, string>>}
        onChange={onChange}
        keys={keys}
      />
      <button type="button" onClick={() => void save()} disabled={saving} className={`${primaryBtn} mt-5`}>
        {saving ? "Saving…" : isProfile ? "Save profile socials" : "Save audience channels"}
      </button>
    </Card>
  );
}

const emptyTargeting = (): CreatorOpportunityTargeting => ({
  keywords: [],
  industry: [],
  brands: [],
  audience_type: [],
  work_mode: [],
  currency: "USD",
});

/** Industries and keywords the creator promotes. */
export function CreatorIndustryCard() {
  const [targeting, setTargeting] = useState<CreatorOpportunityTargeting>(emptyTargeting);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCreatorJobPreferences()
      .then((prefs) => setTargeting({ ...emptyTargeting(), ...(prefs.opportunity_targeting ?? {}) }))
      .catch(() => setTargeting(emptyTargeting()));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await updateCreatorJobPreferences({ opportunity_targeting: targeting });
      toast.success("Industry & keywords saved.");
    } catch {
      toast.error("Could not save industry & keywords.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Industry & keywords">
      <p className="text-sm text-slate-500">
        Choose industries and keywords. Job counts show for each selection.
      </p>
      <div className="mt-4">
        <IndustryKeywordSelect
          industry={targeting.industry}
          keywords={targeting.keywords}
          onIndustryChange={(industry) => setTargeting((t) => ({ ...t, industry }))}
          onKeywordsChange={(keywords) => setTargeting((t) => ({ ...t, keywords }))}
        />
      </div>
      <button type="button" onClick={() => void save()} disabled={saving} className={`${primaryBtn} mt-5`}>
        {saving ? "Saving…" : "Save industry & keywords"}
      </button>
    </Card>
  );
}

export function CreatorJobPreferencesCard() {
  return (
    <Card title="Job preferences">
      <p className="text-sm text-slate-500">
        Salary, work mode, countries, and more live on job preferences.
      </p>
      <Link href="/creator/job-preferences" className={`${ghostBtn} mt-4`}>
        Edit job preferences
      </Link>
    </Card>
  );
}
