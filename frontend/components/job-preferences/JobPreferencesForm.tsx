"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchNiches } from "@/lib/api/creator";
import NicheSearch from "@/components/jobs/NicheSearch";
import IndustryKeywordSelect from "@/components/job-preferences/IndustryKeywordSelect";
import { toast } from "@/components/ui/Toast";
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

const SALARY_RANGE_MIN = 0;
const SALARY_RANGE_MAX = 200_000;
const SALARY_RANGE_STEP = 1_000;

function clampSalary(n: number): number {
  return Math.min(
    SALARY_RANGE_MAX,
    Math.max(SALARY_RANGE_MIN, Math.round(n / SALARY_RANGE_STEP) * SALARY_RANGE_STEP),
  );
}

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

  const visibleKeys = useMemo(
    () => visiblePreferenceKeys(categories),
    [categories],
  );

  useEffect(() => {
    const stored = (initial.job_types.length
      ? initial.job_types
      : readPromoteJobTypes()
    ).filter((id) => id !== "remote" && id !== "work_from_home");
    const baseTargeting = initial.opportunity_targeting ?? defaultTargeting();
    const modes = baseTargeting.work_mode
      .map((m) => (m === "work_from_home" ? "remote" : m))
      .filter((m, i, arr) => arr.indexOf(m) === i);
    const hadRemoteEmployment =
      initial.job_types.includes("remote") ||
      initial.job_types.includes("work_from_home");
    setNicheIds(initial.niche_ids);
    setCountries(initial.countries);
    setRemoteOnly(
      initial.remoteOnly || hadRemoteEmployment || modes.includes("remote"),
    );
    setJobTypes(stored);
    setCategories(initial.opportunity_categories ?? []);
    setTargeting({ ...baseTargeting, work_mode: modes });
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
      toast.error("Pick at least one opportunity category, niche, or job type.");
      return;
    }
    setSaving(true);
    try {
      const cleanedModes = targeting.work_mode
        .map((m) => (m === "work_from_home" ? "remote" : m))
        .filter((m, i, arr) => arr.indexOf(m) === i);
      const nextRemote = remoteOnly || cleanedModes.includes("remote");
      const cleanedJobTypes = jobTypes.filter(
        (id) => id !== "remote" && id !== "work_from_home",
      );
      await onSave({
        niche_ids: nicheIds,
        countries,
        remoteOnly: nextRemote,
        job_types: cleanedJobTypes,
        opportunity_categories: categories,
        opportunity_targeting: { ...targeting, work_mode: cleanedModes },
        opportunity_preferences: prefs,
      });
      savePromoteJobTypes(cleanedJobTypes);
      toast.success("Opportunity preferences saved.");
    } catch {
      toast.error("Could not save preferences. Please try again.");
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

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
              <div className="sm:col-span-2">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <p className="text-sm font-semibold">
                    Salary range ({targeting.currency})
                  </p>
                  <p className="text-xs font-semibold tabular-nums text-violet-700">
                    {Number(prefs.salary_min ?? SALARY_RANGE_MIN).toLocaleString()}{" "}
                    –{" "}
                    {Number(
                      prefs.salary_max ?? SALARY_RANGE_MAX,
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="relative mt-5 h-6">
                  <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-200" />
                  <div
                    className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600"
                    style={{
                      left: `${
                        ((Number(prefs.salary_min ?? SALARY_RANGE_MIN) -
                          SALARY_RANGE_MIN) /
                          (SALARY_RANGE_MAX - SALARY_RANGE_MIN)) *
                        100
                      }%`,
                      right: `${
                        100 -
                        ((Number(prefs.salary_max ?? SALARY_RANGE_MAX) -
                          SALARY_RANGE_MIN) /
                          (SALARY_RANGE_MAX - SALARY_RANGE_MIN)) *
                          100
                      }%`,
                    }}
                  />
                  <input
                    type="range"
                    min={SALARY_RANGE_MIN}
                    max={SALARY_RANGE_MAX}
                    step={SALARY_RANGE_STEP}
                    value={Number(prefs.salary_min ?? SALARY_RANGE_MIN)}
                    onChange={(e) => {
                      const next = clampSalary(Number(e.target.value));
                      setPrefs((p) => {
                        const max = Number(p.salary_max ?? SALARY_RANGE_MAX);
                        return {
                          ...p,
                          salary_min: next,
                          salary_max: next > max ? next : p.salary_max ?? SALARY_RANGE_MAX,
                        };
                      });
                    }}
                    className="pointer-events-none absolute inset-0 z-20 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-20 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600"
                    aria-label="Salary minimum"
                  />
                  <input
                    type="range"
                    min={SALARY_RANGE_MIN}
                    max={SALARY_RANGE_MAX}
                    step={SALARY_RANGE_STEP}
                    value={Number(prefs.salary_max ?? SALARY_RANGE_MAX)}
                    onChange={(e) => {
                      const next = clampSalary(Number(e.target.value));
                      setPrefs((p) => {
                        const min = Number(p.salary_min ?? SALARY_RANGE_MIN);
                        return {
                          ...p,
                          salary_max: next,
                          salary_min: next < min ? next : p.salary_min ?? SALARY_RANGE_MIN,
                        };
                      });
                    }}
                    className="pointer-events-none absolute inset-0 z-30 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-violet-600 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-30 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-600"
                    aria-label="Salary maximum"
                  />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">
                    Salary min ({targeting.currency})
                    <input
                      type="number"
                      min={SALARY_RANGE_MIN}
                      max={SALARY_RANGE_MAX}
                      step={SALARY_RANGE_STEP}
                      className={field}
                      value={prefs.salary_min ?? ""}
                      onChange={(e) => {
                        if (!e.target.value) {
                          setPrefs((p) => ({ ...p, salary_min: null }));
                          return;
                        }
                        const next = clampSalary(Number(e.target.value));
                        setPrefs((p) => {
                          const max = Number(p.salary_max ?? SALARY_RANGE_MAX);
                          return {
                            ...p,
                            salary_min: next,
                            salary_max:
                              p.salary_max != null && next > max ? next : p.salary_max,
                          };
                        });
                      }}
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Salary max ({targeting.currency})
                    <input
                      type="number"
                      min={SALARY_RANGE_MIN}
                      max={SALARY_RANGE_MAX}
                      step={SALARY_RANGE_STEP}
                      className={field}
                      value={prefs.salary_max ?? ""}
                      onChange={(e) => {
                        if (!e.target.value) {
                          setPrefs((p) => ({ ...p, salary_max: null }));
                          return;
                        }
                        const next = clampSalary(Number(e.target.value));
                        setPrefs((p) => {
                          const min = Number(p.salary_min ?? SALARY_RANGE_MIN);
                          return {
                            ...p,
                            salary_max: next,
                            salary_min:
                              p.salary_min != null && next < min ? next : p.salary_min,
                          };
                        });
                      }}
                    />
                  </label>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Drag the range or type exact amounts (0 –{" "}
                  {SALARY_RANGE_MAX.toLocaleString()} {targeting.currency}).
                </p>
              </div>
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
