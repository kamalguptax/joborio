"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import MathCaptcha from "@/components/auth/MathCaptcha";
import AuthDivider from "@/components/auth/AuthDivider";
import {
  authAlertError,
  authField,
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

const field = authField;

export default function CreatorRegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [captcha, setCaptcha] = useState({ captcha_id: "", captcha_answer: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const existing = getReferralCode();
    if (existing) setReferralCode(existing);
  }, []);

  const onCaptcha = useCallback((v: { captcha_id: string; captcha_answer: string }) => {
    setCaptcha(v);
  }, []);

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
      const code = referralCode.trim().toUpperCase() || undefined;
      if (code) {
        saveReferralCode(code);
      }

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
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not create creator account. Check the API is running.",
      );
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

      <form className="space-y-7" onSubmit={onSubmit}>
        {error ? (
          <p className={authAlertError}>{error}</p>
        ) : null}

        <section>
          <h2 className={authSectionHeading}>1. Account Details</h2>
          <div className="mt-3 space-y-4">
            <label className={authLabel}>
              Full Name
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                className={field}
              />
            </label>
            <label className={authLabel}>
              Email
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className={field}
              />
            </label>
            <label className={authLabel}>
              Referral Code{" "}
              <span className="font-normal text-slate-400">(Optional)</span>
              <input
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="ENTER A CREATOR'S CODE"
                autoComplete="off"
                className={`${field} uppercase tracking-wide`}
              />
              <span className="mt-1.5 block text-xs font-normal text-slate-500">
                Have a friend&apos;s invite? Enter it here.{" "}
                <Link
                  href="/refer-and-earn"
                  className={authLink}
                >
                  How Refer & Earn works
                </Link>
              </span>
            </label>
          </div>
        </section>

        <section>
          <h2 className={authSectionHeading}>2. Secure Credentials</h2>
          <div className="mt-3 space-y-4">
            <label className={authLabel}>
              Password
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters with letters, numbers, & symbols"
                autoComplete="new-password"
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
                autoComplete="new-password"
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
          {loading ? "Creating account…" : "Create Creator Account"}
        </button>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            href="/creator/login"
            className={authLink}
          >
            Sign in
          </Link>
          {" · "}
          <Link href="/brand/register" className={authLink}>
            Register as a brand
          </Link>
        </p>
      </form>
    </div>
  );
}
