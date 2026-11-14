import type { Metadata } from "next";
import { Suspense } from "react";
import SignupForm from "@/components/auth/SignupForm";
import ReferralCapture from "@/components/auth/ReferralCapture";

export const metadata: Metadata = {
  title: "Get Started",
  description: "Create your Joborio profile and start sharing opportunities.",
};

export default function SignupPage() {
  return (
    <section className="relative overflow-x-clip rounded-b-[32px] bg-[linear-gradient(135deg,#0B1D4F_0%,#14296B_45%,#3F2AA8_100%)] px-4 pb-12 pt-[clamp(6.5rem,16vw,10rem)] text-white sm:rounded-b-[48px] sm:px-8 sm:pb-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-1/4 hidden h-[min(480px,60vw)] w-[min(480px,60vw)] rounded-full bg-violet-600/30 blur-3xl sm:block"
      />

      <div className="relative mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-2 lg:gap-16">
        <div className="min-w-0">
          <h1 className="text-page-hero">
            Your audience has value.
            <span className="mt-1 block bg-gradient-to-r from-[#D8B4FE] via-[#A78BFA] to-[#D8B4FE] bg-clip-text text-transparent">
              Start earning today.
            </span>
          </h1>
          <p className="text-section-copy mt-4 text-slate-300">
            Tell us a little about yourself and we will get you set up as a creator,
            employer or partner.
          </p>
        </div>

        <div className="min-w-0 rounded-[24px] bg-white p-5 text-slate-900 shadow-2xl sm:rounded-[28px] sm:p-8">
          <Suspense fallback={null}>
            <ReferralCapture />
          </Suspense>
          <SignupForm />
        </div>
      </div>
    </section>
  );
}
