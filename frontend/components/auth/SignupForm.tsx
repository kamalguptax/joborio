"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import MathCaptcha from "@/components/auth/MathCaptcha";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import AuthDivider from "@/components/auth/AuthDivider";
import PasswordInput from "@/components/auth/PasswordInput";
import {
  authAlertError,
  authField,
  authLabel,
  authLink,
  authPrimaryButton,
} from "@/components/auth/authStyles";
import { register } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { getReferralCode, saveReferralCode } from "@/lib/auth/referralStorage";
import { rememberPublicCode, setAuthToken } from "@/lib/auth/session";

const roles = [
  { value: "creator", label: "Creator", hint: "I have an audience" },
  { value: "employer", label: "Employer", hint: "I'm hiring" },
  { value: "partner", label: "Publisher", hint: "I run a network" },
] as const;

type SignupRole = (typeof roles)[number]["value"];

const field = authField;

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onCaptcha = useCallback((v: { captcha_id: string; captcha_answer: string }) => {
    setCaptcha(v);
  }, []);
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
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

    const effectiveRole: SignupRole = "creator";

    setLoading(true);
    try {
      const refCode = referralCode.trim().toUpperCase();
      if (refCode) {
        saveReferralCode(refCode);
      }
      const data = await register({
        name,
        email,
        password,
        captcha_id: captcha.captcha_id,
        captcha_answer: captcha.captcha_answer,
        ...(refCode ? { referral_code: refCode } : {}),
      });
      setAuthToken(data.token);
      rememberPublicCode(data.user);
      sessionStorage.setItem(SIGNUP_ROLE_KEY, effectiveRole);
      router.push("/onboarding");
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Unable to create account. Check the API is running.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SocialAuthButtons intent="login" />

      <AuthDivider />

      <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <p className={authAlertError}>{error}</p>
      ) : null}

      <div>
        <label htmlFor="name" className={authLabel}>
          Full name<span className="text-violet-600">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={field}
        />
      </div>

      <div>
        <label htmlFor="email" className={authLabel}>
          Email address<span className="text-violet-600">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={field}
        />
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
          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
          readOnly={inviteFromUrl}
          className={`${field} tracking-wide ${
            inviteFromUrl ? "bg-slate-50 text-slate-700" : ""
          }`}
        />
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
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className={authLabel}>
            Confirm<span className="text-violet-600">*</span>
          </label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            required
            autoComplete="new-password"
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>

      <label className="flex items-start gap-2 text-xs text-slate-500">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-violet-600 accent-violet-600"
        />
        <span>
          I agree to JobOrio&apos;s{" "}
          <Link href="/terms" className={authLink}>
            Terms & Conditions
          </Link>
        </span>
      </label>

      <MathCaptcha onChange={onCaptcha} />

      <button
        type="submit"
        disabled={loading}
        className={authPrimaryButton}
      >
        {loading ? "Creating account…" : "Sign up with email"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className={authLink}>
          Log in
        </Link>
      </p>
    </form>
    </>
  );
}
