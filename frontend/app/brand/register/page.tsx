import type { Metadata } from "next";
import BrandRegisterForm from "@/components/auth/BrandRegisterForm";

export const metadata: Metadata = {
  title: "Brand & Company Registration",
  description:
    "Amplifying your brand presence through modern creator campaigns. Create your brand account on JobOrio.",
};

export default function BrandRegisterPage() {
  return (
    <section className="relative overflow-x-clip rounded-b-[32px] bg-[linear-gradient(135deg,#0B1D4F_0%,#14296B_45%,#3F2AA8_100%)] px-4 pb-12 pt-[clamp(6.5rem,16vw,10rem)] text-white sm:rounded-b-[48px] sm:px-8 sm:pb-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-1/4 hidden h-[min(480px,60vw)] w-[min(480px,60vw)] rounded-full bg-violet-600/30 blur-3xl sm:block"
      />

      <div className="relative mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-12">
        <div className="min-w-0">
          <p className="text-eyebrow text-slate-200">For brands & employers</p>
          <h1 className="text-page-hero mt-3">Brand & Company Registration</h1>
          <p className="text-section-copy mt-4 text-slate-300">
            Amplifying your brand presence through modern creator campaigns. Create your brand
            account below.
          </p>
        </div>

        <div className="min-w-0 rounded-[24px] bg-white p-5 text-slate-900 shadow-2xl sm:rounded-[28px] sm:p-8">
          <BrandRegisterForm />
        </div>
      </div>
    </section>
  );
}
