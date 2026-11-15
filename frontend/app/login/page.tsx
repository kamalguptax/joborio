import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import { authLink } from "@/components/auth/authStyles";
import { FormSkeleton } from "@/components/ui/Skeleton";
import GuestOnly from "@/components/auth/GuestOnly";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your JobOrio account and continue earning on performance.",
};

export default function LoginPage() {
  return (
    <GuestOnly>
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your JobOrio account and continue earning on performance."
      topPrompt="New to JobOrio?"
      topLinkLabel="Create an account"
      topLinkHref="/signup"
      panelHeading="Good to see you again."
      panelBody="Your campaigns, clicks and payouts are right where you left them."
    >
      <Suspense fallback={<FormSkeleton />}>
        <LoginForm />
      </Suspense>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className={authLink}>
          Sign up
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-slate-500">
        Publisher network?{" "}
        <Link href="/publisher/login" className={authLink}>
          Publisher login
        </Link>
        {" · "}
        <Link href="/publisher/register" className={authLink}>
          Apply
        </Link>
      </p>
    </AuthShell>
    </GuestOnly>
  );
}
