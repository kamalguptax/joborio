"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createEmployerProgram } from "@/lib/api/employer";
import { ApiClientError } from "@/lib/api/client";
import {
  ASSET_BUTTONS,
  AUDIENCE_FIELDS,
  AUDIENCE_TYPES,
  BUDGET_FIELDS,
  CATEGORY_FIELD_SCHEMA,
  CONVERSION_MODELS,
  DEFAULT_WIZARD_FORM,
  GUIDELINE_FIELDS,
  PRICING_BENCH,
  QUALITY_FIELDS,
  QUALITY_TOGGLES,
  REJECTION_REASONS,
  TRACKING_FIELDS,
  TRACKING_INTEGRATIONS,
  WIZARD_CATEGORIES,
  WIZARD_STEPS,
  brandInr,
  fieldLabel,
  joinMultiValue,
  parseFieldSpec,
  splitMultiValue,
  type CatFieldSpec,
  type ModelKey,
} from "@/lib/employer/brandPortalSample";
import {
  validateWizardStep,
  validateWizardSubmit,
  type FieldErrors,
} from "@/lib/employer/brandCampaignValidation";
import MultiSelect from "@/components/ui/MultiSelect";
import { toast } from "@/components/ui/Toast";

const fieldOk =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#0F1B3D] outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10";
const fieldBad =
  "mt-1 w-full rounded-xl border border-rose-400 bg-rose-50 px-3 py-2.5 text-sm font-medium text-[#0F1B3D] outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10";

const REQUIRED_BY_STEP: Record<number, string[]> = {
  1: ["Campaign name"],
  2: ["Country"],
  5: ["Total budget", "Daily budget", "Start date", "End date"],
  6: [
    "Mandatory lead fields",
    "Duplicate policy",
    "Existing applicant policy",
    "Allowed conversion window",
  ],
  7: ["Destination URL", "Conversion event name"],
  8: ["Approved campaign description", "Key selling points"],
};

function mapPricing(model: ModelKey): "ppc" | "ppr" | "ppa" | "ppe" {
  if (model === "ppc" || model === "cpm") return "ppc";
  if (model === "ppr") return "ppr";
  if (model === "cpa") return "ppa";
  return "ppa";
}

function mapPromo(
  cat: string,
): "job" | "course" | "tool" | "branding" | "other" {
  if (cat === "Jobs") return "job";
  if (cat === "Courses" || cat === "Bootcamps") return "course";
  if (cat === "AI Tools" || cat === "SaaS") return "tool";
  if (cat === "Products") return "branding";
  return "other";
}

function pickDestination(form: Record<string, string>, cat: string): string {
  const keys = [
    "Destination URL",
    "Application URL",
    "Course URL",
    "Product URL",
    "Landing URL",
    "Landing page URL",
  ];
  for (const k of keys) {
    const v = (form[k] || "").trim();
    if (v.startsWith("https://")) return v;
  }
  if (cat === "Jobs") return (form["Application URL"] || "").trim();
  return (form["Destination URL"] || "https://").trim();
}

