"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchMe } from "@/lib/api/auth";
import {
  fetchCreatorJobPreferences,
  updateCreatorJobPreferences,
  updateCreatorProfile,
  type CreatorOpportunityTargeting,
} from "@/lib/api/creator";
import IndustryKeywordSelect from "@/components/job-preferences/IndustryKeywordSelect";
import { toast } from "@/components/ui/Toast";
import SocialLinksFields from "@/components/creators/SocialLinksFields";
import {
  SOCIAL_PLATFORMS,
  normalizeSocialUrl,
  type SocialKey,
} from "@/lib/socialLinks";

const PROFILE_SOCIALS: SocialKey[] = ["linkedin", "instagram", "youtube"];
const AUDIENCE_SOCIALS: SocialKey[] = ["tiktok", "telegram", "whatsapp"];

const emptyTargeting = (): CreatorOpportunityTargeting => ({
  keywords: [],
  industry: [],
  brands: [],
  audience_type: [],
  work_mode: [],
  currency: "USD",
});

export default function CreatorSettingsPage() {
  const [bio, setBio] = useState("");
  const [accent, setAccent] = useState("#2563eb");
  const [socials, setSocials] = useState<Partial<Record<SocialKey, string>>>({});
  const [otherLinks, setOtherLinks] = useState<Record<string, string>>({});
  const [targeting, setTargeting] =
    useState<CreatorOpportunityTargeting>(emptyTargeting);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSocials, setSavingSocials] = useState(false);
  const [savingAudience, setSavingAudience] = useState(false);
  const [savingTargeting, setSavingTargeting] = useState(false);

  useEffect(() => {
    fetchMe().then((u) => {
      setBio(u.creator?.bio ?? "");
      setAccent(u.creator?.accent_color ?? "#2563eb");
      const links = (u.creator?.social_links ?? {}) as Record<string, unknown>;
      const known: Partial<Record<SocialKey, string>> = {};
      const rest: Record<string, string> = {};
      for (const [k, v] of Object.entries(links)) {
        if (typeof v !== "string" || !v.trim()) continue;
        if (SOCIAL_PLATFORMS.some((p) => p.key === k)) known[k as SocialKey] = v;
        else rest[k] = v;
      }
      setSocials(known);
      setOtherLinks(rest);
    });
    fetchCreatorJobPreferences()
      .then((prefs) => {
        setTargeting({
          ...emptyTargeting(),
          ...(prefs.opportunity_targeting ?? {}),
        });
      })
      .catch(() => setTargeting(emptyTargeting()));
  }, []);

  const onSocialChange = (key: SocialKey, value: string) =>
    setSocials((prev) => ({ ...prev, [key]: value }));

  const buildSocialLinks = (keys: SocialKey[]) => {
    const social_links: Record<string, string> = { ...otherLinks };
    for (const p of SOCIAL_PLATFORMS) {
      const raw = socials[p.key]?.trim();
      if (!raw) continue;
      if (!keys.includes(p.key)) {
        social_links[p.key] = raw;
        continue;
      }
      const url = normalizeSocialUrl(p.key, raw);
      if (!url) {
        toast.error(`Enter a valid ${p.label} link.`);
        return null;
      }
      social_links[p.key] = url;
    }
    return social_links;
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateCreatorProfile({
        bio,
        accent_color: accent,
      });
      toast.success("Profile saved.");
    } catch {
      toast.error("Could not save profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  const saveSocialLinks = async (
    keys: SocialKey[],
    setBusy: (v: boolean) => void,
    okMsg: string,
  ) => {
    const social_links = buildSocialLinks(keys);
    if (!social_links) return;
    setBusy(true);
    try {
      await updateCreatorProfile({ social_links });
      toast.success(okMsg);
    } catch {
      toast.error("Could not save links. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const saveTargeting = async () => {
    setSavingTargeting(true);
    try {
      await updateCreatorJobPreferences({
        opportunity_targeting: targeting,
      });
      toast.success("Industry & keywords saved.");
    } catch {
      toast.error("Could not save industry & keywords.");
    } finally {
      setSavingTargeting(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
          Account
        </p>
        <h1 className="mt-1 text-3xl font-bold">Settings</h1>
      </div>

      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold">Public profile</h2>
          <label className="mt-4 block text-sm font-semibold">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
          />
          <label className="mt-4 block text-sm font-semibold">Accent color</label>
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="mt-1 h-10 w-20"
          />
          <button
            type="button"
            onClick={saveProfile}
            disabled={savingProfile}
            className="mt-6 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {savingProfile ? "Saving…" : "Save profile"}
          </button>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold">Industry & keywords</h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose industries and keywords. Job counts show for each selection.
          </p>
          <div className="mt-4">
            <IndustryKeywordSelect
              industry={targeting.industry}
              keywords={targeting.keywords}
              onIndustryChange={(industry) =>
                setTargeting((t) => ({ ...t, industry }))
              }
              onKeywordsChange={(keywords) =>
                setTargeting((t) => ({ ...t, keywords }))
              }
            />
          </div>
          <button
            type="button"
            onClick={saveTargeting}
            disabled={savingTargeting}
            className="mt-4 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {savingTargeting ? "Saving…" : "Save industry & keywords"}
          </button>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold">Profile socials</h2>
          <p className="mt-1 text-sm text-slate-500">
            LinkedIn, Instagram, and YouTube show on your public creator card.
          </p>
          <SocialLinksFields
            values={socials}
            onChange={onSocialChange}
            keys={PROFILE_SOCIALS}
          />
          <button
            type="button"
            onClick={() =>
              void saveSocialLinks(
                PROFILE_SOCIALS,
                setSavingSocials,
                "Profile socials saved.",
              )
            }
            disabled={savingSocials}
            className="mt-6 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {savingSocials ? "Saving…" : "Save profile socials"}
          </button>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold">Audience channels</h2>
          <p className="mt-1 text-sm text-slate-500">
            TikTok, Telegram, and WhatsApp help match how you reach your
            audience.
          </p>
          <SocialLinksFields
            values={socials}
            onChange={onSocialChange}
            keys={AUDIENCE_SOCIALS}
          />
          <button
            type="button"
            onClick={() =>
              void saveSocialLinks(
                AUDIENCE_SOCIALS,
                setSavingAudience,
                "Audience channels saved.",
              )
            }
            disabled={savingAudience}
            className="mt-6 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {savingAudience ? "Saving…" : "Save audience channels"}
          </button>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold">Job preferences</h2>
          <p className="mt-1 text-sm text-slate-500">
            Salary, work mode, countries, and more live on job preferences.
          </p>
          <Link
            href="/creator/job-preferences"
            className="mt-4 inline-block rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-[#172b63]"
          >
            Edit job preferences
          </Link>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold">Payout account</h2>
          <p className="mt-1 text-sm text-slate-500">
            Account type: <strong>Creator</strong>. Add UPI, a bank account, or
            PayPal so earnings can be paid out.
          </p>
          <Link
            href="/creator/payout"
            className="mt-4 inline-block rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white"
          >
            Set up payout account
          </Link>
        </section>
      </div>
    </>
  );
}
