"use client";

import { useEffect, useState } from "react";
import { fetchNiches } from "@/lib/api/creator";
import NicheSearch from "@/components/jobs/NicheSearch";
import PromoteJobTypes from "@/components/jobs/PromoteJobTypes";
import { readPromoteJobTypes, savePromoteJobTypes } from "@/lib/jobs/promoteTypes";

const COUNTRY_OPTIONS = [
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "CA", label: "Canada" },
  { code: "IN", label: "India" },
  { code: "AU", label: "Australia" },
  { code: "DE", label: "Germany" },
];

export type JobPreferencesValues = {
  niche_ids: number[];
  countries: string[];
  remoteOnly: boolean;
  job_types: string[];
};

type Props = {
  initial: JobPreferencesValues;
  remoteLabel: string;
  onSave: (values: JobPreferencesValues) => Promise<void>;
  onJobTypesChange?: (types: string[]) => void;
};

export default function JobPreferencesForm({
  initial,
  remoteLabel,
  onSave,
  onJobTypesChange,
}: Props) {
  const [nicheIds, setNicheIds] = useState<number[]>(initial.niche_ids);
  const [countries, setCountries] = useState<string[]>(initial.countries);
  const [remoteOnly, setRemoteOnly] = useState(initial.remoteOnly);
  const [jobTypes, setJobTypes] = useState<string[]>(initial.job_types);
  const [niches, setNiches] = useState<Array<{ id: number; name: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const stored = initial.job_types.length ? initial.job_types : readPromoteJobTypes();
    setNicheIds(initial.niche_ids);
    setCountries(initial.countries);
    setRemoteOnly(initial.remoteOnly);
    setJobTypes(stored);
    onJobTypesChange?.(stored);
  }, [initial]);

  useEffect(() => {
    fetchNiches().then(setNiches).catch(() => setNiches([]));
  }, []);

  const toggleCountry = (code: string) => {
    setCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nicheIds.length === 0 && jobTypes.length === 0) {
      setMsg("Pick at least one skill niche or job type to promote.");
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await onSave({ niche_ids: nicheIds, countries, remoteOnly, job_types: jobTypes });
      savePromoteJobTypes(jobTypes);
      setMsg("Preferences saved. Your job feed is updated.");
    } catch {
      setMsg("Could not save preferences. Check you are signed in as a creator.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-bold">Job preferences</h2>
      <p className="mt-1 text-sm text-slate-500">
        We use these to show matching marketplace jobs on your dashboard.
      </p>

      {msg ? (
        <p className="mt-4 rounded-xl bg-purple-50 px-4 py-2 text-sm text-purple-800">
          {msg}
        </p>
      ) : null}

      <div className="mt-6">
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

      <div className="mt-6">
        <PromoteJobTypes
          selected={jobTypes}
          onToggle={(id) =>
            setJobTypes((prev) => {
              const next = prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id];
              onJobTypesChange?.(next);
              return next;
            })
          }
        />
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold">Countries (optional)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {COUNTRY_OPTIONS.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => toggleCountry(c.code)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                countries.includes(c.code)
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-6 flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={remoteOnly}
          onChange={(e) => setRemoteOnly(e.target.checked)}
        />
        {remoteLabel}
      </label>

      <button
        type="submit"
        disabled={saving}
        className="mt-6 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save preferences"}
      </button>
    </form>
  );
}
