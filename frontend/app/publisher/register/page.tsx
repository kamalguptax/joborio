import type { Metadata } from "next";
import PublisherRegisterForm from "@/components/auth/PublisherRegisterForm";

export const metadata: Metadata = {
  title: "Publisher registration",
  description:
    "Register as a JobOrio publisher to manage communities, invite members, and run campaigns.",
};

export default function PublisherRegisterPage() {
  return (
    <section className="relative overflow-x-clip rounded-b-[32px] bg-[linear-gradient(135deg,#0B1D4F_0%,#14296B_45%,#3F2AA8_100%)] px-4 pb-12 pt-[clamp(6.5rem,16vw,10rem)] text-white sm:rounded-b-[48px] sm:px-8 sm:pb-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-1/4 hidden h-[min(480px,60vw)] w-[min(480px,60vw)] rounded-full bg-violet-600/30 blur-3xl sm:block"
      />

      <div className="relative mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start lg:gap-12">
        <div className="min-w-0">
          <p className="text-eyebrow text-slate-200">Publisher network</p>
          <h1 className="text-page-hero mt-3">Publisher registration</h1>
          <p className="text-section-copy mt-4 text-slate-300">
            One-page application. After review and activation you can manage communities,
            invite members, and track publisher-level performance.
          </p>
        </div>

        <div className="min-w-0 rounded-[24px] bg-white p-5 text-slate-900 shadow-2xl sm:rounded-[28px] sm:p-8">
          <PublisherRegisterForm />
        </div>
      </div>
    </section>
  );
}
