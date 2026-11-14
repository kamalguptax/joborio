import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import { authLink } from "@/components/auth/authStyles";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your JobOrio account.",
};

export default function LoginPage() {
  return (
    <AuthShell
      variant="login"
      title="Welcome back"
      subtitle="Log in to your JobOrio account and keep earning on performance."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className={authLink}>
            Sign up
          </Link>
        </>
      }
    >
      <Suspense fallback={<p className="text-sm text-slate-400">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
