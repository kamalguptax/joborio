"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchNiches } from "@/lib/api/creator";
import NicheSearch from "@/components/jobs/NicheSearch";
import PromoteJobTypes from "@/components/jobs/PromoteJobTypes";
import { readPromoteJobTypes, savePromoteJobTypes } from "@/lib/jobs/promoteTypes";
import {
  CURRENCIES,
  EXPERIENCE_LEVELS,
  OPPORTUNITY_CATEGORIES,
  WORK_MODES,
  parseChipInput,
  visiblePreferenceKeys,
  type OpportunityCategoryId,
} from "@/lib/jobs/opportunityTypes";

const COUNTRY_OPTIONS = [
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "CA", label: "Canada" },
  { code: "IN", label: "India" },
  { code: "AU", label: "Australia" },
  { code: "DE", label: "Germany" },
  { code: "AE", label: "UAE" },
];

export type OpportunityTargeting = {
  keywords: string[];
  industry: string[];
  brands: string[];
  audience_type: string[];
  work_mode: string[];
  currency: string;
};

export type OpportunityPreferences = {
  salary_min?: number | null;
  salary_max?: number | null;
  experience: string[];
  duration?: string | null;
  education: string[];
  skills: string[];
};

export type JobPreferencesValues = {
  niche_ids: number[];
  countries: string[];
  remoteOnly: boolean;
  job_types: string[];
  opportunity_categories?: string[];
  opportunity_targeting?: OpportunityTargeting;
  opportunity_preferences?: OpportunityPreferences;
};

const defaultTargeting = (): OpportunityTargeting => ({
  keywords: [],
  industry: [],
  brands: [],
  audience_type: [],
  work_mode: [],
  currency: "USD",
});

const defaultPrefs = (): OpportunityPreferences => ({
  salary_min: null,
  salary_max: null,
  experience: [],
  duration: null,
  education: [],
  skills: [],
});

type Props = {
  initial: JobPreferencesValues;
  remoteLabel: string;
  onSave: (values: JobPreferencesValues) => Promise<void>;
  onJobTypesChange?: (types: string[]) => void;
};

const chip =
  "rounded-full px-3 py-1.5 text-xs font-semibold transition";
const chipOn = "bg-indigo-600 text-white";
const chipOff = "bg-slate-100 text-slate-600 hover:bg-slate-200";
const field =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#172b63] outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10";