function DynamicFields({
  specs,
  form,
  setForm,
  fieldErrors,
  requiredLabels,
}: {
  specs: CatFieldSpec[];
  form: Record<string, string>;
  setForm: (key: string, value: string) => void;
  fieldErrors: FieldErrors;
  requiredLabels?: string[];
}) {
  const required = new Set(requiredLabels ?? []);
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {specs.map((spec) => {
        const parsed = parseFieldSpec(spec);
        const wide =
          parsed.kind === "area" || parsed.kind === "multi"
            ? "sm:col-span-2"
            : "";
        const err = fieldErrors[parsed.label];
        const cls = err ? fieldBad : fieldOk;
        return (
          <div
            key={parsed.label}
            className={`block text-xs font-semibold uppercase tracking-wide text-slate-400 ${wide}`}
          >
            <span className="block">
              {parsed.label}
              {required.has(parsed.label) ? (
                <span className="text-rose-500"> *</span>
              ) : null}
            </span>
            {parsed.kind === "multi" ? (
              <MultiSelect
                options={(parsed.options ?? []).map((o) => ({
                  value: o,
                  label: o,
                }))}
                value={splitMultiValue(form[parsed.label])}
                onChange={(next) =>
                  setForm(parsed.label, joinMultiValue(next))
                }
                allowCreate
                placeholder={`Search or add ${parsed.label.toLowerCase()}…`}
                searchPlaceholder={`Type to search ${parsed.label.toLowerCase()}…`}
                invalid={Boolean(err)}
              />
            ) : parsed.kind === "area" ? (
              <textarea
                className={cls}
                rows={3}
                value={form[parsed.label] ?? ""}
                onChange={(e) => setForm(parsed.label, e.target.value)}
                aria-invalid={Boolean(err)}
              />
            ) : parsed.kind === "select" ? (
              <select
                className={cls}
                value={form[parsed.label] ?? parsed.options?.[0] ?? ""}
                onChange={(e) => setForm(parsed.label, e.target.value)}
                aria-invalid={Boolean(err)}
              >
                {(parsed.options ?? []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={
                  parsed.kind === "date"
                    ? "date"
                    : /budget|cap|conversions|price/i.test(parsed.label) &&
                        parsed.label !== "Pricing type"
                      ? "number"
                      : "text"
                }
                className={cls}
                value={form[parsed.label] ?? ""}
                onChange={(e) => setForm(parsed.label, e.target.value)}
                placeholder={
                  /url|endpoint/i.test(parsed.label) ? "https://" : undefined
                }
                aria-invalid={Boolean(err)}
              />
            )}
            {err ? (
              <span className="mt-1 block text-[11px] font-medium normal-case tracking-normal text-rose-600">
                {err}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function BrandCampaignWizard({
  canGoLive,
  billingMissing,
}: {
  canGoLive: boolean;
  billingMissing: string[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [cat, setCat] = useState("");
  const [form, setFormState] = useState<Record<string, string>>({
    ...DEFAULT_WIZARD_FORM,
  });
  const [aud, setAud] = useState<Record<string, boolean>>({
    "Job seekers": true,
  });
  const [model, setModel] = useState<ModelKey>("ppr");
  const [price, setPrice] = useState("");
  const [overrideLow, setOverrideLow] = useState(false);
  const [tg, setTg] = useState<Record<string, boolean>>({
    email: true,
    otp: false,
    crm: false,
    appcomp: true,
  });
  const [integ, setInteg] = useState("link");
  const [testRes, setTestRes] = useState<"" | "ok" | "fail">("");
  const [assets, setAssets] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errs, setErrs] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const setForm = (key: string, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const pickCat = (id: string) => {
    const oldSpec = CATEGORY_FIELD_SCHEMA[cat] ?? [];
    const next = { ...form };
    for (const sp of oldSpec) {
      delete next[fieldLabel(sp)];
    }
    // Keep shared defaults; clear only category-private keys above
    setCat(id);
    setFormState(next);
    setErrs([]);
    setFieldErrors({});
  };

  const requiredForStep1 = useMemo(() => {
    const labels = ["Campaign name"];
    const spec = CATEGORY_FIELD_SCHEMA[cat] ?? [];
    if (spec[0]) labels.push(fieldLabel(spec[0]));
    for (const key of [
      "Application URL",
      "Course URL",
      "Product URL",
      "Landing URL",
    ]) {
      if (spec.some((sp) => fieldLabel(sp) === key)) labels.push(key);
    }
    return labels;
  }, [cat]);

  const validationCtx = useMemo(
    () => ({
      cat,
      form,
      audSel: Object.keys(aud).filter((k) => aud[k]),
      model,
      priceN: Number(price) || 0,
      overrideLow,
      integ,
      confirm,
      tg,
    }),
    [aud, cat, confirm, form, integ, model, overrideLow, price, tg],
  );

  const mdl = CONVERSION_MODELS[model];
  const bench = PRICING_BENCH[model];
  const priceN = Number(price) || 0;
  const budget = Number(form["Total budget"]) || 0;
  const daily = Number(form["Daily budget"]) || 0;
  const audSel = Object.keys(aud).filter((k) => aud[k]);
  const needAck = priceN > 0 && priceN < bench[1];

  const pricingIntel = useMemo(() => {
    const fmt = (a: number, b: number) => `₹${a} to ₹${b}`;
    let verdict = "Within typical to competitive";
    let i1 = "Normal";
    let i2 = "Normal";
    let i3 = "Normal";
    let i4 = "Balanced";
    if (priceN < bench[0]) {
      verdict = "Well below comparable campaigns";
      i1 = "Likely very low participation";
      i2 = "Very low";
      i3 = "Slow, may not deliver";
      i4 = "Low competitiveness";
    } else if (priceN < bench[1]) {
      verdict = "Below the typical range";
      i1 = "Reduced participation";
      i2 = "Below average";
      i3 = "Slower than average";
      i4 = "Less competitive for top partners";
    } else if (priceN > bench[3]) {
      verdict = "Above the competitive range";
      i1 = "High participation";
      i2 = "High";
      i3 = "Fast";
      i4 = "May pay more than needed";
    }
    return {
      low: fmt(bench[0], bench[1]),
      typ: fmt(bench[1], bench[2]),
      comp: fmt(bench[2], bench[3]),
      mine: brandInr.format(priceN),
      verdict,
      i1,
      i2,
      i3,
      i4,
      com: brandInr.format(priceN * 0.2),
      pool: brandInr.format(priceN * 0.8),
      gst: brandInr.format(priceN * 0.18),
    };
  }, [bench, priceN]);

  const est = useMemo(() => {
    const appr = priceN > 0 ? Math.floor(budget / priceN) : 0;
    return {
      appr: appr.toLocaleString("en-IN"),
      raw: Math.ceil(appr / 0.7).toLocaleString("en-IN"),
      spend: brandInr.format(appr * priceN),
      days: daily > 0 ? `${Math.ceil(budget / daily)} days` : "—",
      rec: brandInr.format(priceN * 500),
      range: `${Math.round(appr * 0.75).toLocaleString("en-IN")} to ${Math.round(appr * 1.25).toLocaleString("en-IN")} approved`,
      price: brandInr.format(priceN),
    };
  }, [budget, daily, priceN]);

  const stepFields = useMemo((): CatFieldSpec[] => {
    if (step === 1) {
      const spec = CATEGORY_FIELD_SCHEMA[cat] ?? [];
      return ["Campaign name", ...spec];
    }
    if (step === 2) return AUDIENCE_FIELDS;
    if (step === 5) return BUDGET_FIELDS;
    if (step === 6) return QUALITY_FIELDS;
    if (step === 7) return TRACKING_FIELDS;
    if (step === 8) return GUIDELINE_FIELDS;
    return [];
  }, [cat, step]);

  const applyValidation = (s: number) => {
    const r = validateWizardStep(s, validationCtx);
    setErrs(r.messages);
    setFieldErrors(r.fields);
    return r.messages;
  };

  const next = () => {
    const e = applyValidation(step);
    if (e.length) return;
    setStep((n) => Math.min(9, n + 1));
  };

  const back = () => {
    setErrs([]);
    setFieldErrors({});
    setStep((n) => Math.max(1, n - 1));
  };

  const runTest = () => {
    const dest = form["Destination URL"] || "";
    setTestRes(dest.startsWith("https://") ? "ok" : "fail");
  };

  const buildDescription = () => {
    const parts = [
      form["Approved campaign description"],
      form["Key selling points"],
      form["Job description"],
      form["Course description"],
      form["Description"],
      form["Required disclaimers"],
      form["Prohibited claims"]
        ? `Prohibited: ${form["Prohibited claims"]}`
        : "",
    ].filter(Boolean);
    const catBits = (CATEGORY_FIELD_SCHEMA[cat] ?? [])
      .map((sp) => {
        const lab = fieldLabel(sp);
        const val = form[lab];
        return val ? `${lab}: ${val}` : "";
      })
      .filter(Boolean)
      .slice(0, 12);
    return [...parts, ...catBits].join("\n\n").slice(0, 4000);
  };

  const submit = async (asDraft: boolean) => {
    if (!asDraft) {
      const r = validateWizardSubmit(validationCtx);
      if (r.messages.length) {
        setErrs(r.messages);
        setFieldErrors(r.fields);
        // Jump to the first step that still fails
        for (const st of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
          if (validateWizardStep(st, validationCtx).messages.length) {
            setStep(st);
            break;
          }
        }
        toast.error("Fix the highlighted fields before submitting.");
        return;
      }
    } else if (!(form["Campaign name"] || "").trim()) {
      setErrs(["Campaign name is required to save a draft."]);
      setFieldErrors({ "Campaign name": "Required" });
      setStep(1);
      return;
    }
    setBusy(true);
    try {
      const rawDest = pickDestination(form, cat).trim();
      let destination = rawDest.startsWith("https://")
        ? rawDest
        : rawDest
          ? `https://${rawDest.replace(/^\/+/, "")}`
          : "https://example.com";
      // Laravel url rule rejects bare https://
      if (destination === "https://" || !destination.includes(".")) {
        destination = "https://example.com";
      }

      const countryCode =
        form.Country === "USA"
          ? "US"
          : form.Country === "UK"
            ? "GB"
            : form.Country === "UAE"
              ? "AE"
              : "IN";
      const currency = (form.Currency || "INR").toUpperCase();
      const fx = currency === "USD" ? 1 : 83;
      const rateUsd = Math.max(0.01, (priceN || 0.01) / fx);
      const budgetUsd = Math.max(1, (budget || 1) / fx);
      const dailyUsd = Math.max(0, (daily || 0) / fx);
      const requiredFields = String(form["Mandatory lead fields"] || "")
        .split(/[,|/]/)
        .map((s) => s.trim().toLowerCase().replace(/\s+/g, "_"))
        .filter(Boolean)
        .slice(0, 20);
      const qualificationRules = [
        form["Eligibility requirement"],
        form["Location requirement"],
        form["Experience requirement"],
        form["Duplicate policy"],
        form["Existing applicant policy"],
        form["Allowed conversion window"],
      ]
        .filter(Boolean)
        .join("\n");

      const wizardPayload = {
        version: 1,
        category: cat,
        conversion_model: model,
        conversion_model_label: mdl.label,
        price_inr: priceN,
        budget_inr: budget,
        daily_budget_inr: daily,
        currency,
        override_below_typical: overrideLow,
        audience_types: audSel,
        audience_filters: {
          country: form.Country,
          state: form.State,
          city: form.City,
          industry: form.Industry,
          keywords: form.Keywords,
          skills: form.Skills,
          experience_level: form["Experience level"],
          education: form.Education,
          language: form.Language,
          work_mode: form["Work mode"],
          employment_type: form["Employment type"],
          preferred_intent: form["Preferred audience intent"],
          excluded_locations: form["Excluded locations"],
          excluded_audience: form["Excluded audience categories"],
          mandatory_eligibility: form["Mandatory eligibility requirements"],
        },
        quality: {
          toggles: tg,
          mandatory_lead_fields: form["Mandatory lead fields"],
          duplicate_policy: form["Duplicate policy"],
          existing_applicant_policy: form["Existing applicant policy"],
          conversion_window: form["Allowed conversion window"],
        },
        tracking: {
          integration: integ,
          destination_url: form["Destination URL"],
          allowed_domains: form["Allowed domains"],
          attribution_window: form["Attribution window"],
          conversion_event_name: form["Conversion event name"],
          callback_endpoint: form["Callback endpoint"],
          authentication: form.Authentication,
          test_result: testRes || null,
        },
        budget: {
          total: form["Total budget"],
          daily: form["Daily budget"],
          currency: form.Currency,
          start_date: form["Start date"],
          end_date: form["End date"],
          max_daily_conversions: form["Maximum daily conversions"],
          max_total_conversions: form["Maximum total conversions"],
          daily_click_cap: form["Daily click cap"],
          priority: form.Priority,
          delivery_preference: form["Delivery preference"],
        },
        guidelines: {
          description: form["Approved campaign description"],
          selling_points: form["Key selling points"],
          disclaimers: form["Required disclaimers"],
          prohibited_claims: form["Prohibited claims"],
          promotional_language: form["Required promotional language"],
          landing_page_url: form["Landing page URL"],
          expiry: form["Expiry or deadline information"],
          legal_notes: form["Legal or compliance notes"],
        },
        category_fields: Object.fromEntries(
          (CATEGORY_FIELD_SCHEMA[cat] ?? []).map((sp) => {
            const lab = fieldLabel(sp);
            return [lab, form[lab] ?? ""];
          }),
        ),
        form,
        assets,
        confirm_ownership: confirm,
        submitted_as_draft: asDraft,
      };

      const created = await createEmployerProgram({
        title: (form["Campaign name"] || "Untitled draft").trim(),
        description: buildDescription() || undefined,
        destination_url: destination,
        pricing_model: mapPricing(model),
        promotion_type: mapPromo(cat || "Other"),
        rate_usd: rateUsd,
        budget_total_usd: budgetUsd,
        daily_budget_usd: dailyUsd || undefined,
        currency,
        brand_category: cat || undefined,
        category: cat || undefined,
        conversion_model_code: model,
        wizard_payload: wizardPayload,
        as_draft: asDraft,
        trial_without_ip: asDraft || !canGoLive,
        target_countries: [countryCode],
        country_code: countryCode,
        is_remote: String(form["Work mode"] || "")
          .toLowerCase()
          .includes("remote"),
        lead_type: model === "ppr" ? "registration" : model === "ppl" ? "lead" : model === "ppa" ? "application" : undefined,
        required_fields: requiredFields,
        qualification_rules: qualificationRules || undefined,
        starts_at: form["Start date"] || undefined,
        ends_at: form["End date"] || undefined,
      });
      toast.success(
        asDraft
          ? "Draft saved to database."
          : canGoLive
            ? "Campaign submitted for approval."
            : "Campaign saved. Complete billing to go live.",
      );
      const id = Number(created.program?.id ?? 0);
      router.push(id ? `/employer/programs/${id}` : "/employer/programs");
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Could not create campaign.",
      );
    } finally {
      setBusy(false);
    }
  };

  const review = [
    ["Opportunity", `${cat || "—"}: ${form["Campaign name"] || "—"}`],
    [
      "Audience",
      `${audSel.join(", ") || "—"} in ${form.Country || "—"}${form.City ? `, ${form.City}` : ""}`,
    ],
    ["Conversion model", `${mdl.label} (${mdl.code})`],
    [
      "Price (gross)",
      priceN
        ? `${brandInr.format(priceN)}${needAck ? " (below typical, acknowledged)" : ""}`
        : "—",
    ],
    [
      "Budget",
      `${brandInr.format(budget)} total, ${brandInr.format(daily)} per day`,
    ],
    [
      "Schedule",
      `${form["Start date"] || "—"} to ${form["End date"] || "—"}`,
    ],
    [
      "Quality rules",
      `${tg.email ? "Email verified. " : ""}${tg.otp ? "Phone OTP. " : ""}${form["Duplicate policy"] || ""}`,
    ],
    [
      "Tracking",
      `${TRACKING_INTEGRATIONS.find((i) => i.id === integ)?.label ?? integ} to ${form["Destination URL"] || "—"}`,
    ],
    [
      "Guidelines",
      `${form["Approved campaign description"] ? "Description added. " : "No description. "}${assets.length} asset(s)`,
    ],
  ];

  const prevText = `JobOrio ops sees: ${form["Campaign name"] || "Untitled"}, ${mdl.code} at ${brandInr.format(priceN)}, budget ${brandInr.format(budget)}, targeting ${audSel.join(", ") || "any audience"}. Prohibited claims: ${form["Prohibited claims"] || "none listed"}.`;

  const testLabel =
    testRes === ""
      ? "Not tested"
      : testRes === "ok"
        ? "Passed: 200 OK, event_id evt_test_01 (sample)"
        : "Failed: destination must start with https://";

  const instr = `POST ${form["Callback endpoint"] || "https://your-domain.com/hooks/joborio"}
X-JobOrio-Signature: HMAC-SHA256(secret, raw_body)
X-JobOrio-Timestamp: 2026-11-25T07:30:00Z
{ "event_id":"evt_...", "click_id":"clk_...", "event":"${form["Conversion event name"] || "registration_complete"}" }`;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F1B3D]">Create campaign</h1>
        <p className="mt-1 text-sm text-slate-500">
          Nine-step setup. Fields change by category. JobOrio reviews before
          distribution.
        </p>
        {!canGoLive && billingMissing.length > 0 ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Billing incomplete: {billingMissing.join(", ")}. You can still save a
            draft.
          </p>
        ) : null}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {WIZARD_STEPS.map((label, i) => {
          const n = i + 1;
          const on = step === n;
          const done = step > n;
          return (
            <button
              key={label}
              type="button"
              disabled={!done && !on}
              onClick={() => {
                if (!done && !on) return;
                setErrs([]);
                setFieldErrors({});
                setStep(n);
              }}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                on
                  ? "bg-violet-600 text-white"
                  : done
                    ? "bg-violet-100 text-violet-800 hover:bg-violet-200"
                    : "cursor-not-allowed bg-slate-100 text-slate-500"
              }`}
            >
              {n}. {label}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-[#0F1B3D]">
          Step {step}: {WIZARD_STEPS[step - 1]}
        </h2>

        {errs.length ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {errs.map((e) => (
              <p key={e}>{e}</p>
            ))}
          </div>
        ) : null}

        {/* Step 1: category cards */}
        {step === 1 ? (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {WIZARD_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickCat(c.id)}
                  className={`rounded-2xl border px-3 py-3 text-left ${
                    cat === c.id
                      ? "border-violet-400 bg-violet-50"
                      : "border-slate-200 bg-white hover:border-violet-200"
                  }`}
                >
                  <p className="font-bold text-[#0F1B3D]">{c.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{c.sub}</p>
                </button>
              ))}
            </div>
            {cat ? (
              <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Fields below change with the category you pick. Required:
                campaign name and the first field.
              </p>
            ) : null}
            {cat ? (
              <DynamicFields
                specs={stepFields}
                form={form}
                setForm={setForm}
                fieldErrors={fieldErrors}
                requiredLabels={requiredForStep1}
              />
            ) : null}
          </>
        ) : null}

        {/* Step 2: audience chips + fields */}
        {step === 2 ? (
          <>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Audience type (select all that apply)
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {AUDIENCE_TYPES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAud((prev) => ({ ...prev, [a]: !prev[a] }))}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    aud[a]
                      ? "bg-violet-600 text-white"
                      : "border border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-500">
              These are campaign requirements. They do not select creators or
              publishers.
            </p>
            <DynamicFields
              specs={AUDIENCE_FIELDS}
              form={form}
              setForm={setForm}
              fieldErrors={fieldErrors}
              requiredLabels={REQUIRED_BY_STEP[2]}
            />
          </>
        ) : null}

        {/* Step 3: models */}
        {step === 3 ? (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.keys(CONVERSION_MODELS) as ModelKey[]).map((k) => {
                const disabled = k === "cpm";
                return (
                  <button
                    key={k}
                    type="button"
                    disabled={disabled}
                    title={
                      disabled
                        ? "CPM needs impression tracking (not enabled)"
                        : undefined
                    }
                    onClick={() => {
                      if (disabled) return;
                      setModel(k);
                      setOverrideLow(false);
                      setErrs([]);
                      setFieldErrors({});
                    }}
                    className={`rounded-2xl border px-3 py-3 text-left ${
                      disabled
                        ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60"
                        : model === k
                          ? "border-violet-400 bg-violet-50"
                          : "border-slate-200 hover:border-violet-200"
                    }`}
                  >
                    <p className="font-bold">{CONVERSION_MODELS[k].code}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {CONVERSION_MODELS[k].label}
                      {disabled ? " · Disabled" : ""}
                    </p>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 rounded-xl bg-[#FAFAFE] p-4 text-sm">
              <p className="font-bold text-[#0F1B3D]">{mdl.label} rules</p>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                {[
                  ["Price label", mdl.label],
                  ["Billable event", mdl.bill],
                  ["Conversion requirement", mdl.req],
                  ["Validation", mdl.val],
                  ["Attribution window", mdl.win],
                  ["Rejection policy", mdl.rej],
                  ["Billing event", mdl.be],
                  ["Partner earning", mdl.earn],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs font-semibold uppercase text-slate-400">
                      {k}
                    </dt>
                    <dd className="text-slate-700">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              A submitted registration is never automatically approved or
              billable.
            </p>
          </>
        ) : null}

        {/* Step 4: pricing intelligence */}
        {step === 4 ? (
          <div className="mt-4 space-y-4">
            <label className="block max-w-xs text-xs font-semibold uppercase tracking-wide text-slate-400">
              Your offered price ({mdl.label}), INR
              <span className="text-rose-500"> *</span>
              <input
                type="number"
                min={0}
                step="0.01"
                className={fieldErrors.__price ? fieldBad : fieldOk}
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  setFieldErrors((prev) => {
                    if (!prev.__price) return prev;
                    const next = { ...prev };
                    delete next.__price;
                    return next;
                  });
                }}
                placeholder="e.g. 20"
                aria-invalid={Boolean(fieldErrors.__price)}
              />
              {fieldErrors.__price ? (
                <span className="mt-1 block text-[11px] font-medium normal-case tracking-normal text-rose-600">
                  {fieldErrors.__price}
                </span>
              ) : null}
            </label>
            {priceN > 0 ? (
              <>
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-xl bg-[#FAFAFE] p-4">
                    <h3 className="font-bold text-[#0F1B3D]">
                      Benchmark (estimate)
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold">
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">
                        Low {pricingIntel.low}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                        Typical {pricingIntel.typ}
                      </span>
                      <span className="rounded-full bg-violet-50 px-2 py-0.5 text-violet-700">
                        Competitive {pricingIntel.comp}
                      </span>
                    </div>
                    <dl className="mt-3 grid gap-1 text-sm">
                      {[
                        [
                          "Your price",
                          `${pricingIntel.mine} — ${pricingIntel.verdict}`,
                        ],
                        ["Comparable campaigns", "42 (sample)"],
                        ["Benchmark period", "Last 30 days"],
                        ["Geography", form.Country || "India"],
                        ["Category", cat || "(select category)"],
                        ["Audience", audSel.join(", ") || "Any"],
                        ["Conversion definition", mdl.bill],
                        ["Confidence", "Medium (sample data)"],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-3">
                          <dt className="text-slate-400">{k}</dt>
                          <dd className="text-right font-medium text-[#0F1B3D]">
                            {v}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-2 text-[11px] text-slate-400">
                      Not live. Illustrative sample, not a verified benchmark.
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#FAFAFE] p-4">
                    <h3 className="font-bold text-[#0F1B3D]">Likely impact</h3>
                    <dl className="mt-3 grid gap-1 text-sm">
                      {[
                        ["Partner participation", pricingIntel.i1],
                        ["Distribution volume", pricingIntel.i2],
                        ["Delivery speed", pricingIntel.i3],
                        ["Quality and competition", pricingIntel.i4],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-3">
                          <dt className="text-slate-400">{k}</dt>
                          <dd className="text-right font-medium text-[#0F1B3D]">
                            {v}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <h3 className="font-bold text-[#0F1B3D]">
                    Who gets what (per approved result)
                  </h3>
                  <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                    {[
                      ["Advertiser gross price", pricingIntel.mine],
                      ["JobOrio commission", `${pricingIntel.com} (assumed 20%)`],
                      [
                        "Partner allocation",
                        `${pricingIntel.pool} (remaining 80%)`,
                      ],
                      [
                        "Net partner reward",
                        `${pricingIntel.pool} (before partner-side taxes)`,
                      ],
                      [
                        "GST on advertiser invoice",
                        `${pricingIntel.gst} (assumed 18%, added to your invoice)`,
                      ],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs text-slate-400">{k}</dt>
                        <dd className="font-medium text-[#0F1B3D]">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-2 text-xs text-slate-500">
                    Advertiser pricing and partner payout are separate ledgers.
                    Partners never see your price breakdown.
                  </p>
                </div>
                {needAck ? (
                  <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={overrideLow}
                      onChange={(e) => setOverrideLow(e.target.checked)}
                    />
                    <span>
                      I understand this price is below the typical range and may
                      slow delivery. Continue anyway.
                    </span>
                  </label>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}

        {/* Step 5: budget + estimates */}
        {step === 5 ? (
          <>
            <DynamicFields
              specs={BUDGET_FIELDS}
              form={form}
              setForm={setForm}
              fieldErrors={fieldErrors}
              requiredLabels={REQUIRED_BY_STEP[5]}
            />
            <div className="mt-4 rounded-xl bg-[#FAFAFE] p-4">
              <h3 className="font-bold text-[#0F1B3D]">
                Estimates (not guarantees)
              </h3>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {[
                  ["Estimated approved results", est.appr],
                  ["Estimated raw conversions", est.raw],
                  ["Estimated spend", est.spend],
                  ["Days to exhaust budget", est.days],
                  ["Recommended budget", `${est.rec} (about 500 results)`],
                  ["Expected delivery range", est.range],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-slate-400">{k}</dt>
                    <dd className="font-semibold text-[#0F1B3D]">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-xs text-slate-500">
                Assumptions: 70% approval rate, even pacing, price {est.price}.
                Real delivery depends on partner participation. Budget is
                reserved from wallet on approval, not on submit.
              </p>
            </div>
          </>
        ) : null}

        {/* Step 6: quality */}
        {step === 6 ? (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              {QUALITY_TOGGLES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    setTg((prev) => ({ ...prev, [t.id]: !prev[t.id] }))
                  }
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    tg[t.id]
                      ? "bg-violet-600 text-white"
                      : "border border-slate-200 text-slate-600"
                  }`}
                >
                  {t.label}: {tg[t.id] ? "On" : "Off"}
                </button>
              ))}
            </div>
            <DynamicFields
              specs={QUALITY_FIELDS}
              form={form}
              setForm={setForm}
              fieldErrors={fieldErrors}
              requiredLabels={REQUIRED_BY_STEP[6]}
            />
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Predefined rejection reasons (locked once approved)
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {REJECTION_REASONS.map((r) => (
                  <span
                    key={r}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                  >
                    {r}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                After approval, eligibility rules cannot be edited retroactively.
                A change creates a new rule version that needs JobOrio approval
                and applies only to future conversions.
              </p>
            </div>
          </>
        ) : null}

        {/* Step 7: tracking */}
        {step === 7 ? (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TRACKING_INTEGRATIONS.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => {
                    setInteg(i.id);
                    setTestRes("");
                  }}
                  className={`rounded-2xl border px-3 py-3 text-left ${
                    integ === i.id
                      ? "border-violet-400 bg-violet-50"
                      : "border-slate-200 hover:border-violet-200"
                  }`}
                >
                  <p className="font-bold text-[#0F1B3D]">{i.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{i.sub}</p>
                </button>
              ))}
            </div>
            <DynamicFields
              specs={TRACKING_FIELDS}
              form={form}
              setForm={setForm}
              fieldErrors={fieldErrors}
              requiredLabels={[
                ...(REQUIRED_BY_STEP[7] ?? []),
                ...(["s2s", "capi", "webhook", "crm", "ats", "api"].includes(
                  integ,
                )
                  ? ["Callback endpoint"]
                  : []),
              ]}
            />
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={runTest}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold"
              >
                Send test event
              </button>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  testRes === "ok"
                    ? "bg-emerald-50 text-emerald-700"
                    : testRes === "fail"
                      ? "bg-rose-50 text-rose-700"
                      : "bg-slate-100 text-slate-600"
                }`}
              >
                {testLabel}
              </span>
            </div>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600">
              {instr}
            </pre>
          </>
        ) : null}

        {/* Step 8: guidelines */}
        {step === 8 ? (
          <>
            <DynamicFields
              specs={GUIDELINE_FIELDS}
              form={form}
              setForm={setForm}
              fieldErrors={fieldErrors}
              requiredLabels={REQUIRED_BY_STEP[8]}
            />
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Brand assets (sample upload)
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ASSET_BUTTONS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() =>
                      setAssets((prev) => [
                        ...prev,
                        `${l.toLowerCase().replace(/ /g, "-")}-${prev.length + 1}${l.includes("PDF") ? ".pdf" : ".png"}`,
                      ])
                    }
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
                  >
                    Add {l}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {assets.map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700"
                  >
                    {a}
                  </span>
                ))}
              </div>
              <label
                className={`mt-4 flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
                  fieldErrors.__confirm
                    ? "border-rose-300 bg-rose-50 text-rose-900"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.checked);
                    if (e.target.checked) {
                      setFieldErrors((prev) => {
                        if (!prev.__confirm) return prev;
                        const next = { ...prev };
                        delete next.__confirm;
                        return next;
                      });
                    }
                  }}
                />
                <span>
                  I confirm I have permission to use the submitted content and
                  that the campaign information is accurate.
                  <span className="text-rose-500"> *</span>
                </span>
              </label>
            </div>
          </>
        ) : null}

        {/* Step 9: review */}
        {step === 9 ? (
          <div className="mt-4">
            <dl className="grid gap-2 sm:grid-cols-2">
              {review.map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {k}
                  </dt>
                  <dd className="mt-0.5 text-sm font-semibold text-[#0F1B3D]">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
            {preview ? (
              <div className="mt-4 rounded-xl bg-[#F3F2FF] p-4">
                <h3 className="font-bold text-[#0F1B3D]">
                  Preview: how JobOrio ops will see this brief
                </h3>
                <p className="mt-2 text-sm text-slate-600">{prevText}</p>
              </div>
            ) : null}
            <label
              className={`mt-4 flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
                fieldErrors.__confirm
                  ? "border-rose-300 bg-rose-50 text-rose-900"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={confirm}
                onChange={(e) => {
                  setConfirm(e.target.checked);
                  if (e.target.checked) {
                    setFieldErrors((prev) => {
                      if (!prev.__confirm) return prev;
                      const next = { ...prev };
                      delete next.__confirm;
                      return next;
                    });
                  }
                }}
              />
              <span>
                I confirm I have permission to use the submitted content and that
                the campaign information is accurate.
                <span className="text-rose-500"> *</span>
              </span>
            </label>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={back}
              disabled={step === 1 || busy}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void submit(true)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold"
            >
              Save draft
            </button>
            {step === 9 ? (
              <button
                type="button"
                onClick={() => setPreview((p) => !p)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold"
              >
                {preview ? "Hide preview" : "Preview"}
              </button>
            ) : null}
          </div>
          <div>
            {step === 9 ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void submit(false)}
                className="rounded-full bg-violet-600 px-4 py-2 text-sm font-bold text-white"
              >
                {busy ? "Submitting…" : "Submit for approval"}
              </button>
            ) : (
              <button
                type="button"
                onClick={next}
                className="rounded-full bg-violet-600 px-4 py-2 text-sm font-bold text-white"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
