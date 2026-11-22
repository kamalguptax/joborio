"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchMe } from "@/lib/api/auth";
import { fetchNiches, updateCreatorProfile } from "@/lib/api/creator";
import NicheSearch from "@/components/jobs/NicheSearch";
import { toast } from "@/components/ui/Toast";
import SocialLinksFields from "@/components/creators/SocialLinksFields";
import { SOCIAL_PLATFORMS, normalizeSocialUrl, type SocialKey } from "@/lib/socialLinks";

export default function CreatorSettingsPage() {
  const [bio, setBio] = useState("");
  const [accent, setAccent] = useState("#2563eb");
  const [nicheIds, setNicheIds] = useState<number[]>([]);
  const [socials, setSocials] = useState<Partial<Record<SocialKey, string>>>({});
  // Links the form has no field for (community, website) are kept as they are.
  const [otherLinks, setOtherLinks] = useState<Record<string, string>>({});
  const [niches, setNicheIdsList] = useState<Array<{ id: number; name: string }>>(
    [],
  );

  useEffect(() => {
    fetchNiches().then((n) => setNicheIdsList(n));
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
      if (u.creator?.niches?.length) {
        setNicheIds(u.creator.niches.map((n) => n.id));
      }
    });
  }, []);

  const saveProfile = async () => {
    const social_links: Record<string, string> = { ...otherLinks };
    for (const p of SOCIAL_PLATFORMS) {
      const raw = socials[p.key]?.trim();
      if (!raw) continue;
      const url = normalizeSocialUrl(p.key, raw);
      if (!url) {
        toast.error(`Enter a valid ${p.label} link.`);
        return;
      }
      social_links[p.key] = url;
    }
    try {
      await updateCreatorProfile({
        bio,
        accent_color: accent,
        social_links,
        niche_ids: nicheIds.length ? nicheIds : undefined,
      });
      toast.success("Profile saved.");
    } catch {
      toast.error("Could not save profile. Please try again.");
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
          <div className="mt-4">
            <NicheSearch
              niches={niches}
              selectedIds={nicheIds}
              onToggle={(id) =>
                setNicheIds((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                )
              }
            />
          </div>
          <SocialLinksFields
            values={socials}
            onChange={(key, value) => setSocials((prev) => ({ ...prev, [key]: value }))}
          />
          <button
            type="button"
            onClick={saveProfile}
            className="mt-6 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white"
          >
            Save profile
          </button>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold">Job preferences</h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose skills, job types, and countries so campaigns and XML jobs
            match your audience.
          </p>
          <Link
            href="/creator/job-preferences"
            className="mt-4 inline-block rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white"
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