function ChipInput({
  label,
  hint,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const next = [...values];
    for (const item of parseChipInput(draft)) {
      if (!next.includes(item)) next.push(item);
    }
    onChange(next.slice(0, 40));
    setDraft("");
  };

  return (
    <label className="block text-sm font-semibold text-[#0F1B3D]">
      {label}
      {hint ? <span className="ml-1 font-normal text-slate-400">{hint}</span> : null}
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(values.filter((x) => x !== v))}
            className={`${chip} ${chipOn}`}
          >
            {v} ×
          </button>
        ))}
      </div>
      <input
        className={field}
        value={draft}
        placeholder={placeholder ?? "Type and press Enter"}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
      />
    </label>
  );
}

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
  const [categories, setCategories] = useState<string[]>(
    initial.opportunity_categories ?? [],
  );
  const [targeting, setTargeting] = useState<OpportunityTargeting>(
    initial.opportunity_targeting ?? defaultTargeting(),
  );
  const [prefs, setPrefs] = useState<OpportunityPreferences>(
    initial.opportunity_preferences ?? defaultPrefs(),
  );
  const [niches, setNiches] = useState<Array<{ id: number; name: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const visibleKeys = useMemo(
    () => visiblePreferenceKeys(categories),
    [categories],
  );

  useEffect(() => {
    const stored = initial.job_types.length
      ? initial.job_types
      : readPromoteJobTypes();
    setNicheIds(initial.niche_ids);
    setCountries(initial.countries);
    setRemoteOnly(initial.remoteOnly);
    setJobTypes(stored);
    setCategories(initial.opportunity_categories ?? []);
    setTargeting(initial.opportunity_targeting ?? defaultTargeting());
    setPrefs(initial.opportunity_preferences ?? defaultPrefs());
    onJobTypesChange?.(stored);
  }, [initial]);

  useEffect(() => {
    fetchNiches().then(setNiches).catch(() => setNiches([]));
  }, []);

  const toggleCategory = (id: OpportunityCategoryId) => {
    setCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleCountry = (code: string) => {
    setCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const toggleIn = (
    list: string[],
    id: string,
    setter: (next: string[]) => void,
  ) => {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      nicheIds.length === 0 &&
      jobTypes.length === 0 &&
      categories.length === 0
    ) {
      setMsg("Pick at least one opportunity category, niche, or job type.");
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const nextRemote =
        remoteOnly ||
        targeting.work_mode.includes("remote") ||
        targeting.work_mode.includes("work_from_home");
      await onSave({
        niche_ids: nicheIds,
        countries,
        remoteOnly: nextRemote,
        job_types: jobTypes,
        opportunity_categories: categories,
        opportunity_targeting: targeting,
        opportunity_preferences: prefs,
      });
      savePromoteJobTypes(jobTypes);
      setMsg("Opportunity preferences saved.");
    } catch {
      setMsg("Could not save preferences. Check you are signed in as a creator.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="font-bold">Opportunity preferences</h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose what you promote. Preference filters adapt to your categories —
          course-only creators won&apos;t see job salary filters, and job-only
          creators won&apos;t see course duration filters.
        </p>
      </div>

      {msg ? (
        <p className="rounded-xl bg-purple-50 px-4 py-2 text-sm text-purple-800">
          {msg}
        </p>
      ) : null}

      {/* 01 Opportunity Categories */}
      <section>
        <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
          01 · Opportunity categories
        </p>
        <p className="mt-1 text-sm font-semibold text-[#0F1B3D]">
          What do you want to promote?
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {OPPORTUNITY_CATEGORIES.map((cat) => {
            const on = categories.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`${chip} ${on ? chipOn : chipOff}`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 02 Search & Targeting */}
      <section className="border-t border-slate-100 pt-6">
        <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
          02 · Search & targeting
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ChipInput
            label="Keywords"
            values={targeting.keywords}
            onChange={(keywords) => setTargeting((t) => ({ ...t, keywords }))}
            placeholder="e.g. React, product manager"
          />
          <ChipInput
            label="Industry"
            values={targeting.industry}
            onChange={(industry) => setTargeting((t) => ({ ...t, industry }))}
            placeholder="e.g. Fintech, EdTech"
          />
          <ChipInput
            label="Brands / Employer"
            values={targeting.brands}
            onChange={(brands) => setTargeting((t) => ({ ...t, brands }))}
            placeholder="e.g. Google, Coursera"
          />
          <label className="block text-sm font-semibold text-[#0F1B3D]">
            Currency
            <select
              className={field}
              value={targeting.currency}
              onChange={(e) =>
                setTargeting((t) => ({ ...t, currency: e.target.value }))
              }
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold">Audience type · experience level</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXPERIENCE_LEVELS.map((lvl) => {
              const on = targeting.audience_type.includes(lvl.id);
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() =>
                    toggleIn(targeting.audience_type, lvl.id, (audience_type) =>
                      setTargeting((t) => ({ ...t, audience_type })),
                    )
                  }
                  className={`${chip} ${on ? chipOn : chipOff}`}
                >
                  {lvl.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold">Work mode</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {WORK_MODES.map((mode) => {
              const on = targeting.work_mode.includes(mode.id);
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() =>
                    toggleIn(targeting.work_mode, mode.id, (work_mode) =>
                      setTargeting((t) => ({ ...t, work_mode })),
                    )
                  }
                  className={`${chip} ${on ? chipOn : chipOff}`}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold">Country</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {COUNTRY_OPTIONS.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => toggleCountry(c.code)}
                className={`${chip} ${
                  countries.includes(c.code) ? chipOn : chipOff
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 03 Opportunity Preferences — dynamic */}
      <section className="border-t border-slate-100 pt-6">
        <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
          03 · Opportunity preferences
        </p>
        {categories.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Select opportunity categories above to unlock matching filters
            (salary for jobs, duration for courses, and so on).
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {visibleKeys.includes("salary") ? (
              <>
                <label className="block text-sm font-semibold">
                  Salary min ({targeting.currency})
                  <input
                    type="number"
                    min={0}
                    className={field}
                    value={prefs.salary_min ?? ""}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        salary_min: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Salary max ({targeting.currency})
                  <input
                    type="number"
                    min={0}
                    className={field}
                    value={prefs.salary_max ?? ""}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        salary_max: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                  />
                </label>
              </>
            ) : null}

            {visibleKeys.includes("experience") ? (
              <div className="sm:col-span-2">
                <p className="text-sm font-semibold">Experience</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {EXPERIENCE_LEVELS.map((lvl) => {
                    const on = prefs.experience.includes(lvl.id);
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() =>
                          toggleIn(prefs.experience, lvl.id, (experience) =>
                            setPrefs((p) => ({ ...p, experience })),
                          )
                        }
                        className={`${chip} ${on ? chipOn : chipOff}`}
                      >
                        {lvl.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {visibleKeys.includes("duration") ? (
              <label className="block text-sm font-semibold sm:col-span-2">
                Duration
                <input
                  className={field}
                  placeholder="e.g. 6 weeks, 3 months, weekend"
                  value={prefs.duration ?? ""}
                  onChange={(e) =>
                    setPrefs((p) => ({
                      ...p,
                      duration: e.target.value || null,
                    }))
                  }
                />
              </label>
            ) : null}

            {visibleKeys.includes("education") ? (
              <div className="sm:col-span-2">
                <ChipInput
                  label="Education"
                  values={prefs.education}
                  onChange={(education) =>
                    setPrefs((p) => ({ ...p, education }))
                  }
                  placeholder="e.g. Bachelor, Bootcamp graduate"
                />
              </div>
            ) : null}

            {visibleKeys.includes("skills") ? (
              <div className="sm:col-span-2">
                <ChipInput
                  label="Skills"
                  values={prefs.skills}
                  onChange={(skills) => setPrefs((p) => ({ ...p, skills }))}
                  placeholder="e.g. Python, UX writing"
                />
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* Legacy niches + employment types */}
      <section className="border-t border-slate-100 pt-6">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Niches & employment types
        </p>
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
        <div className="mt-6">
          <PromoteJobTypes
            legend="Employment type (for job listings)"
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
        <label className="mt-6 flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={remoteOnly}
            onChange={(e) => setRemoteOnly(e.target.checked)}
          />
          {remoteLabel}
        </label>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save preferences"}
      </button>
    </form>
  );
}
