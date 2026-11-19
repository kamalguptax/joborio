"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useState } from "react";
import { sanitizeNextParam } from "@/lib/auth/safeRedirect";
import { login, fetchMe } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { clearAuthToken, getAuthToken, rememberPublicCode, setAuthToken } from "@/lib/auth/session";
import { cacheUser } from "@/lib/auth/userCache";
import { canVisit, homePathForUser, navigateTo, roleFlags } from "@/lib/auth/redirect";
import { ADMIN_LOGIN_URL } from "@/lib/siteUrls";
import MathCaptcha, { isCaptchaFailureMessage } from "@/components/auth/MathCaptcha";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import AuthDivider from "@/components/auth/AuthDivider";
import {
  authAlertError,
  authField,
  authLabel,
  authLink,
  authPrimaryButton,
} from "@/components/auth/authStyles";

export default function LoginForm({ prefer }: { prefer?: "employer" } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextAfterLogin = sanitizeNextParam(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState({ captcha_id: "", captcha_answer: "" });
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onCaptcha = useCallback((v: { captcha_id: string; captcha_answer: string }) => {
    setCaptcha(v);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
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

      const me = await fetchMe();
      rememberPublicCode(me);
      cacheUser(me, getAuthToken()); // header shows the avatar instantly

      // Admin accounts use the separate admin app (own login).
      if (roleFlags(me).isAdmin) {
        clearAuthToken();
        window.location.href = ADMIN_LOGIN_URL;
        return;
      }

      // ?next= is honoured only if it belongs to THIS account type;
      // otherwise the user goes to their own dashboard / onboarding.
      const target =
        nextAfterLogin && canVisit(nextAfterLogin, me)
          ? nextAfterLogin
          : homePathForUser(me, { prefer });
      navigateTo(router, target);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Unable to sign in. Check the API is running.";
      setError(message);
      if (isCaptchaFailureMessage(message)) {
        setCaptcha({ captcha_id: "", captcha_answer: "" });
        setCaptchaResetKey((k) => k + 1);
      }
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

        <MathCaptcha onChange={onCaptcha} resetKey={captchaResetKey} />

        <button type="submit" disabled={loading} className={authPrimaryButton}>
          {loading ? "Signing in…" : "Log in to JobOrio"}
        </button>
      </form>
    </>
  );
}
