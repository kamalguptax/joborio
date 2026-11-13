"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { resendEmailOtp, verifyEmailOtp } from "@/lib/api/brandAuth";
import { ApiClientError } from "@/lib/api/client";
import { rememberPublicCode, setAuthToken } from "@/lib/auth/session";

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
      router.push("/employer/dashboard");
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
    <form className="mt-8 space-y-5" onSubmit={onSubmit}>
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {info}
        </p>
      ) : null}

      <label className="block text-sm font-semibold text-[#0F1B3D]">
        Work email
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-indigo-100 px-4"
        />
      </label>

      <label className="block text-sm font-semibold text-[#0F1B3D]">
        6-digit verification code
        <input
          required
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="••••••"
          className="mt-2 h-12 w-full rounded-xl border border-indigo-100 px-4 tracking-[0.35em]"
        />
      </label>

      <button
        type="submit"
        disabled={loading || otp.length !== 6}
        className="flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Verifying…" : "Verify email"}
      </button>

      <button
        type="button"
        onClick={() => void resend()}
        className="w-full text-sm font-semibold text-violet-600 hover:underline"
      >
        Resend code
      </button>

      <p className="text-center text-sm text-slate-500">
        Wrong account?{" "}
        <Link href="/brand/register" className="font-semibold text-violet-600 hover:underline">
          Register again
        </Link>
      </p>
    </form>
  );
}

export default function BrandVerifyPage() {
  return (
    <section className="relative overflow-x-clip rounded-b-[32px] bg-[linear-gradient(135deg,#0B1D4F_0%,#14296B_45%,#3F2AA8_100%)] px-4 pb-12 pt-[clamp(6.5rem,16vw,10rem)] text-white sm:rounded-b-[48px] sm:px-8 sm:pb-24">
      <div className="relative mx-auto max-w-lg">
        <div className="rounded-[24px] bg-white p-5 text-slate-900 shadow-2xl sm:rounded-[28px] sm:p-10">
          <h1 className="text-section-heading text-center text-[#0F1B3D]">
            Verify your email
          </h1>
          <p className="text-section-copy mx-auto mt-4 text-center">
            We sent a one-time code to your work email. Enter it below to activate your brand
            account.
          </p>
          <Suspense fallback={<p className="mt-8 text-center text-sm text-slate-400">Loading…</p>}>
            <VerifyForm />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
