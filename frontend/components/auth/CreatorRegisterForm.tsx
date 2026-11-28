"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, Suspense, useCallback, useEffect, useRef, useState } from "react";
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
} from "@/components/auth/authStyles";
import ReferralCapture from "@/components/auth/ReferralCapture";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import { register } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { getReferralCode, saveReferralCode } from "@/lib/auth/referralStorage";
import { rememberPublicCode, setAuthToken } from "@/lib/auth/session";
import { markOnboardingPending } from "@/lib/auth/onboardingFlag";
import {
  apiFieldErrors,
  confirmPasswordProblem,
  emailProblem,
  nameProblem,
  newPasswordProblem,
} from "@/lib/validation";

type FieldKey = "fullName" | "email" | "referral" | "password" | "confirm" | "accepted" | "captcha";

const apiFieldMap: Record<string, FieldKey> = {
  name: "fullName",
  email: "email",
  referral_code: "referral",
  password: "password",
  password_confirmation: "confirm",
  captcha_id: "captcha",
  captcha_answer: "captcha",
};

const Req = () => <span className="text-violet-600"> *</span>;

export default function CreatorRegisterForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [captcha, setCaptcha] = useState({ captcha_id: "", captcha_answer: "" });
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const { errors, setErrors, clear, setOne } = useFieldErrors<FieldKey>();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const existing = getReferralCode();
    if (existing) setReferralCode(existing);
  }, []);

  const onCaptcha = useCallback(
    (v: { captcha_id: string; captcha_answer: string }) => {
      setCaptcha(v);
      if (v.captcha_id && v.captcha_answer.trim()) clear("captcha");
    },
    [clear],
  );

  const rules: Record<FieldKey, () => string | null> = {
    fullName: () => nameProblem(fullName),
    email: () => emailProblem(email),
    referral: () => null,
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
    "aria-describedby": errors[key] ? `creator-${key}-error` : undefined,
  });

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
      const code = referralCode.trim().toUpperCase() || undefined;
      if (code) saveReferralCode(code);

      const data = await register({
        name: fullName.trim(),
        email: email.trim(),
        password,
        captcha_id: captcha.captcha_id,
        captcha_answer: captcha.captcha_answer,
        ...(code ? { referral_code: code } : {}),
      });
      setAuthToken(data.token);
      rememberPublicCode(data.user);

      markOnboardingPending(data.user.id, "creator");
      // Profile links, niches and the rest are collected in /onboarding.
      sessionStorage.setItem("joborio_signup_role", "creator");
      router.push("/onboarding");
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
        setFormError("Could not create creator account. Check the API is running.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Suspense fallback={null}>
        <ReferralCapture />
      </Suspense>

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
          <h2 className={authSectionHeading}>1. Account Details</h2>
          <div className="mt-3 space-y-4">
            <div>
              <label htmlFor="creator-fullName" className={authLabel}>
                Full Name
                <Req />
              </label>
              <input
                id="creator-fullName"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  clear("fullName");
                }}
                onBlur={() => blur("fullName")}
                placeholder="Your full name"
                autoComplete="name"
                className={errors.fullName ? authFieldError : authField}
                {...input("fullName")}
              />
              <FieldError id="creator-fullName-error" message={errors.fullName} />
            </div>

            <div>
              <label htmlFor="creator-email" className={authLabel}>
                Email
                <Req />
              </label>
              <input
                id="creator-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clear("email");
                }}
                onBlur={() => blur("email")}
                placeholder="you@example.com"
                autoComplete="email"
                className={errors.email ? authFieldError : authField}
                {...input("email")}
              />
              <FieldError id="creator-email-error" message={errors.email} />
            </div>

            <div>
              <label htmlFor="creator-referral" className={authLabel}>
                Referral Code <span className="font-normal text-slate-400">(Optional)</span>
              </label>
              <input
                id="creator-referral"
                value={referralCode}
                onChange={(e) => {
                  setReferralCode(e.target.value.toUpperCase());
                  clear("referral");
                }}
                placeholder="ENTER A CREATOR'S CODE"
                autoComplete="off"
                className={`${errors.referral ? authFieldError : authField} uppercase tracking-wide`}
                {...input("referral")}
              />
              <FieldError id="creator-referral-error" message={errors.referral} />
              <span className="mt-1.5 block text-xs font-normal text-slate-500">
                Have a friend&apos;s invite? Enter it here.{" "}
                <Link href="/refer-and-earn" className={authLink}>
                  How Refer & Earn works
                </Link>
              </span>
            </div>
          </div>
        </section>

        <section>
          <h2 className={authSectionHeading}>2. Secure Credentials</h2>
          <div className="mt-3 space-y-4">
            <div>
              <label htmlFor="creator-password" className={authLabel}>
                Password
                <Req />
              </label>
              <PasswordInput
                id="creator-password"
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
              <FieldError id="creator-password-error" message={errors.password} />
            </div>
            <div>
              <label htmlFor="creator-confirm" className={authLabel}>
                Confirm Password
                <Req />
              </label>
              <PasswordInput
                id="creator-confirm"
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
              <FieldError id="creator-confirm-error" message={errors.confirm} />
            </div>
          </div>
        </section>

        <div>
          <MathCaptcha onChange={onCaptcha} resetKey={captchaResetKey} />
          <FieldError id="creator-captcha-error" message={errors.captcha} />
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
          <FieldError id="creator-accepted-error" message={errors.accepted} />
        </div>

        <button type="submit" disabled={loading} className={authPrimaryButton}>
          {loading ? "Creating account…" : "Create Creator Account"}
        </button>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/creator/login" className={authLink}>
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}