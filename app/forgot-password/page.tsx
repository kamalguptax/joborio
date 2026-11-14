"use client";

import Link from "next/link";
import { FormEvent, useCallback, useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import MathCaptcha from "@/components/auth/MathCaptcha";
import {
  authError,
  authInput,
  authLabel,
  authLink,
  authPrimaryButton,
  authSuccess,
} from "@/components/auth/authStyles";
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
    <AuthShell
      variant="login"
      title="Forgot password?"
      subtitle="Enter your email and we’ll send you a secure link to reset it."
      footer={
        <Link href="/login" className={authLink}>
          Back to log in
        </Link>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        {error ? (
          <p role="alert" className={authError}>
            {error}
          </p>
        ) : null}
        {done ? (
          <p role="status" className={authSuccess}>
            {done}
          </p>
        ) : null}

        <div>
          <label htmlFor="email" className={authLabel}>
            Email
          </label>
          <input
            id="email"
            name="email"
            required
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInput}
          />
        </div>

        <MathCaptcha onChange={onCaptcha} />

        <button type="submit" disabled={loading} className={authPrimaryButton}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
