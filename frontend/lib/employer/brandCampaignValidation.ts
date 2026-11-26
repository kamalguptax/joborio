import {
  CATEGORY_FIELD_SCHEMA,
  PRICING_BENCH,
  fieldLabel,
  type ModelKey,
} from "@/lib/employer/brandPortalSample";

export type WizardValidateCtx = {
  cat: string;
  form: Record<string, string>;
  audSel: string[];
  model: ModelKey;
  priceN: number;
  overrideLow: boolean;
  integ: string;
  confirm: boolean;
  tg: Record<string, boolean>;
};

export type FieldErrors = Record<string, string>;

const URL_KEYS = [
  "Application URL",
  "Course URL",
  "Product URL",
  "Landing URL",
  "Landing page URL",
  "Destination URL",
  "Callback endpoint",
];

function isUrlKey(label: string) {
  return (
    URL_KEYS.includes(label) ||
    /url|endpoint/i.test(label)
  );
}

function httpsOk(v: string) {
  return v.trim().startsWith("https://");
}

function requireTrimmed(
  form: Record<string, string>,
  key: string,
  message: string,
  errs: string[],
  fields: FieldErrors,
) {
  if (!(form[key] || "").trim()) {
    errs.push(message);
    fields[key] = message;
  }
}

/** Validate one wizard step. Returns message list + per-field map. */
export function validateWizardStep(
  step: number,
  ctx: WizardValidateCtx,
): { messages: string[]; fields: FieldErrors } {
  const messages: string[] = [];
  const fields: FieldErrors = {};
  const { form, cat, audSel, model, priceN, overrideLow, integ, confirm, tg } =
    ctx;
  const bench = PRICING_BENCH[model];
  const needAck = priceN > 0 && priceN < bench[1];
  const budget = Number(form["Total budget"]) || 0;
  const daily = Number(form["Daily budget"]) || 0;
  const spec = CATEGORY_FIELD_SCHEMA[cat] ?? [];
  const first = spec.length ? fieldLabel(spec[0]) : "";

  if (step === 1) {
    if (!cat) messages.push("Choose what you want to promote.");
    const name = (form["Campaign name"] || "").trim();
    if (!name) {
      messages.push("Campaign name is required.");
      fields["Campaign name"] = "Required";
    } else if (name.length < 3) {
      messages.push("Campaign name must be at least 3 characters.");
      fields["Campaign name"] = "Min 3 characters";
    } else if (name.length > 80) {
      messages.push("Campaign name must be 80 characters or fewer.");
      fields["Campaign name"] = "Max 80 characters";
    }
    if (cat && first) {
      requireTrimmed(form, first, `${first} is required.`, messages, fields);
    }
    // Require category destination URL when schema has one
    for (const key of [
      "Application URL",
      "Course URL",
      "Product URL",
      "Landing URL",
    ]) {
      if (spec.some((sp) => fieldLabel(sp) === key)) {
        requireTrimmed(form, key, `${key} is required.`, messages, fields);
      }
    }
    for (const key of Object.keys(form)) {
      if (!isUrlKey(key)) continue;
      const v = (form[key] || "").trim();
      if (!v) continue;
      if (!httpsOk(v)) {
        const msg = `${key} must start with https://`;
        messages.push(msg);
        fields[key] = "Must start with https://";
      }
    }
  }

  if (step === 2) {
    if (audSel.length === 0) {
      messages.push("Select at least one audience type.");
    }
    requireTrimmed(form, "Country", "Country is required.", messages, fields);
    // Age range is optional; if filled, light format check
    const age = (form["Age range (only where lawful and necessary)"] || "").trim();
    if (age && !/^\d{1,2}\s*(to|-)\s*\d{1,2}$/i.test(age) && !/^\d{1,2}\+$/.test(age)) {
      messages.push(
        "Age range should look like “18 to 35” (only where lawful and necessary).",
      );
      fields["Age range (only where lawful and necessary)"] =
        "Use format like 18 to 35";
    }
  }

  if (step === 3) {
    if (!model) messages.push("Choose a conversion model.");
    if (model === "cpm") {
      messages.push(
        "CPM is disabled until impression tracking is enabled for this account. Choose another model.",
      );
    }
  }

  if (step === 4) {
    if (!(priceN > 0)) {
      messages.push("Enter a price greater than 0.");
      fields.__price = "Required";
    } else if (needAck && !overrideLow) {
      messages.push(
        "Your price is below the typical range. Tick the acknowledgement to continue, or raise the price.",
      );
      fields.__price = "Below typical — acknowledge to continue";
    }
  }

  if (step === 5) {
    if (!(budget > 0)) {
      messages.push("Total budget is required.");
      fields["Total budget"] = "Required";
    }
    if (!(daily > 0)) {
      messages.push("Daily budget is required.");
      fields["Daily budget"] = "Required";
    }
    if (priceN > 0 && budget > 0 && budget < priceN) {
      messages.push("Budget must cover at least one result at your price.");
      fields["Total budget"] = "Must be ≥ price";
    }
    if (daily > 0 && budget > 0 && daily > budget) {
      messages.push("Daily budget cannot exceed total budget.");
      fields["Daily budget"] = "Cannot exceed total";
    }
    requireTrimmed(form, "Start date", "Start date is required.", messages, fields);
    requireTrimmed(form, "End date", "End date is required.", messages, fields);
    if (
      form["End date"] &&
      form["Start date"] &&
      form["End date"] < form["Start date"]
    ) {
      messages.push("End date must be after start date.");
      fields["End date"] = "Must be after start date";
    }
    const maxDaily = Number(form["Maximum daily conversions"] || 0);
    const maxTotal = Number(form["Maximum total conversions"] || 0);
    if (maxDaily > 0 && maxTotal > 0 && maxDaily > maxTotal) {
      messages.push(
        "Maximum daily conversions cannot exceed maximum total conversions.",
      );
      fields["Maximum daily conversions"] = "Cannot exceed total cap";
    }
  }

  if (step === 6) {
    requireTrimmed(
      form,
      "Mandatory lead fields",
      "Mandatory lead fields are required.",
      messages,
      fields,
    );
    requireTrimmed(
      form,
      "Duplicate policy",
      "Duplicate policy is required.",
      messages,
      fields,
    );
    requireTrimmed(
      form,
      "Existing applicant policy",
      "Existing applicant policy is required.",
      messages,
      fields,
    );
    requireTrimmed(
      form,
      "Allowed conversion window",
      "Allowed conversion window is required.",
      messages,
      fields,
    );
    if (!tg.email && !tg.otp && !tg.crm && !tg.appcomp) {
      messages.push("Turn on at least one verification requirement.");
    }
  }

  if (step === 7) {
    requireTrimmed(
      form,
      "Destination URL",
      "Destination URL is required.",
      messages,
      fields,
    );
    const dest = (form["Destination URL"] || "").trim();
    if (dest && !httpsOk(dest)) {
      messages.push("Destination URL must start with https://");
      fields["Destination URL"] = "Must start with https://";
    }
    requireTrimmed(
      form,
      "Conversion event name",
      "Conversion event name is required.",
      messages,
      fields,
    );
    const needsCallback = ["s2s", "capi", "webhook", "crm", "ats", "api"].includes(
      integ,
    );
    if (needsCallback) {
      requireTrimmed(
        form,
        "Callback endpoint",
        "Callback endpoint is required for this integration.",
        messages,
        fields,
      );
      const cb = (form["Callback endpoint"] || "").trim();
      if (cb && !httpsOk(cb)) {
        messages.push("Callback endpoint must start with https://");
        fields["Callback endpoint"] = "Must start with https://";
      }
    }
  }

  if (step === 8) {
    requireTrimmed(
      form,
      "Approved campaign description",
      "Approved campaign description is required.",
      messages,
      fields,
    );
    requireTrimmed(
      form,
      "Key selling points",
      "Key selling points are required.",
      messages,
      fields,
    );
    const landing = (form["Landing page URL"] || "").trim();
    if (landing && !httpsOk(landing)) {
      messages.push("Landing page URL must start with https://");
      fields["Landing page URL"] = "Must start with https://";
    }
    if (!confirm) {
      messages.push(
        "Confirm permission and accuracy of the information to continue.",
      );
      fields.__confirm = "Required";
    }
  }

  if (step === 9) {
    if (!confirm) {
      messages.push(
        "Confirm permission and accuracy of the information to continue.",
      );
      fields.__confirm = "Required";
    }
  }

  return { messages, fields };
}

/** Re-validate steps needed before submit. */
export function validateWizardSubmit(ctx: WizardValidateCtx) {
  const messages: string[] = [];
  const fields: FieldErrors = {};
  for (const step of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    const r = validateWizardStep(step, ctx);
    for (const m of r.messages) {
      if (!messages.includes(m)) messages.push(m);
    }
    Object.assign(fields, r.fields);
  }
  return { messages, fields };
}
