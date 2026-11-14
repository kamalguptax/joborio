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
import AuthSocial from "@/components/auth/AuthSocial";
import PasswordField from "@/components/auth/PasswordField";
import {
  authError,
  authInput,
  authLabel,
  authLink,
  authPrimaryButton,
  authSuccess,
} from "@/components/auth/authStyles";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextAfterLogin = sanitizeNextParam(searchParams.get("next"));
  const justReset = searchParams.get("reset") === "1";
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
      if (isAdmin) {
        router.push("/admin/dashboard");
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
      <form className="space-y-5" onSubmit={onSubmit}>
        {justReset ? (
          <p className={authSuccess}>Password updated. Log in with your new password.</p>
        ) : null}
        {error ? (
          <p role="alert" className={authError}>
            {error}
          </p>
        ) : null}

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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={authInput}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className={authLabel}>
              Password
            </label>
            <Link href="/forgot-password" className={`text-xs ${authLink}`}>
              Forgot?
            </Link>
          </div>
          <PasswordField
            id="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            placeholder="Enter your password"
          />
        </div>

        <MathCaptcha onChange={onCaptcha} />

        <button type="submit" disabled={loading} className={authPrimaryButton}>
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <div className="mt-7">
        <AuthSocial dividerLabel="or log in with" />
      </div>
    </>
  );
}
