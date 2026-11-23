import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import GuestOnly from "@/components/auth/GuestOnly";
import { authLink } from "@/components/auth/authStyles";
import { FormSkeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = {
  title: "Brand login",
  description: "Sign in to your JobOrio brand account to manage campaigns, billing and results.",
};

export default function BrandLoginPage() {
  return (
    <GuestOnly prefer="employer">
      <AuthShell
        title="Brand login"
        subtitle="Sign in to manage your campaigns, billing and results."
        topPrompt="New brand?"
        topLinkLabel="Register your brand"
        topLinkHref="/brand/register"
        roleSwitch={{ mode: "login", current: "brand" }}
        panelHeading="Your campaigns, one dashboard."
        panelBody="Track clicks, registrations and spend by creator, and pay only for results."
      >
        <Suspense fallback={<FormSkeleton />}>
          <LoginForm prefer="employer" />
        </Suspense>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have a brand account?{" "}
          <Link href="/brand/register" className={authLink}>
            Register your brand
          </Link>
        </p>
      </AuthShell>
    </GuestOnly>
  );
}
