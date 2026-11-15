"use client";

import Link from "next/link";
import { FormEvent, useCallback, useState } from "react";
import MathCaptcha from "@/components/auth/MathCaptcha";
import AuthShell from "@/components/auth/AuthShell";
import {
  authAlertError,
  authAlertSuccess,
  authField,
  authLabel,
  authLink,
  authPrimaryButton,
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
      title="Forgot password"
      subtitle="Enter your work email and we'll send a secure reset link."
      topPrompt="Remembered it?"
      topLinkLabel="Log in"
      topLinkHref="/login"
      panelHeading="Locked out? It happens."
      panelBody="We'll email you a secure link to set a new password."
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        {error ? <p className={authAlertError}>{error}</p> : null}
        {done ? <p className={authAlertSuccess}>{done}</p> : null}

        <label className={authLabel}>
          Email address<span className="text-violet-600">*</span>
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={authField}
          />
        </label>

        <MathCaptcha onChange={onCaptcha} />

        <button type="submit" disabled={loading} className={authPrimaryButton}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/login" className={authLink}>
          Back to login
        </Link>
      </p>
    </AuthShell>
  );
}
