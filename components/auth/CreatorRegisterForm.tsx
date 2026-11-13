"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import MathCaptcha from "@/components/auth/MathCaptcha";
import ReferralCapture from "@/components/auth/ReferralCapture";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import { register } from "@/lib/api/auth";
import { createCreatorOnboarding } from "@/lib/api/creator";
import { ApiClientError } from "@/lib/api/client";
import { getReferralCode, saveReferralCode, clearReferralCode } from "@/lib/auth/referralStorage";
import { rememberPublicCode, setAuthToken } from "@/lib/auth/session";

const field =
  "mt-2 h-12 w-full rounded-xl border border-indigo-100 bg-white px-4 text-base text-[#0F1B3D] placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/15";

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
    if (!linkedinUrl && !instagramUrl) {
      setError("Add at least one LinkedIn or Instagram link.");
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

      <div className="space-y-3">
        <SocialAuthButtons intent="login" />
      </div>

      <div className="my-7 flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-caption font-medium uppercase tracking-wide text-slate-400">
          Or create a creator account
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form className="space-y-8" onSubmit={onSubmit}>
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <section>
          <h2 className="text-card-heading">1. Account Details</h2>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-semibold text-[#0F1B3D]">
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
            <label className="block text-sm font-semibold text-[#0F1B3D]">
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
            <label className="block text-sm font-semibold text-[#0F1B3D]">
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
                  className="font-semibold text-violet-600 hover:underline"
                >
                  How Refer & Earn works
                </Link>
              </span>
            </label>
          </div>
        </section>

        <section>
          <h2 className="text-card-heading">2. Secure Credentials</h2>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-semibold text-[#0F1B3D]">
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
            <label className="block text-sm font-semibold text-[#0F1B3D]">
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
          <h2 className="text-card-heading">3. Social Media Links</h2>
          <p className="mt-1 text-sm text-slate-500">
            Add LinkedIn and/or Instagram so we can verify your creator profile.
          </p>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-semibold text-[#0F1B3D]">
              LinkedIn
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/your-profile"
                className={field}
              />
            </label>
            <label className="block text-sm font-semibold text-[#0F1B3D]">
              Instagram
              <input
                type="url"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/yourhandle"
                className={field}
              />
            </label>
          </div>
        </section>

        <MathCaptcha onChange={onCaptcha} />

        <label className="flex items-start gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
          />
          <span>
            I agree to JobOrio&apos;s{" "}
            <Link href="/terms" className="font-semibold text-violet-600 hover:underline">
              Terms & Conditions
            </Link>{" "}
            & Creator Privacy Policy
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="btn-tap flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB] px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create Creator Account"}
        </button>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login?next=/creator/dashboard"
            className="font-semibold text-violet-600 hover:underline"
          >
            Sign in
          </Link>
          {" · "}
          <Link href="/brand/register" className="font-semibold text-violet-600 hover:underline">
            Register as a brand
          </Link>
        </p>
      </form>
    </div>
  );
}
