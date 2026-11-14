import type { Metadata } from "next";
import PublisherLoginForm from "@/components/auth/PublisherLoginForm";

export const metadata: Metadata = {
  title: "Publisher login",
  description: "Sign in to your JobOrio publisher studio.",
};

export default function PublisherLoginPage() {
  return (
    <section className="relative overflow-x-clip bg-[linear-gradient(135deg,#0B1D4F_0%,#14296B_45%,#3F2AA8_100%)] px-4 py-10 text-white sm:px-8 sm:py-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-1/4 hidden h-[min(480px,60vw)] w-[min(480px,60vw)] rounded-full bg-violet-600/30 blur-3xl sm:block"
      />

      <div className="relative mx-auto flex w-full max-w-lg flex-col items-center">
        <div className="w-full min-w-0 rounded-[24px] bg-white p-5 text-slate-900 shadow-2xl sm:rounded-[28px] sm:p-8">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
              Publisher studio
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[#0F1B3D] sm:text-3xl">
              Publisher login
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              Separate from creator and brand accounts. Sign in to manage your network.
            </p>
          </div>
          <PublisherLoginForm />
        </div>
      </div>
    </section>
  );
}
