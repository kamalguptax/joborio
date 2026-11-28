"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useRef, useState } from "react";
import MathCaptcha, { isCaptchaFailureMessage } from "@/components/auth/MathCaptcha";
import AuthDivider from "@/components/auth/AuthDivider";
import FieldError from "@/components/auth/FieldError";
import PasswordInput from "@/components/auth/PasswordInput";
import { focusFirstInvalid, useFieldErrors } from "@/components/auth/useFieldErrors";
import {
  authAlertError,
  authField,
  authFieldError,
  authLabel,
  authLink,
  authPrimaryButton,
  authSectionHeading,
  authTextarea,
} from "@/components/auth/authStyles";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import { registerBrand } from "@/lib/api/brandAuth";
import { ApiClientError } from "@/lib/api/client";
import {
  apiFieldErrors,
  confirmPasswordProblem,
  emailProblem,
  isValidGstin,
  isValidPan,
  isValidUrl,
  nameProblem,
  newPasswordProblem,
  normalizeUrl,
} from "@/lib/validation";

const regions = [
  { value: "IN", label: "India (Domestic)" },
  { value: "US", label: "United States" },
  { value: "UK", label: "United Kingdom" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "OTHER", label: "Other International" },
] as const;

type Region = (typeof regions)[number]["value"];

type FieldKey =
  | "companyName"
  | "tradingName"
  | "region"
  | "website"
  | "gst"
  | "pan"
  | "taxId"
  | "billingAddress"
  | "email"
  | "password"
  | "confirm"
  | "accepted"
  | "captcha";

const apiFieldMap: Record<string, FieldKey> = {
  company_name: "companyName",
  trading_name: "tradingName",
  entity_region: "region",
  website: "website",
  gst_number: "gst",
  pan_number: "pan",
  tax_id: "taxId",
  billing_address: "billingAddress",
  email: "email",
  password: "password",
  password_confirmation: "confirm",
  accepted_terms: "accepted",
  captcha_id: "captcha",
  captcha_answer: "captcha",
};

const Req = () => <span className="text-violet-600"> *</span>;

