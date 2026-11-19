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
import { createCreatorOnboarding } from "@/lib/api/creator";
import { ApiClientError } from "@/lib/api/client";
import { getReferralCode, saveReferralCode, clearReferralCode } from "@/lib/auth/referralStorage";
import { rememberPublicCode, setAuthToken } from "@/lib/auth/session";

const field = authField;

function makeHandle(name: string, email: string): string {
  const fromName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const fromEmail = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_|_$/g, "");
  const base = (fromName || fromEmail || "creator").slice(0, 24);
  return base.length >= 3 ? base : `creator_${Date.now().toString(36)}`;
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function CreatorRegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [community, setCommunity] = useState("");
  const [website, setWebsite] = useState("");
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

    const linkedinUrl = normalizeUrl(linkedin);
    const instagramUrl = normalizeUrl(instagram);
    const communityUrl = normalizeUrl(community);
    const websiteUrl = normalizeUrl(website);
    if (!linkedinUrl && !instagramUrl && !communityUrl && !websiteUrl) {
      setError(
        "Add at least one LinkedIn, Instagram, community, or website link. We approve creator accounts manually.",
      );
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

      const baseHandle = makeHandle(fullName.trim(), email.trim());
      const social_links = {
        ...(linkedinUrl ? { linkedin: linkedinUrl } : {}),
        ...(instagramUrl ? { instagram: instagramUrl } : {}),
        ...(communityUrl ? { community: communityUrl } : {}),
        ...(websiteUrl ? { website: websiteUrl } : {}),
      };

      let onboarded = false;
      let lastError: unknown = null;
      const attempts: string[] = [
        baseHandle,
        `${baseHandle}_${Math.floor(Math.random() * 900 + 100)}`.slice(0, 30),
      ];
      for (const handle of attempts) {
        try {
          await createCreatorOnboarding({
            handle,
            social_links,
            ...(code ? { referral_code: code } : {}),
          });
          onboarded = true;
          break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!onboarded) {
        throw lastError instanceof Error
          ? lastError
          : new Error("Could not finish creator profile.");
      }

      clearReferralCode();
      router.push("/creator/dashboard");
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

        <section>
          <h2 className={authSectionHeading}>3. Profile links (required)</h2>
          <p className="mt-1 text-sm text-slate-500">
            Add at least one LinkedIn, Instagram, community, or website link.
            Accounts stay <span className="font-semibold text-amber-700">pending</span> until
            an admin approves them manually.
          </p>
          <div className="mt-3 space-y-4">
            <label className={authLabel}>
              LinkedIn
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/your-profile"
                className={field}
              />
            </label>
            <label className={authLabel}>
              Instagram
              <input
                type="url"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/yourhandle"
                className={field}
              />
            </label>
            <label className={authLabel}>
              Community link
              <input
                type="url"
                value={community}
                onChange={(e) => setCommunity(e.target.value)}
                placeholder="https://t.me/yourgroup or Discord invite"
                className={field}
              />
            </label>
            <label className={authLabel}>
              Website / portfolio
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourwebsite.com"
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
