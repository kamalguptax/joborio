import type { Metadata } from "next";
import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import SignupForm from "@/components/auth/SignupForm";
import ReferralCapture from "@/components/auth/ReferralCapture";
import GuestOnly from "@/components/auth/GuestOnly";

export const metadata: Metadata = {
  title: "Get Started",
  description: "Create your Upclift profile and start sharing opportunities.",
};

export default function SignupPage() {
  return (
    <GuestOnly>
    <AuthShell
      title="Sign up to start earning"
      subtitle="It's completely free. Create your creator account in a minute."
      topPrompt="Already have an account?"
      topLinkLabel="Creator login"
      topLinkHref="/creator/login"
      roleSwitch={{ mode: "signup", current: "creator" }}
      wide
    >
      <Suspense fallback={null}>
        <ReferralCapture />
      </Suspense>
      <SignupForm />
    </AuthShell>
    </GuestOnly>
  );
}
