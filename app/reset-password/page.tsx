"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
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
    <form className="mt-8 space-y-5" onSubmit={onSubmit}>
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <label className="block text-sm font-semibold text-[#0F1B3D]">
        Email
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-indigo-100 px-4"
        />
      </label>

      <label className="block text-sm font-semibold text-[#0F1B3D]">
        New password
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-indigo-100 px-4"
        />
      </label>

      <label className="block text-sm font-semibold text-[#0F1B3D]">
        Confirm password
        <input
          required
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-indigo-100 px-4"
        />
      </label>

      <button
        type="submit"
        disabled={loading || !token}
        className="flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Updating…" : "Update password"}
      </button>

      {!token ? (
        <p className="text-sm text-amber-700">
          Missing reset token. Open the link from your email, or{" "}
          <Link href="/forgot-password" className="font-semibold underline">
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
    <section className="relative overflow-x-clip rounded-b-[32px] bg-[linear-gradient(135deg,#0B1D4F_0%,#14296B_45%,#3F2AA8_100%)] px-4 pb-12 pt-[clamp(6.5rem,16vw,10rem)] text-white sm:rounded-b-[48px] sm:px-8 sm:pb-24">
      <div className="relative mx-auto max-w-lg">
        <div className="rounded-[24px] bg-white p-5 text-slate-900 shadow-2xl sm:rounded-[28px] sm:p-10">
          <h1 className="text-section-heading text-center text-[#0F1B3D]">Reset password</h1>
          <p className="text-section-copy mx-auto mt-4 text-center">
            Choose a new password for your JobOrio account.
          </p>
          <Suspense fallback={<p className="mt-8 text-center text-sm text-slate-400">Loading…</p>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
