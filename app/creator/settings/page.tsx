"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchMe } from "@/lib/api/auth";
import { fetchNiches, updateCreatorProfile } from "@/lib/api/creator";
import NicheSearch from "@/components/jobs/NicheSearch";

export default function CreatorSettingsPage() {
  const [bio, setBio] = useState("");
  const [accent, setAccent] = useState("#2563eb");
  const [nicheIds, setNicheIds] = useState<number[]>([]);
  const [niches, setNicheIdsList] = useState<Array<{ id: number; name: string }>>(
    [],
  );
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchNiches().then((n) => setNicheIdsList(n));
    fetchMe().then((u) => {
      setBio(u.creator?.bio ?? "");
      setAccent(u.creator?.accent_color ?? "#2563eb");
      if (u.creator?.niches?.length) {
        setNicheIds(u.creator.niches.map((n) => n.id));
      }
    });
  }, []);

  const saveProfile = async () => {
    setMsg(null);
    try {
      await updateCreatorProfile({
        bio,
        accent_color: accent,
        niche_ids: nicheIds.length ? nicheIds : undefined,
      });
      setMsg("Profile saved.");
    } catch {
      setMsg("Could not save profile.");
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

      {msg ? (
        <p className="mb-4 rounded-xl bg-purple-50 px-4 py-2 text-sm text-purple-800">
          {msg}
        </p>
      ) : null}

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
          <button
            type="button"
            onClick={saveProfile}
            className="mt-6 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white"
          >
            Save profile
          </button>
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
