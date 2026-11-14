import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <section className="relative overflow-x-clip bg-[linear-gradient(135deg,#0B1D4F_0%,#14296B_45%,#3F2AA8_100%)] px-4 py-10 text-white sm:px-8 sm:py-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-1/4 hidden h-[min(480px,60vw)] w-[min(480px,60vw)] rounded-full bg-violet-600/30 blur-3xl sm:block"
      />

      <div className="relative mx-auto flex w-full max-w-lg flex-col items-center">
        <div className="w-full min-w-0 rounded-[24px] bg-white p-5 text-slate-900 shadow-2xl sm:rounded-[28px] sm:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#0F1B3D] sm:text-3xl">
              Welcome back
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              Sign in to your JobOrio account and continue earning on performance.
            </p>
          </div>

          <Suspense
            fallback={
              <p className="mt-6 text-center text-sm text-slate-400">Loading…</p>
            }
          >
            <LoginForm />
          </Suspense>

          <p className="mt-5 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-bold text-violet-600 transition hover:text-blue-600"
            >
              Create an account
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-slate-500">
            Publisher network?{" "}
            <Link
              href="/publisher/login"
              className="font-bold text-violet-600 transition hover:text-blue-600"
            >
              Publisher login
            </Link>
            {" · "}
            <Link
              href="/publisher/register"
              className="font-bold text-violet-600 transition hover:text-blue-600"
            >
              Apply
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
