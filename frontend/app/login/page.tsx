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
  description: "Sign in to your Upclift account and continue earning on performance.",
};

export default function LoginPage() {
  return (
    <GuestOnly>
    <AuthShell
      title="Log in to Upclift"
      subtitle="Pick your account type above, or sign in below and we'll take you to the right dashboard."
      topPrompt="New to Upclift?"
      topLinkLabel="Create an account"
      topLinkHref="/signup"
      roleSwitch={{ mode: "login", current: null }}
      panelHeading="Good to see you again."
      panelBody="Your campaigns, clicks and payouts are right where you left them."
    >
      <Suspense fallback={<FormSkeleton />}>
        <LoginForm />
      </Suspense>

      <p className="mt-6 text-center text-sm text-slate-500">
        New here? Sign up as{" "}
        <Link href="/creator/register" className={authLink}>
          Creator
        </Link>
        {" · "}
        <Link href="/publisher/register" className={authLink}>
          Publisher
        </Link>
        {" · "}
        <Link href="/brand/register" className={authLink}>
          Brand
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-slate-400">
        Network Member (joined via a publisher invite)? Sign in above.
      </p>
    </AuthShell>
    </GuestOnly>
  );
}
