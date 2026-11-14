"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useState } from "react";
import { sanitizeNextParam } from "@/lib/auth/safeRedirect";
import { login, fetchMe } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import {
  postLoginRedirect,
  rememberPublicCode,
  setAuthToken,
} from "@/lib/auth/session";
import MathCaptcha from "@/components/auth/MathCaptcha";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextAfterLogin = sanitizeNextParam(searchParams.get("next"));
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
      const data = await login({
        email,
        password,
        captcha_id: captcha.captcha_id,
        captcha_answer: captcha.captcha_answer,
      });
      setAuthToken(data.token);
      rememberPublicCode(data.user);
      if (nextAfterLogin) {
        router.push(nextAfterLogin);
        return;
      }

      const me = await fetchMe();
      rememberPublicCode(me);
      const isAdmin = me.roles?.some((r) => r.name === "admin");
      const isPublisher =
        me.roles?.some((r) => r.name === "publisher") ||
        (me.publisher_users?.some((m) => m.is_active) ?? false);
      const isNetworkMember = me.roles?.some((r) => r.name === "network_member");
      if (isAdmin) {
        router.push("/admin/dashboard");
      } else if (isPublisher) {
        router.push("/publisher/dashboard");
      } else if (isNetworkMember) {
        router.push("/network/dashboard");
      } else if (me.roles?.some((r) => r.name === "employer") && !me.creator) {
        router.push("/employer/dashboard");
      } else if (me.creator) {
        router.push("/creator/dashboard");
      } else {
        router.push(postLoginRedirect(false));
      }
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
    <>
      <div className="mt-5 space-y-3">
        <SocialAuthButtons intent="login" />
      </div>

      <div className="my-4 flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Or continue with email
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form className="space-y-3.5" onSubmit={onSubmit}>
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-semibold text-[#26385D]"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-500/10"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-sm font-semibold text-[#26385D]"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-purple-600 transition hover:text-blue-600"
            >
              Forgot Password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-500/10"
          />
        </div>

        <MathCaptcha onChange={onCaptcha} />

        <button
          type="submit"
          disabled={loading}
          className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-500/25 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Login to JobOrio"}
        </button>
      </form>
    </>
  );
}
