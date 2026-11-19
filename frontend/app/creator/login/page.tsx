import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import GuestOnly from "@/components/auth/GuestOnly";
import { authLink } from "@/components/auth/authStyles";
import { FormSkeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = {
  title: "Creator login",
  description: "Sign in to your JobOrio creator account to track clicks, registrations and earnings.",
};

export default function CreatorLoginPage() {
  return (
    <GuestOnly>
      <AuthShell
        title="Creator login"
        subtitle="Sign in to track your clicks, registrations and earnings."
        topPrompt="New creator?"
        topLinkLabel="Create an account"
        topLinkHref="/creator/register"
        panelHeading="Good to see you again."
        panelBody="Your links, clicks and payouts are right where you left them."
      >
        <Suspense fallback={<FormSkeleton />}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/creator/register" className={authLink}>
            Sign up as a creator
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-slate-500">
          Not a creator?{" "}
          <Link href="/brand/login" className={authLink}>
            Brand login
          </Link>
          {" · "}
          <Link href="/publisher/login" className={authLink}>
            Publisher login
          </Link>
        </p>
      </AuthShell>
    </GuestOnly>
  );
}
