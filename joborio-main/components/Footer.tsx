import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-slate-950 text-white">
        <div className="pointer-events-none absolute right-[-150px] top-[-150px] h-[400px] w-[400px] rounded-full bg-purple-600/15 blur-[120px]" />
        <div className="relative mx-auto max-w-[1360px] px-5 py-16 sm:px-8 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
            {/* Brand */}
            <div className="max-w-[360px]">
              <Link
                href="/"
                className="inline-flex items-center gap-2"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500">
                  <Sparkles size={20} />
                </span>

                <span className="font-logo text-2xl">
                  Job
                  <span className="bg-gradient-to-r from-blue-300 to-pink-300 bg-clip-text text-transparent">
                    Orio
                  </span>
                </span>
              </Link>

              <p className="mt-5 text-sm leading-7 text-white/45">
                A creator-led marketplace connecting people, communities and
                companies through trusted opportunities.
              </p>

              <Link
                href="/creator/register"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#172b63] transition hover:bg-blue-50"
              >
                Get Started
                <ArrowRight size={15} />
              </Link>
            </div>

            {/* Platform */}
            <div>
              <h3 className="text-sm font-bold text-white">
                Platform
              </h3>

              <div className="mt-5 flex flex-col gap-3">
                {[
                  ["Find Jobs", "/jobs"],
                  ["Creators", "/creator/register"],
                  ["How It Works", "/how-it-works"],
                  ["About", "/about"],
                ].map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    className="text-sm text-white/45 transition hover:text-white"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-sm font-bold text-white">
                Resources
              </h3>

              <div className="mt-5 flex flex-col gap-3">
                {[
                  ["FAQ", "/faq"],
                  ["Blog", "/blog"],
                  ["Contact", "/contact"],
                  ["Privacy", "/privacy"],
                ].map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    className="text-sm text-white/45 transition hover:text-white"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* For Business */}
            <div>
              <h3 className="text-sm font-bold text-white">
                For Business
              </h3>

              <div className="mt-5 flex flex-col gap-3">
                {[
                  ["Hire Creators", "/employer/onboarding"],
                  ["Post a Job", "/employer/programs/new"],
                  ["Promote a post", "/promote"],
                  ["Partner With Us", "/contact"],
                  ["Support", "/contact"],
                ].map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    className="text-sm text-white/45 transition hover:text-white"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-14 flex flex-col gap-5 border-t border-white/10 pt-7 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-xs text-white/35">
              © {new Date().getFullYear()} JobOrio. All rights reserved.
            </p>

            <div className="flex items-center gap-5">
              <Link
                href="/terms"
                className="text-xs text-white/35 transition hover:text-white"
              >
                Terms
              </Link>

              <Link
                href="/privacy"
                className="text-xs text-white/35 transition hover:text-white"
              >
                Privacy
              </Link>

              <Link
                href="/contact"
                className="text-xs text-white/35 transition hover:text-white"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
  );
}