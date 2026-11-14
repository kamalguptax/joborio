"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import MathCaptcha from "@/components/auth/MathCaptcha";
import { register } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { getReferralCode, saveReferralCode } from "@/lib/auth/referralStorage";
import { rememberPublicCode, setAuthToken } from "@/lib/auth/session";
import PromoteJobTypes from "@/components/jobs/PromoteJobTypes";
import { savePromoteJobTypes } from "@/lib/jobs/promoteTypes";

const roles = [
  { value: "creator", label: "Creator", hint: "I have an audience" },
  { value: "employer", label: "Employer", hint: "I'm hiring" },
  { value: "partner", label: "Publisher", hint: "I run a network" },
] as const;

type SignupRole = (typeof roles)[number]["value"];

const field =
  "mt-2 h-12 w-full rounded-xl border border-indigo-100 bg-white px-4 text-base text-[#0F1B3D] placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/15";

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
  const [role, setRole] = useState<SignupRole>("creator");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [jobTypes, setJobTypes] = useState<string[]>([]);
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
      setRole("creator");
      setReferralCode(fromUrl);
      saveReferralCode(fromUrl);
      return;
    }
    setInviteFromUrl(false);
    const existing = getReferralCode();
    if (existing) setReferralCode(existing);
  }, []);

  const visibleRoles = inviteFromUrl
    ? roles.filter((r) => r.value === "creator")
    : roles;

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

    const effectiveRole: SignupRole = inviteFromUrl ? "creator" : role;

    if (effectiveRole === "partner") {
      router.push("/publisher/register");
      return;
    }

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
      savePromoteJobTypes(jobTypes);
      sessionStorage.setItem(SIGNUP_ROLE_KEY, effectiveRole);
      if (effectiveRole === "employer") {
        router.push("/employer/onboarding");
      } else {
        router.push("/onboarding");
      }
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
    <form onSubmit={onSubmit} className="space-y-5">
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <fieldset>
        <legend className="text-sm font-semibold text-[#0F1B3D]">I am a</legend>
        <div
          className={`mt-2 grid grid-cols-1 gap-2 ${
            visibleRoles.length > 1 ? "min-[420px]:grid-cols-3" : ""
          }`}
        >
          {visibleRoles.map((r) => (
            <label
              key={r.value}
              className={`flex min-h-11 cursor-pointer flex-col justify-center rounded-xl border px-3 py-3 text-center transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-violet-500/20 ${
                role === r.value
                  ? "border-violet-500 bg-violet-50 text-violet-700"
                  : "border-indigo-100 bg-white text-slate-600 hover:border-violet-300"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={role === r.value}
                onChange={() => {
                  if (inviteFromUrl) return;
                  if (r.value === "partner") {
                    router.push("/publisher/register");
                    return;
                  }
                  setRole(r.value);
                }}
                className="sr-only"
              />
              <span className="block text-sm font-semibold">{r.label}</span>
              <span className="mt-0.5 block text-[11px] leading-tight text-slate-500">
                {r.hint}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <PromoteJobTypes
        selected={jobTypes}
        onToggle={(id) =>
          setJobTypes((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
          )
        }
      />

      <div>
        <label htmlFor="name" className="text-sm font-semibold text-[#0F1B3D]">
          Full name
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
        <label htmlFor="email" className="text-sm font-semibold text-[#0F1B3D]">
          Email
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
        <label htmlFor="referralCode" className="text-sm font-semibold text-[#0F1B3D]">
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
          className={`${field} uppercase tracking-wide ${
            inviteFromUrl ? "bg-slate-50 text-slate-700" : ""
          }`}
        />
        <p className="mt-1.5 text-xs text-slate-500">
          Have a friend’s invite? Enter it here, or open their referral link.{" "}
          <Link href="/refer-and-earn" className="font-semibold text-violet-600 hover:text-blue-600">
            How Refer & Earn works
          </Link>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-semibold text-[#0F1B3D]">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((on) => !on)}
              className="text-xs font-semibold text-violet-600 hover:text-blue-600"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label
            htmlFor="confirmPassword"
            className="text-sm font-semibold text-[#0F1B3D]"
          >
            Confirm
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={field}
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
          <Link href="/terms" className="font-semibold text-violet-600 hover:text-blue-600">
            Terms & Conditions
          </Link>
        </span>
      </label>

      <MathCaptcha onChange={onCaptcha} />

      <button
        type="submit"
        disabled={loading}
        className="btn-tap inline-flex h-12 min-h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB] px-8 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 disabled:opacity-60 sm:h-[52px]"
      >
        {loading ? "Creating account…" : "Get Started"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-violet-600 hover:text-blue-600">
          Log in
        </Link>
      </p>
    </form>
  );
}
