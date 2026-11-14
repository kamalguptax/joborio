"use client";

import Link from "next/link";
import { FormEvent, useCallback, useState } from "react";
import MathCaptcha from "@/components/auth/MathCaptcha";
import { forgotPassword } from "@/lib/api/brandAuth";
import { ApiClientError } from "@/lib/api/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState({ captcha_id: "", captcha_answer: "" });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onCaptcha = useCallback((v: { captcha_id: string; captcha_answer: string }) => {
    setCaptcha(v);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(null);
    if (!captcha.captcha_id || !captcha.captcha_answer) {
      setError("Complete the captcha.");
      return;
    }
    setLoading(true);
    try {
      const data = await forgotPassword({
        email: email.trim(),
        captcha_id: captcha.captcha_id,
        captcha_answer: captcha.captcha_answer,
      });
      setDone(data.message);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-x-clip rounded-b-[32px] bg-[linear-gradient(135deg,#0B1D4F_0%,#14296B_45%,#3F2AA8_100%)] px-4 pb-12 pt-[clamp(6.5rem,16vw,10rem)] text-white sm:rounded-b-[48px] sm:px-8 sm:pb-24">
      <div className="relative mx-auto max-w-lg">
        <div className="rounded-[24px] bg-white p-5 text-slate-900 shadow-2xl sm:rounded-[28px] sm:p-10">
          <h1 className="text-section-heading text-center text-[#0F1B3D]">Forgot password</h1>
          <p className="text-section-copy mx-auto mt-4 text-center">
            Enter your work email and we&apos;ll send a secure reset link.
          </p>

          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            {done ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {done}
              </p>
            ) : null}

            <label className="block text-sm font-semibold text-[#0F1B3D]">
              Email
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-indigo-100 px-4"
              />
            </label>

            <MathCaptcha onChange={onCaptcha} />

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            <Link href="/login" className="font-semibold text-violet-600 hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
