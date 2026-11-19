"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useState } from "react";
import MathCaptcha from "@/components/auth/MathCaptcha";
import AuthDivider from "@/components/auth/AuthDivider";
import {
  authAlertError,
  authField,
  authLabel,
  authLink,
  authPrimaryButton,
  authSectionHeading,
  authTextarea,
} from "@/components/auth/authStyles";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import { registerBrand } from "@/lib/api/brandAuth";
import { ApiClientError } from "@/lib/api/client";

const field = authField;

const regions = [
  { value: "IN", label: "India (Domestic)" },
  { value: "US", label: "United States" },
  { value: "UK", label: "United Kingdom" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "OTHER", label: "Other International" },
] as const;

type Region = (typeof regions)[number]["value"];

export default function BrandRegisterForm() {
  const router = useRouter();
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onCaptcha = useCallback((v: { captcha_id: string; captcha_answer: string }) => {
    setCaptcha(v);
  }, []);

  const india = region === "IN";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters with letters, numbers, and symbols.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!accepted) {
      setError("Please accept the Terms & Conditions.");
      return;
    }
    if (!captcha.captcha_id || !captcha.captcha_answer) {
      setError("Complete the captcha.");
      return;
    }

    setLoading(true);
    try {
      const data = await registerBrand({
        company_name: companyName.trim(),
        trading_name: tradingName.trim(),
        entity_region: region,
        gst_number: india ? gst.trim() : undefined,
        pan_number: india ? pan.trim() : undefined,
        tax_id: india ? undefined : taxId.trim(),
        billing_address: india ? billingAddress.trim() || undefined : billingAddress.trim(),
        website: website.trim() || undefined,
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
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not register. Check the API is running.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <SocialAuthButtons intent="login" />

      <AuthDivider label="or create an account with email" />

      <form className="space-y-7" onSubmit={onSubmit}>
        {error ? (
          <p className={authAlertError}>{error}</p>
        ) : null}

        <section>
          <h2 className={authSectionHeading}>1. Company & Entity Information</h2>
          <div className="mt-3 space-y-4">
            <label className={authLabel}>
              Company Full Legal Name
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Vigyapanam Media Private Limited"
                className={field}
              />
            </label>
            <label className={authLabel}>
              Brand / Trading Name
              <input
                required
                value={tradingName}
                onChange={(e) => setTradingName(e.target.value)}
                placeholder="e.g., Vigyapanam"
                className={field}
              />
            </label>
            <label className={authLabel}>
              Entity Type / Country of Incorporation
              <select
                required
                value={region}
                onChange={(e) => setRegion(e.target.value as Region)}
                className={field}
              >
                {regions.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={authLabel}>
              Website (optional)
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://company.com"
                className={field}
              />
            </label>
          </div>
        </section>

        <section>
          <h2 className={authSectionHeading}>2. Tax & Compliance Details</h2>
          <p className="mt-1 text-sm text-slate-500">
            Fields update based on your country selection.
          </p>
          <div className="mt-3 space-y-4">
            {india ? (
              <>
                <label className={authLabel}>
                  GSTIN
                  <input
                    required
                    value={gst}
                    onChange={(e) => setGst(e.target.value.toUpperCase())}
                    placeholder="15-digit GSTIN"
                    maxLength={15}
                    className={field}
                  />
                </label>
                <label className={authLabel}>
                  PAN
                  <input
                    required
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    placeholder="Company PAN"
                    maxLength={10}
                    className={field}
                  />
                </label>
                <label className={authLabel}>
                  Billing address (optional)
                  <textarea
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    rows={3}
                    className={authTextarea}
                  />
                </label>
              </>
            ) : (
              <>
                <label className={authLabel}>
                  Tax ID / EIN / VAT Number
                  <input
                    required
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="Local tax identification number"
                    className={field}
                  />
                </label>
                <label className={authLabel}>
                  Billing Address & Country
                  <textarea
                    required
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    placeholder="Street, City, State/Province, Postal Code, Country"
                    rows={3}
                    className={authTextarea}
                  />
                </label>
              </>
            )}
          </div>
        </section>

        <section>
          <h2 className={authSectionHeading}>3. Official Contact & Account Credentials</h2>
          <div className="mt-3 space-y-4">
            <label className={authLabel}>
              Official Work Email
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@companydomain.com"
                className={field}
              />
            </label>
            <label className={authLabel}>
              Create Password
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters with letters, numbers & symbols"
                className={field}
              />
            </label>
            <label className={authLabel}>
              Confirm Password
              <input
                required
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                className={field}
              />
            </label>
          </div>
        </section>

        <MathCaptcha onChange={onCaptcha} />

        <label className="flex items-start gap-3 text-[13px] text-slate-600">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-violet-600 focus:ring-violet-500"
          />
          <span>
            I agree to JobOrio&apos;s{" "}
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

        <button
          type="submit"
          disabled={loading}
          className={authPrimaryButton}
        >
          {loading ? "Creating account…" : "Register & Verify Email"}
        </button>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login?next=/employer/dashboard" className={authLink}>
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
