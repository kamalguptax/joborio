"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { resendEmailOtp, verifyEmailOtp } from "@/lib/api/brandAuth";
import { ApiClientError } from "@/lib/api/client";
import { rememberPublicCode, setAuthToken } from "@/lib/auth/session";
import { markOnboardingPending } from "@/lib/auth/onboardingFlag";
import AuthShell from "@/components/auth/AuthShell";
import {
  authAlertError,
  authAlertSuccess,
  authField,
  authLabel,
  authLink,
  authPrimaryButton,
} from "@/components/auth/authStyles";
import { FormSkeleton } from "@/components/ui/Skeleton";

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fromQuery = params.get("email");
    const stored =
      typeof window !== "undefined"
        ? sessionStorage.getItem("joborio_brand_verify_email")
        : null;
    setEmail((fromQuery || stored || "").trim());
  }, [params]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const data = await verifyEmailOtp({ email, otp: otp.trim() });
      setAuthToken(data.token);
      rememberPublicCode(data.user);
      sessionStorage.removeItem("joborio_brand_verify_email");
      markOnboardingPending(data.user.id, "employer");
      router.push("/brand/onboarding");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setError(null);
    setInfo(null);
    try {
      const data = await resendEmailOtp({ email });
      setInfo(
        data.debug_otp
          ? `${data.message} Dev OTP: ${data.debug_otp}`
          : data.message,
      );
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not resend code.");
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {error ? (
        <p className={authAlertError}>{error}</p>
      ) : null}
      {info ? (
        <p className={authAlertSuccess}>{info}</p>
      ) : null}

      <label className={authLabel}>
        Work email<span className="text-violet-600">*</span>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={authField}
        />
      </label>

      <label className={authLabel}>
        6-digit verification code<span className="text-violet-600">*</span>
        <input
          required
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="••••••"
          className={`${authField} text-center text-lg tracking-[0.5em]`}
        />
      </label>

      <button
        type="submit"
        disabled={loading || otp.length !== 6}
        className={authPrimaryButton}
      >
        {loading ? "Verifying…" : "Verify email"}
      </button>

      <button
        type="button"
        onClick={() => void resend()}
        className={`${authLink} w-full text-center text-sm`}
      >
        Resend code
      </button>

      <p className="text-center text-sm text-slate-500">
        Wrong account?{" "}
        <Link href="/brand/register" className={authLink}>
          Register again
        </Link>
      </p>
    </form>
  );
}

export default function BrandVerifyPage() {
  return (
    <AuthShell
      title="Verify your email"
      subtitle="We sent a one-time code to your work email. Enter it below to activate your brand account."
      topPrompt="Wrong account?"
      topLinkLabel="Register again"
      topLinkHref="/brand/register"
      panelHeading="One quick step to go."
      panelBody="Confirm your work email to activate your brand account."
    >
      <Suspense fallback={<FormSkeleton />}>
        <VerifyForm />
      </Suspense>
    </AuthShell>
  );
}
