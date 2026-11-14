import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <section className="relative overflow-x-clip rounded-b-[32px] bg-[linear-gradient(135deg,#0B1D4F_0%,#14296B_45%,#3F2AA8_100%)] px-4 pb-12 pt-[clamp(6.5rem,16vw,10rem)] text-white sm:rounded-b-[48px] sm:px-8 sm:pb-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-1/4 hidden h-[min(480px,60vw)] w-[min(480px,60vw)] rounded-full bg-violet-600/30 blur-3xl sm:block"
      />

      <div className="relative mx-auto flex max-w-lg flex-col items-center">
        <div className="w-full min-w-0 rounded-[24px] bg-white p-5 text-slate-900 shadow-2xl sm:rounded-[28px] sm:p-10">
          <div className="text-center">
            <h1 className="text-section-heading text-[#0F1B3D]">Welcome back</h1>
            <p className="text-section-copy mx-auto mt-4 max-w-sm">
              Sign in to your JobOrio account and continue earning on performance.
            </p>
          </div>

          <Suspense
            fallback={
              <p className="mt-8 text-center text-sm text-slate-400">Loading…</p>
            }
          >
            <LoginForm />
          </Suspense>

          <p className="mt-7 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-bold text-violet-600 transition hover:text-blue-600"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
