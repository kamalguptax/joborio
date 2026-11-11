import { FcGoogle } from "react-icons/fc";
import { FaLinkedinIn } from "react-icons/fa";
import Header from "@/components/Header";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#fff9fd]">
      <Header authPage={true} />

      <section className="relative pt-[150px] flex min-h-[calc(100vh-80px)] items-center justify-center overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        {/* Background Glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-blue-400/20 blur-[110px]" />

          <div className="absolute bottom-[-180px] left-[-100px] h-[360px] w-[360px] rounded-full bg-purple-400/20 blur-[110px]" />

          <div className="absolute right-[-120px] top-1/3 h-[360px] w-[360px] rounded-full bg-pink-400/20 blur-[110px]" />
        </div>

        <div className="relative z-10 w-full max-w-[500px]">
          {/* Card */}
          <div className="rounded-[30px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_25px_80px_rgba(23,43,99,0.10)] backdrop-blur-xl sm:p-10">
            
            {/* Heading */}
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-[#172b63] sm:text-4xl">
                Welcome Back
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500 sm:text-base">
                Sign in to your Joborio account and continue connecting with
                creators and opportunities.
              </p>
            </div>

            {/* Social Login */}
            <div className="mt-8 space-y-3">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <FcGoogle className="text-xl" />
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-[#0A66C2]">
                  <FaLinkedinIn className="text-[12px] text-white" />
                </span>

                <span>Continue with LinkedIn</span>
              </button>
            </div>

            {/* Divider */}
            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />

              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Or continue with email
              </span>

              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Form */}
            <form className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-[#26385D]"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-500/10"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-[#26385D]"
                  >
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-purple-600 transition hover:text-blue-600"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-500/10"
                />
              </div>

              {/* Login */}
              <button
                type="submit"
                className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-500/25"
              >
                <span className="relative z-10">Login to Joborio</span>
              </button>
            </form>

            {/* Signup */}
            <p className="mt-7 text-center text-sm text-slate-500">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="font-bold text-purple-600 transition hover:text-blue-600"
              >
                Create an account
              </Link>
            </p>
          </div>

          {/* Bottom Note */}
          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            By continuing, you agree to Joborio's{" "}
            <Link
              href="/terms"
              className="font-medium text-slate-500 hover:text-purple-600"
            >
              Terms & Conditions
            </Link>{" "}
            and Privacy Policy.
          </p>
        </div>
      </section>
    </main>
  );
}