"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useState } from "react";
import { sanitizeNextParam } from "@/lib/auth/safeRedirect";
import { login, fetchMe } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { rememberPublicCode, setAuthToken } from "@/lib/auth/session";
import { homePathForUser } from "@/lib/auth/redirect";
import MathCaptcha from "@/components/auth/MathCaptcha";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import AuthDivider from "@/components/auth/AuthDivider";
import {
  authAlertError,
  authField,
  authLabel,
  authLink,
  authPrimaryButton,
} from "@/components/auth/authStyles";

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
      router.push(homePathForUser(me));
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
      <SocialAuthButtons intent="login" />

      <AuthDivider />

      <form className="space-y-4" onSubmit={onSubmit}>
        {error ? <p className={authAlertError}>{error}</p> : null}

        <div>
          <label htmlFor="email" className={authLabel}>
            Email address<span className="text-violet-600">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={authField}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className={authLabel}>
              Password<span className="text-violet-600">*</span>
            </label>
            <Link href="/forgot-password" className={`${authLink} text-xs`}>
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className={authField}
          />
        </div>

        <MathCaptcha onChange={onCaptcha} />

        <button type="submit" disabled={loading} className={authPrimaryButton}>
          {loading ? "Signing in…" : "Log in to JobOrio"}
        </button>
      </form>
    </>
  );
}
