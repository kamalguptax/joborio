"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useState } from "react";
import MathCaptcha, { isCaptchaFailureMessage } from "@/components/auth/MathCaptcha";
import {
  authAlertError,
  authField,
  authLabel,
  authLink,
  authPrimaryButton,
} from "@/components/auth/authStyles";
import { fetchMe } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { homePathForUser, navigateTo } from "@/lib/auth/redirect";
import { loginPublisher } from "@/lib/api/publisherAuth";
import { getAuthToken, rememberPublicCode, setAuthToken } from "@/lib/auth/session";
import { cacheUser } from "@/lib/auth/userCache";

const field = authField;

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
      // Publisher accounts land on the publisher dashboard; any other
      // account type is sent to its own dashboard instead.
      const me = await fetchMe();
      rememberPublicCode(me);
      cacheUser(me, getAuthToken()); // header shows the avatar instantly
      navigateTo(router, homePathForUser(me));
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
    <form className="space-y-4" onSubmit={onSubmit}>
      {error ? (
        <p className={authAlertError}>{error}</p>
      ) : null}

      <label className={authLabel}>
        Email address<span className="text-violet-600">*</span>
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

      <label className={authLabel}>
        Password<span className="text-violet-600">*</span>
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
        <Link href="/forgot-password" className={authLink}>
          Forgot password?
        </Link>
        <Link href="/creator/login" className="font-semibold text-slate-500 transition hover:text-violet-600">
          Creator login
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={authPrimaryButton}
      >
        {loading ? "Signing in…" : "Sign in to publisher studio"}
      </button>

      <p className="text-center text-sm text-slate-500">
        New publisher?{" "}
        <Link href="/publisher/register" className={authLink}>
          Apply here
        </Link>
      </p>
    </form>
  );
}
