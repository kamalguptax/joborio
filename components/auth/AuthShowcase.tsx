import Image from "next/image";
import { ArrowUpRight, Briefcase, Link2, Wallet } from "lucide-react";
import { JobOrioMark } from "@/components/auth/AuthLogo";

type Variant = "login" | "signup";

const COPY: Record<Variant, { lead: string; follow: string }> = {
  login: {
    lead: "Your audience trusts you.",
    follow: "Make every recommendation count.",
  },
  signup: {
    lead: "Your audience has value.",
    follow: "Start earning today.",
  },
};

/** Bars for the mini earnings chart (percent of full height). */
const BARS = [34, 48, 41, 63, 55, 78, 100];

/**
 * Right-hand panel of the auth pages: shows what JobOrio does —
 * creators share jobs and opportunities, and earn on verified clicks
 * and registrations. Purely decorative, so it is hidden from assistive tech.
 */
export default function AuthShowcase({ variant = "login" }: { variant?: Variant }) {
  const copy = COPY[variant];

  return (
    <div className="relative isolate flex h-full min-h-[600px] flex-col justify-between overflow-hidden rounded-[22px] bg-[linear-gradient(155deg,#0B1D4F_0%,#18297A_48%,#3F2AA8_100%)] p-8 text-white xl:p-12">
      {/* silk-like light bands + glow */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-1/4 -top-[10%] h-[140%] w-[55%] rotate-[18deg] bg-gradient-to-r from-transparent via-white/[0.09] to-transparent blur-xl" />
        <div className="absolute left-[40%] -top-[20%] h-[150%] w-[26%] rotate-[18deg] bg-gradient-to-r from-transparent via-violet-300/[0.14] to-transparent blur-2xl" />
        <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-[#7C3AED]/45 blur-3xl" />
      </div>

      <div>
        <h2 className="max-w-md text-[clamp(1.85rem,1.2rem+1.9vw,3.1rem)] font-bold leading-[1.1] tracking-[-0.03em]">
          {copy.lead}
          <span className="block font-medium text-violet-200/90">{copy.follow}</span>
        </h2>
        <p className="mt-5 max-w-sm text-sm leading-6 text-slate-300">
          Share jobs, courses and campaigns with your audience. Earn on every verified click and
          registration.
        </p>
      </div>

      <div aria-hidden="true" className="flex items-end gap-3">
        {/* logo tile */}
        <div
          className="auth-rise hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-xl shadow-black/20 xl:flex"
          style={{ animationDelay: "0.1s" }}
        >
          <JobOrioMark className="h-7 w-7" color="#6B3EE5" />
        </div>

        {/* side nav pill */}
        <div
          className="auth-rise flex shrink-0 flex-col items-center gap-3 rounded-2xl bg-white/95 px-3 py-4 shadow-xl shadow-black/20"
          style={{ animationDelay: "0.2s" }}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <Link2 size={17} />
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400">
            <Briefcase size={17} />
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400">
            <Wallet size={17} />
          </span>
        </div>

        {/* earnings card, with the opportunity card peeking out behind it */}
        <div className="relative min-w-0 flex-1 xl:max-w-[360px]">
          <div
            className="auth-rise absolute inset-x-4 bottom-[calc(100%-1rem)] z-0 flex h-[5.25rem] items-start gap-3 rounded-2xl bg-white/80 px-4 pt-3 shadow-lg shadow-black/10 [@media(max-height:780px)]:hidden"
            style={{ animationDelay: "0.45s" }}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-slate-200">
              <Image
                src="/images/companies/infosys.png"
                alt=""
                width={64}
                height={24}
                className="h-3.5 w-auto"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-[#0F1B3D]">Frontend Developer</p>
              <p className="truncate text-xs text-slate-500">Infosys · Bengaluru</p>
            </div>
            <span className="shrink-0 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
              $4.20 / signup
            </span>
          </div>

          <div
            className="auth-rise relative z-10 rounded-2xl bg-white p-5 text-[#0F1B3D] shadow-2xl shadow-black/25"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">Earnings this month</p>
                <p className="mt-1 text-[28px] font-bold leading-none tracking-tight">$1,284.50</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                <ArrowUpRight size={12} />
                18%
              </span>
            </div>

            <div className="mt-4 flex h-14 items-end gap-1.5">
              {BARS.map((h, i) => (
                <span
                  key={i}
                  className={`auth-grow block flex-1 rounded-md ${
                    i === BARS.length - 1
                      ? "bg-[linear-gradient(180deg,#7C3AED,#3F2AA8)]"
                      : "bg-violet-200"
                  }`}
                  style={{ height: `${h}%`, animationDelay: `${0.6 + i * 0.07}s` }}
                />
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
              <div>
                <p className="text-[11px] text-slate-500">Verified clicks</p>
                <p className="text-sm font-semibold">3,482</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Registrations</p>
                <p className="text-sm font-semibold">126</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
