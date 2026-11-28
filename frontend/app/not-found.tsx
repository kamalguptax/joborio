import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Gift, Home, Mail, MessageSquare, SearchX } from "lucide-react";
import RecoverMissingJobLink from "@/components/jobs/RecoverMissingJobLink";
import GoBackButton from "@/components/not-found/GoBackButton";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you are looking for could not be found.",
};

const QUICK_LINKS = [
  { href: "/jobs", label: "Browse jobs", text: "Find live opportunities to share.", icon: Briefcase },
  { href: "/refer-and-earn", label: "Refer & Earn", text: "Invite friends and earn more.", icon: Gift },
  { href: "/contact", label: "Contact us", text: "Talk to the Upclift team.", icon: Mail },
  { href: "/feedback", label: "Share feedback", text: "Tell us what to improve.", icon: MessageSquare },
];

export default function NotFound() {
  return (
    <>
      <RecoverMissingJobLink />
      <section className="relative isolate overflow-hidden bg-[#F7F8FC] px-4 pb-20 pt-28 sm:px-8 sm:pb-28 sm:pt-32 lg:px-10">
        {/* soft brand glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-violet-300/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-40 -z-10 h-72 w-72 rounded-full bg-indigo-300/25 blur-3xl"
        />

        <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <p className="rounded-full border border-violet-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-violet-700">
            Error 404
          </p>

          <div
            className="mt-8 flex select-none items-center justify-center gap-2 sm:gap-4"
            role="img"
            aria-label="404"
          >
            <span className="bg-gradient-to-br from-violet-600 to-indigo-500 bg-clip-text text-[7rem] font-extrabold leading-none text-transparent sm:text-[11rem]">
              4
            </span>
            <span className="flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-500 text-white shadow-[0_24px_50px_-18px_rgba(10,95,207,0.65)] sm:h-[9rem] sm:w-[9rem]">
              <SearchX className="h-10 w-10 sm:h-16 sm:w-16" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="bg-gradient-to-br from-indigo-500 to-violet-600 bg-clip-text text-[7rem] font-extrabold leading-none text-transparent sm:text-[11rem]">
              4
            </span>
          </div>

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-[#0A2150] sm:text-4xl">
            This page wandered off.
          </h1>
          <p className="mt-3 max-w-md text-base leading-relaxed text-slate-500">
            The link may be broken, or the page may have moved. Head back home or pick one of the places below.
          </p>

          <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-6 py-3.5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
            >
              <Home size={16} aria-hidden="true" />
              Back to Home
            </Link>
            <GoBackButton />
          </div>

          <ul className="mt-14 grid w-full gap-3 text-left sm:grid-cols-2">
            {QUICK_LINKS.map(({ href, label, text, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(10,33,80,0.04)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_18px_40px_-28px_rgba(10,95,207,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition group-hover:bg-violet-600 group-hover:text-white">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-bold text-[#0A2150]">{label}</span>
                    <span className="block text-sm text-slate-500">{text}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
