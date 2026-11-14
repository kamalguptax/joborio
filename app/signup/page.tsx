import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import ReferralCapture from "@/components/auth/ReferralCapture";
import SignupForm from "@/components/auth/SignupForm";
import { authLink } from "@/components/auth/authStyles";

export const metadata: Metadata = {
  title: "Get Started",
  description: "Create your Joborio profile and start sharing opportunities.",
};

export default function SignupPage() {
  return (
    <AuthShell
      variant="signup"
      title="Get started"
      subtitle="Create your JobOrio account as a creator, employer or partner."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className={authLink}>
            Log in
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <ReferralCapture />
      </Suspense>
      <SignupForm />
    </AuthShell>
  );
}
