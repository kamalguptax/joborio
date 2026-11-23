"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import MathCaptcha, { isCaptchaFailureMessage } from "@/components/auth/MathCaptcha";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import AuthDivider from "@/components/auth/AuthDivider";
import PasswordInput from "@/components/auth/PasswordInput";
import FieldError from "@/components/auth/FieldError";
import { focusFirstInvalid, useFieldErrors } from "@/components/auth/useFieldErrors";
import {
  authAlertError,
  authField,
  authFieldError,
  authLabel,
  authLink,
  authPrimaryButton,
} from "@/components/auth/authStyles";
import {
  apiFieldErrors,
  confirmPasswordProblem,
  emailProblem,
  nameProblem,
  newPasswordProblem,
} from "@/lib/validation";
import { register } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { getReferralCode, saveReferralCode } from "@/lib/auth/referralStorage";
import { rememberPublicCode, setAuthToken } from "@/lib/auth/session";
import { markOnboardingPending } from "@/lib/auth/onboardingFlag";

const roles = [
  { value: "creator", label: "Creator", hint: "I have an audience" },
  { value: "employer", label: "Employer", hint: "I'm hiring" },
  { value: "partner", label: "Publisher", hint: "I run a network" },
] as const;

type SignupRole = (typeof roles)[number]["value"];

const field = authField;

type FieldKey = "name" | "email" | "password" | "confirm" | "accepted" | "captcha" | "referral";

const apiFieldMap: Record<string, FieldKey> = {
  name: "name",
  email: "email",
  password: "password",
  password_confirmation: "confirm",
  referral_code: "referral",
  captcha_id: "captcha",
  captcha_answer: "captcha",
};

const SIGNUP_ROLE_KEY = "joborio_signup_role";

function readRefFromUrl(): string {
  if (typeof window === "undefined") return "";
  try {
    return (new URLSearchParams(window.location.search).get("ref") ?? "")
      .trim()
      .toUpperCase();
  } catch {
    return "";
  }
}

export function getSignupRoleIntent(): SignupRole | null {
  if (typeof window === "undefined") return null;
  const v = sessionStorage.getItem(SIGNUP_ROLE_KEY);
  if (v === "creator" || v === "employer" || v === "partner") return v;
  return null;
}

export function clearSignupRoleIntent() {
  sessionStorage.removeItem(SIGNUP_ROLE_KEY);
}

