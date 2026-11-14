"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useState } from "react";
import MathCaptcha from "@/components/auth/MathCaptcha";
import { ApiClientError } from "@/lib/api/client";
import { loginPublisher } from "@/lib/api/publisherAuth";
import { rememberPublicCode, setAuthToken } from "@/lib/auth/session";

const field =
  "mt-2 h-12 w-full rounded-xl border border-indigo-100 bg-white px-4 text-base text-[#0F1B3D] placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/15";

export default function PublisherLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState({ captcha_id: "", captcha_answer: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onCaptcha = useCallback((v: { captcha_id: string; captcha_answer: string }) => {
    setCaptcha(v);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!captcha.captcha_id || !captcha.captcha_answer) {
      setError("Complete the captcha.");
      return;
    }
    setLoading(true);
    try {
      const data = await loginPublisher({
        email,
        password,
        captcha_id: captcha.captcha_id,
        captcha_answer: captcha.captcha_answer,
      });
      setAuthToken(data.token);
      rememberPublicCode(data.user);
      router.push("/publisher/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Unable to sign in. Check the API is running.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-5 space-y-3.5" onSubmit={onSubmit}>
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <label className="block text-sm font-semibold text-slate-700">
        Email
        <input
          id="publisher-email"
          type="email"
          autoComplete="email"
          className={field}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        Password
        <input
          id="publisher-password"
          type="password"
          autoComplete="current-password"
          className={field}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>

      <MathCaptcha onChange={onCaptcha} />

      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="font-semibold text-violet-600">
          Forgot password?
        </Link>
        <Link href="/login" className="font-semibold text-slate-500">
          Creator / brand login
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-sm font-bold text-white shadow-lg disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in to publisher studio"}
      </button>

      <p className="text-center text-sm text-slate-500">
        New publisher?{" "}
        <Link href="/publisher/register" className="font-bold text-violet-600">
          Apply here
        </Link>
      </p>
    </form>
  );
}
