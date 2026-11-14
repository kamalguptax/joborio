"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import PasswordField from "@/components/auth/PasswordField";
import {
  authError,
  authInput,
  authLabel,
  authLink,
  authPrimaryButton,
} from "@/components/auth/authStyles";
import { resetPassword } from "@/lib/api/brandAuth";
import { ApiClientError } from "@/lib/api/client";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmail(params.get("email") || "");
    setToken(params.get("token") || "");
  }, [params]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword({
        email: email.trim(),
        token,
        password,
        password_confirmation: confirm,
      });
      router.push("/login?reset=1");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
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
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={authInput}
        />
      </div>

      <div>
        <label htmlFor="password" className={authLabel}>
          New password
        </label>
        <PasswordField
          id="password"
          value={password}
          onChange={setPassword}
          minLength={8}
          autoComplete="new-password"
          placeholder="Min. 8 characters"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className={authLabel}>
          Confirm password
        </label>
        <PasswordField
          id="confirmPassword"
          value={confirm}
          onChange={setConfirm}
          minLength={8}
          autoComplete="new-password"
          placeholder="Repeat password"
        />
      </div>

      <button type="submit" disabled={loading || !token} className={authPrimaryButton}>
        {loading ? "Updating…" : "Update password"}
      </button>

      {!token ? (
        <p className="text-sm text-amber-700">
          Missing reset token. Open the link from your email, or{" "}
          <Link href="/forgot-password" className={authLink}>
            request a new one
          </Link>
          .
        </p>
      ) : null}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      variant="login"
      title="Reset password"
      subtitle="Choose a new password for your JobOrio account."
      footer={
        <Link href="/login" className={authLink}>
          Back to log in
        </Link>
      }
    >
      <Suspense fallback={<p className="text-sm text-slate-400">Loading…</p>}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