export default function BrandRegisterForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [companyName, setCompanyName] = useState("");
  const [tradingName, setTradingName] = useState("");
  const [region, setRegion] = useState<Region>("IN");
  const [gst, setGst] = useState("");
  const [pan, setPan] = useState("");
  const [taxId, setTaxId] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [captcha, setCaptcha] = useState({ captcha_id: "", captcha_answer: "" });
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const { errors, setErrors, clear, setOne } = useFieldErrors<FieldKey>();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onCaptcha = useCallback(
    (v: { captcha_id: string; captcha_answer: string }) => {
      setCaptcha(v);
      if (v.captcha_id && v.captcha_answer.trim()) clear("captcha");
    },
    [clear],
  );

  const india = region === "IN";

  const rules: Record<FieldKey, () => string | null> = {
    companyName: () => nameProblem(companyName, "Company name"),
    tradingName: () => nameProblem(tradingName, "Brand / trading name"),
    region: () => null,
    website: () => {
      const v = website.trim();
      if (!v) return null;
      return isValidUrl(normalizeUrl(v)) ? null : "Enter a valid website, e.g. https://company.com";
    },
    gst: () => {
      if (!india) return null;
      const v = gst.trim();
      if (!v) return "GSTIN is required.";
      return isValidGstin(v) ? null : "Enter a valid 15-character GSTIN, e.g. 22AAAAA0000A1Z5.";
    },
    pan: () => {
      if (!india) return null;
      const v = pan.trim();
      if (!v) return "PAN is required.";
      return isValidPan(v) ? null : "Enter a valid 10-character PAN, e.g. ABCDE1234F.";
    },
    taxId: () => {
      if (india) return null;
      const v = taxId.trim();
      if (!v) return "Tax ID is required.";
      return v.length < 4 ? "Enter a valid tax ID." : null;
    },
    billingAddress: () => {
      if (india) return null;
      const v = billingAddress.trim();
      if (!v) return "Billing address is required.";
      return v.length < 10 ? "Enter the full billing address, including the country." : null;
    },
    email: () => emailProblem(email),
    password: () => newPasswordProblem(password),
    confirm: () => confirmPasswordProblem(password, confirm),
    accepted: () => (accepted ? null : "You must accept the Terms & Conditions."),
    captcha: () =>
      captcha.captcha_id && captcha.captcha_answer.trim() ? null : "Complete the captcha.",
  };

  const blur = (key: FieldKey) => setOne(key, rules[key]() ?? undefined);

  function validateAll() {
    const next: Partial<Record<FieldKey, string>> = {};
    (Object.keys(rules) as FieldKey[]).forEach((k) => {
      const problem = rules[k]();
      if (problem) next[k] = problem;
    });
    return next;
  }

  const input = (key: FieldKey) => ({
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `brand-${key}-error` : undefined,
  });

  function changeRegion(next: Region) {
    setRegion(next);
    (["gst", "pan", "taxId", "billingAddress"] as FieldKey[]).forEach(clear);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setFormError(null);

    const found = validateAll();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFormError("Please fix the highlighted fields.");
      focusFirstInvalid(formRef.current);
      return;
    }

    setLoading(true);
    try {
      const data = await registerBrand({
        company_name: companyName.trim(),
        trading_name: tradingName.trim(),
        entity_region: region,
        gst_number: india ? gst.trim().toUpperCase() : undefined,
        pan_number: india ? pan.trim().toUpperCase() : undefined,
        tax_id: india ? undefined : taxId.trim(),
        billing_address: india ? billingAddress.trim() || undefined : billingAddress.trim(),
        website: normalizeUrl(website) || undefined,
        email: email.trim(),
        password,
        password_confirmation: confirm,
        accepted_terms: true,
        captcha_id: captcha.captcha_id,
        captcha_answer: captcha.captcha_answer,
      });
      sessionStorage.setItem("joborio_brand_verify_email", data.email);
      router.push(`/brand/verify?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        const mapped = apiFieldErrors(err, apiFieldMap);
        if (
          !mapped.email &&
          /email.*(already|taken|registered)|already registered|already been taken/i.test(err.message)
        ) {
          mapped.email = err.message;
        }
        if (isCaptchaFailureMessage(err.message)) {
          mapped.captcha = err.message;
          setCaptcha({ captcha_id: "", captcha_answer: "" });
          setCaptchaResetKey((k) => k + 1);
        }
        setErrors(mapped);
        setFormError(
          Object.keys(mapped).length > 0 ? "Please fix the highlighted fields." : err.message,
        );
        focusFirstInvalid(formRef.current);
      } else {
        setFormError("Could not register. Check the API is running.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <SocialAuthButtons intent="login" />

      <AuthDivider label="or create an account with email" />

      <form ref={formRef} className="space-y-7" onSubmit={onSubmit} noValidate>
        {formError ? (
          <p role="alert" className={authAlertError}>
            {formError}
          </p>
        ) : null}

        <p className="text-xs text-slate-500">
          Fields marked <span className="font-semibold text-violet-600">*</span> are mandatory.
        </p>

        <section>
          <h2 className={authSectionHeading}>1. Company & Entity Information</h2>
          <div className="mt-3 space-y-4">
            <div>
              <label htmlFor="brand-companyName" className={authLabel}>
                Company Full Legal Name
                <Req />
              </label>
              <input
                id="brand-companyName"
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  clear("companyName");
                }}
                onBlur={() => blur("companyName")}
                placeholder="e.g., Vigyapanam Media Private Limited"
                autoComplete="organization"
                className={errors.companyName ? authFieldError : authField}
                {...input("companyName")}
              />
              <FieldError id="brand-companyName-error" message={errors.companyName} />
            </div>
            <div>
              <label htmlFor="brand-tradingName" className={authLabel}>
                Brand / Trading Name
                <Req />
              </label>
              <input
                id="brand-tradingName"
                value={tradingName}
                onChange={(e) => {
                  setTradingName(e.target.value);
                  clear("tradingName");
                }}
                onBlur={() => blur("tradingName")}
                placeholder="e.g., Vigyapanam"
                className={errors.tradingName ? authFieldError : authField}
                {...input("tradingName")}
              />
              <FieldError id="brand-tradingName-error" message={errors.tradingName} />
            </div>
            <div>
              <label htmlFor="brand-region" className={authLabel}>
                Entity Type / Country of Incorporation
                <Req />
              </label>
              <select
                id="brand-region"
                value={region}
                onChange={(e) => changeRegion(e.target.value as Region)}
                className={errors.region ? authFieldError : authField}
                {...input("region")}
              >
                {regions.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <FieldError id="brand-region-error" message={errors.region} />
            </div>
            <div>
              <label htmlFor="brand-website" className={authLabel}>
                Website <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="brand-website"
                inputMode="url"
                value={website}
                onChange={(e) => {
                  setWebsite(e.target.value);
                  clear("website");
                }}
                onBlur={() => blur("website")}
                placeholder="https://company.com"
                autoComplete="url"
                className={errors.website ? authFieldError : authField}
                {...input("website")}
              />
              <FieldError id="brand-website-error" message={errors.website} />
            </div>
          </div>
        </section>

        <section>
          <h2 className={authSectionHeading}>2. Tax & Compliance Details</h2>
          <p className="mt-1 text-sm text-slate-500">Fields update based on your country selection.</p>
          <div className="mt-3 space-y-4">
            {india ? (
              <>
                <div>
                  <label htmlFor="brand-gst" className={authLabel}>
                    GSTIN
                    <Req />
                  </label>
                  <input
                    id="brand-gst"
                    value={gst}
                    onChange={(e) => {
                      setGst(e.target.value.toUpperCase());
                      clear("gst");
                    }}
                    onBlur={() => blur("gst")}
                    placeholder="15-digit GSTIN"
                    maxLength={15}
                    autoComplete="off"
                    className={errors.gst ? authFieldError : authField}
                    {...input("gst")}
                  />
                  <FieldError id="brand-gst-error" message={errors.gst} />
                </div>
                <div>
                  <label htmlFor="brand-pan" className={authLabel}>
                    PAN
                    <Req />
                  </label>
                  <input
                    id="brand-pan"
                    value={pan}
                    onChange={(e) => {
                      setPan(e.target.value.toUpperCase());
                      clear("pan");
                    }}
                    onBlur={() => blur("pan")}
                    placeholder="Company PAN"
                    maxLength={10}
                    autoComplete="off"
                    className={errors.pan ? authFieldError : authField}
                    {...input("pan")}
                  />
                  <FieldError id="brand-pan-error" message={errors.pan} />
                </div>
                <div>
                  <label htmlFor="brand-billingAddress" className={authLabel}>
                    Billing address <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    id="brand-billingAddress"
                    value={billingAddress}
                    onChange={(e) => {
                      setBillingAddress(e.target.value);
                      clear("billingAddress");
                    }}
                    rows={3}
                    className={authTextarea}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="brand-taxId" className={authLabel}>
                    Tax ID / EIN / VAT Number
                    <Req />
                  </label>
                  <input
                    id="brand-taxId"
                    value={taxId}
                    onChange={(e) => {
                      setTaxId(e.target.value);
                      clear("taxId");
                    }}
                    onBlur={() => blur("taxId")}
                    placeholder="Local tax identification number"
                    autoComplete="off"
                    className={errors.taxId ? authFieldError : authField}
                    {...input("taxId")}
                  />
                  <FieldError id="brand-taxId-error" message={errors.taxId} />
                </div>
                <div>
                  <label htmlFor="brand-billingAddress" className={authLabel}>
                    Billing Address & Country
                    <Req />
                  </label>
                  <textarea
                    id="brand-billingAddress"
                    value={billingAddress}
                    onChange={(e) => {
                      setBillingAddress(e.target.value);
                      clear("billingAddress");
                    }}
                    onBlur={() => blur("billingAddress")}
                    placeholder="Street, City, State/Province, Postal Code, Country"
                    rows={3}
                    className={`${errors.billingAddress ? "border-red-400 " : ""}${authTextarea}`}
                    {...input("billingAddress")}
                  />
                  <FieldError id="brand-billingAddress-error" message={errors.billingAddress} />
                </div>
              </>
            )}
          </div>
        </section>

        <section>
          <h2 className={authSectionHeading}>3. Official Contact & Account Credentials</h2>
          <div className="mt-3 space-y-4">
            <div>
              <label htmlFor="brand-email" className={authLabel}>
                Official Work Email
                <Req />
              </label>
              <input
                id="brand-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clear("email");
                }}
                onBlur={() => blur("email")}
                placeholder="name@companydomain.com"
                autoComplete="email"
                className={errors.email ? authFieldError : authField}
                {...input("email")}
              />
              <FieldError id="brand-email-error" message={errors.email} />
            </div>
            <div>
              <label htmlFor="brand-password" className={authLabel}>
                Create Password
                <Req />
              </label>
              <PasswordInput
                id="brand-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clear("password");
                  if (errors.confirm && confirm === e.target.value) clear("confirm");
                }}
                onBlur={() => blur("password")}
                placeholder="Min. 8 characters, with letters and numbers"
                autoComplete="new-password"
                className={errors.password ? authFieldError : authField}
                {...input("password")}
              />
              <FieldError id="brand-password-error" message={errors.password} />
            </div>
            <div>
              <label htmlFor="brand-confirm" className={authLabel}>
                Confirm Password
                <Req />
              </label>
              <PasswordInput
                id="brand-confirm"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  clear("confirm");
                }}
                onBlur={() => blur("confirm")}
                placeholder="Repeat password"
                autoComplete="new-password"
                className={errors.confirm ? authFieldError : authField}
                {...input("confirm")}
              />
              <FieldError id="brand-confirm-error" message={errors.confirm} />
            </div>
          </div>
        </section>

        <div>
          <MathCaptcha onChange={onCaptcha} resetKey={captchaResetKey} />
          <FieldError id="brand-captcha-error" message={errors.captcha} />
        </div>

        <div>
          <label className="flex items-start gap-3 text-[13px] text-slate-600">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => {
                setAccepted(e.target.checked);
                if (e.target.checked) clear("accepted");
              }}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-violet-600 focus:ring-violet-500"
              {...input("accepted")}
            />
            <span>
              I agree to Upclift&apos;s{" "}
              <Link href="/terms" className={authLink}>
                Terms & Conditions
              </Link>
              ,{" "}
              <Link href="/privacy" className={authLink}>
                Privacy Policy
              </Link>
              , and{" "}
              <Link href="/payout-policy" className={authLink}>
                Payout Policy
              </Link>
            </span>
          </label>
          <FieldError id="brand-accepted-error" message={errors.accepted} />
        </div>

        <button type="submit" disabled={loading} className={authPrimaryButton}>
          {loading ? "Creating account…" : "Register & Verify Email"}
        </button>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/brand/login" className={authLink}>
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}