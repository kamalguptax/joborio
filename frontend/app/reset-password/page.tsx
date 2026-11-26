"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { resetPassword } from "@/lib/api/brandAuth";
import AuthShell from "@/components/auth/AuthShell";
import PasswordInput from "@/components/auth/PasswordInput";
import {
  authAlertError,
  authField,
  authLabel,
  authLink,
  authPrimaryButton,
} from "@/components/auth/authStyles";
import { ApiClientError } from "@/lib/api/client";
import { FormSkeleton } from "@/components/ui/Skeleton";

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
    <form className="space-y-4" onSubmit={onSubmit}>
      {error ? (
        <p className={authAlertError}>{error}</p>
      ) : null}

      <label className={authLabel}>
        Email address<span className="text-violet-600">*</span>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={authField}
        />
      </label>

      <label className={authLabel}>
        New password<span className="text-violet-600">*</span>
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={authField}
        />
      </label>

      <label className={authLabel}>
        Confirm password<span className="text-violet-600">*</span>
        <input
          required
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={authField}
        />
      </label>

      <button
        type="submit"
        disabled={loading || !token}
        className={authPrimaryButton}
      >
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
      title="Reset password"
      subtitle="Choose a new password for your JobOrio account."
      topPrompt="Remembered it?"
      topLinkLabel="Log in"
      topLinkHref="/login"
      panelHeading="Almost back in."
      panelBody="Pick a strong password and you can get straight back to your dashboard."
    >
      <Suspense fallback={<FormSkeleton />}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
