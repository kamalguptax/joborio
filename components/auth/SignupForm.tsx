"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { register } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { getReferralCode, saveReferralCode } from "@/lib/auth/referralStorage";
import { rememberPublicCode, setAuthToken } from "@/lib/auth/session";
import PromoteJobTypes from "@/components/jobs/PromoteJobTypes";
import { savePromoteJobTypes } from "@/lib/jobs/promoteTypes";
import AuthSocial from "@/components/auth/AuthSocial";
import PasswordField from "@/components/auth/PasswordField";
import {
  authError,
  authInput,
  authLabel,
  authLink,
  authPrimaryButton,
} from "@/components/auth/authStyles";

const roles = [
  { value: "creator", label: "Creator", hint: "I have an audience" },
  { value: "employer", label: "Employer", hint: "I'm hiring" },
  { value: "partner", label: "Partner", hint: "I own a community" },
] as const;

type SignupRole = (typeof roles)[number]["value"];

const SIGNUP_ROLE_KEY = "joborio_signup_role";
export const SIGNUP_NAME_KEY = "joborio_signup_name";

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
  const [referralOpen, setReferralOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

    const effectiveRole: SignupRole = inviteFromUrl ? "creator" : role;

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
        ...(refCode ? { referral_code: refCode } : {}),
      });
      setAuthToken(data.token);
      rememberPublicCode(data.user);
      savePromoteJobTypes(jobTypes);
      sessionStorage.setItem(SIGNUP_ROLE_KEY, effectiveRole);
      sessionStorage.setItem(SIGNUP_NAME_KEY, name.trim());
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

  const showReferral = referralOpen || inviteFromUrl || referralCode.length > 0;

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-5">
        {error ? (
          <p role="alert" className={authError}>
            {error}
          </p>
        ) : null}

        <fieldset>
          <legend className={authLabel}>I am a</legend>
          <div
            className={`mt-2 grid grid-cols-1 gap-2 ${
              visibleRoles.length > 1 ? "min-[420px]:grid-cols-3" : ""
            }`}
          >
            {visibleRoles.map((r) => (
              <label
                key={r.value}
                className={`flex min-h-12 cursor-pointer flex-col justify-center rounded-xl border px-3 py-2.5 text-center transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-violet-500/20 ${
                  role === r.value
                    ? "border-violet-500 bg-violet-50 text-violet-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-violet-300"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={role === r.value}
                  onChange={() => {
                    if (!inviteFromUrl) setRole(r.value);
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
          <label htmlFor="name" className={authLabel}>
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
            className={authInput}
          />
        </div>

        <div>
          <label htmlFor="email" className={authLabel}>
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
            className={authInput}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className={authLabel}>
              Password
            </label>
            <PasswordField
              id="password"
              value={password}
              onChange={setPassword}
              minLength={8}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className={authLabel}>
              Confirm password
            </label>
            <PasswordField
              id="confirmPassword"
              value={confirmPassword}
              onChange={setConfirmPassword}
              minLength={8}
              autoComplete="new-password"
              placeholder="Repeat password"
            />
          </div>
        </div>

        {showReferral ? (
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
              className={`${authInput} uppercase tracking-wide ${
                inviteFromUrl ? "bg-slate-50 text-slate-700" : ""
              }`}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              <Link href="/refer-and-earn" className={authLink}>
                How Refer &amp; Earn works
              </Link>
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setReferralOpen(true)}
            className={`text-sm ${authLink}`}
          >
            Have a referral code?
          </button>
        )}

        <label className="flex items-start gap-2.5 text-[13px] text-slate-500">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-violet-600"
          />
          <span>
            I agree to JobOrio&apos;s{" "}
            <Link href="/terms" className={authLink}>
              Terms &amp; Conditions
            </Link>
          </span>
        </label>

        <button type="submit" disabled={loading} className={authPrimaryButton}>
          {loading ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <div className="mt-7">
        <AuthSocial dividerLabel="or sign up with" />
      </div>
    </>
  );
}