export default function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [captcha, setCaptcha] = useState({ captcha_id: "", captcha_answer: "" });
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { errors, setErrors, clear, setOne } = useFieldErrors<FieldKey>();

  const onCaptcha = useCallback(
    (v: { captcha_id: string; captcha_answer: string }) => {
      setCaptcha(v);
      if (v.captcha_id && v.captcha_answer.trim()) clear("captcha");
    },
    [clear],
  );

  const rules: Record<FieldKey, () => string | null> = {
    name: () => nameProblem(name),
    email: () => emailProblem(email),
    referral: () => null,
    password: () => newPasswordProblem(password),
    confirm: () => confirmPasswordProblem(password, confirmPassword),
    accepted: () => (accepted ? null : "You must accept the Terms & Conditions."),
    captcha: () =>
      captcha.captcha_id && captcha.captcha_answer.trim() ? null : "Complete the captcha.",
  };
  const blur = (key: FieldKey) => setOne(key, rules[key]() ?? undefined);
  const aria = (key: FieldKey) => ({
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `signup-${key}-error` : undefined,
  });
  /** Hide Employer / Partner only when signup opened with ?ref=CODE */
  const [inviteFromUrl, setInviteFromUrl] = useState(false);

  useEffect(() => {
    const fromUrl = readRefFromUrl();
    if (fromUrl) {
      setInviteFromUrl(true);
      setReferralCode(fromUrl);
      saveReferralCode(fromUrl);
      return;
    }
    setInviteFromUrl(false);
    const existing = getReferralCode();
    if (existing) setReferralCode(existing);
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const found: Partial<Record<FieldKey, string>> = {};
    (Object.keys(rules) as FieldKey[]).forEach((k) => {
      const problem = rules[k]();
      if (problem) found[k] = problem;
    });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setError("Please fix the highlighted fields.");
      focusFirstInvalid(formRef.current);
      return;
    }

    const effectiveRole: SignupRole = "creator";

    setLoading(true);
    try {
      const refCode = referralCode.trim().toUpperCase();
      if (refCode) {
        saveReferralCode(refCode);
      }
      const data = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        captcha_id: captcha.captcha_id,
        captcha_answer: captcha.captcha_answer,
        ...(refCode ? { referral_code: refCode } : {}),
      });
      setAuthToken(data.token);
      rememberPublicCode(data.user);
      markOnboardingPending(data.user.id, "creator");
      sessionStorage.setItem(SIGNUP_ROLE_KEY, effectiveRole);
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
        setError(Object.keys(mapped).length > 0 ? "Please fix the highlighted fields." : err.message);
        focusFirstInvalid(formRef.current);
      } else {
        setError("Unable to create account. Check the API is running.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SocialAuthButtons intent="login" />

      <AuthDivider />

      <form ref={formRef} onSubmit={onSubmit} className="space-y-4" noValidate>
      {error ? (
        <p role="alert" className={authAlertError}>
          {error}
        </p>
      ) : null}

      <div>
        <label htmlFor="name" className={authLabel}>
          Full name<span className="text-violet-600">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clear("name");
          }}
          onBlur={() => blur("name")}
          className={errors.name ? authFieldError : field}
          {...aria("name")}
        />
        <FieldError id="signup-name-error" message={errors.name} />
      </div>

      <div>
        <label htmlFor="email" className={authLabel}>
          Email address<span className="text-violet-600">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clear("email");
          }}
          onBlur={() => blur("email")}
          className={errors.email ? authFieldError : field}
          {...aria("email")}
        />
        <FieldError id="signup-email-error" message={errors.email} />
      </div>

      <div>
        <label htmlFor="referralCode" className={authLabel}>
          Referral code <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <input
          id="referralCode"
          name="referralCode"
          type="text"
          autoComplete="off"
          placeholder="Enter a creator’s code"
          value={referralCode}
          onChange={(e) => {
            setReferralCode(e.target.value.toUpperCase());
            clear("referral");
          }}
          readOnly={inviteFromUrl}
          className={`${errors.referral ? authFieldError : field} tracking-wide ${
            inviteFromUrl ? "bg-slate-50 text-slate-700" : ""
          }`}
          {...aria("referral")}
        />
        <FieldError id="signup-referral-error" message={errors.referral} />
        <p className="mt-1.5 text-xs text-slate-500">
          Have a friend’s invite? Enter it here, or open their referral link.{" "}
          <Link href="/refer-and-earn" className={authLink}>
            How Refer & Earn works
          </Link>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="password" className={authLabel}>
            Password<span className="text-violet-600">*</span>
          </label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clear("password");
              if (errors.confirm && confirmPassword === e.target.value) clear("confirm");
            }}
            onBlur={() => blur("password")}
            className={errors.password ? authFieldError : field}
            {...aria("password")}
          />
          <FieldError id="signup-password-error" message={errors.password} />
        </div>
        <div>
          <label htmlFor="confirmPassword" className={authLabel}>
            Confirm<span className="text-violet-600">*</span>
          </label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              clear("confirm");
            }}
            onBlur={() => blur("confirm")}
            className={errors.confirm ? authFieldError : field}
            {...aria("confirm")}
          />
          <FieldError id="signup-confirm-error" message={errors.confirm} />
        </div>
      </div>

      <div>
      <label className="flex items-start gap-2 text-xs text-slate-500">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => {
            setAccepted(e.target.checked);
            if (e.target.checked) clear("accepted");
          }}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-violet-600 accent-violet-600"
          {...aria("accepted")}
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
      <FieldError id="signup-accepted-error" message={errors.accepted} />
      </div>

      <div>
        <MathCaptcha onChange={onCaptcha} resetKey={captchaResetKey} />
        <FieldError id="signup-captcha-error" message={errors.captcha} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={authPrimaryButton}
      >
        {loading ? "Creating account…" : "Sign up with email"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/creator/login" className={authLink}>
          Log in
        </Link>
      </p>
    </form>
    </>
  );
}
