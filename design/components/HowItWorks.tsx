"use client";

import {
  UserRound,
  Send,
  ChartNoAxesCombined,
  CircleDollarSign,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Create Account",
    description: "Sign up as a creator or employer in just a few seconds.",
    icon: UserRound,
    color: "from-blue-600 to-indigo-600",
    soft: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    number: "02",
    title: "Share / Launch",
    description: "Promote jobs, courses, campaigns or opportunities.",
    icon: Send,
    color: "from-purple-600 to-violet-600",
    soft: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    number: "03",
    title: "Track Performance",
    description: "Monitor clicks, conversions and performance in real time.",
    icon: ChartNoAxesCombined,
    color: "from-fuchsia-500 to-pink-500",
    soft: "bg-pink-50",
    iconColor: "text-pink-500",
  },
  {
    number: "04",
    title: "Earn / Grow",
    description: "Get paid for results or grow your business with creators.",
    icon: CircleDollarSign,
    color: "from-indigo-600 to-purple-600",
    soft: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
];

export default function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-[#fff9fd] py-20 sm:py-24 lg:py-28">
      
      {/* Background Decorations */}
      <div className="pointer-events-none absolute -left-40 top-20 h-[350px] w-[350px] rounded-full bg-blue-100/50 blur-[100px]" />

      <div className="pointer-events-none absolute right-[-150px] bottom-0 h-[400px] w-[400px] rounded-full bg-pink-100/50 blur-[110px]" />

      <div className="relative mx-auto w-full max-w-[1360px] px-5 sm:px-8">

        {/* =====================================================
            HEADING
        ===================================================== */}
        <div className="mx-auto max-w-[700px] text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-indigo-950 sm:text-4xl">How It Works</h2>
          <p className="mx-auto mt-4 max-w-[600px] text-sm leading-6 text-slate-500 sm:text-base sm:leading-7">From creating your account to earning and growing, everything is designed to be simple, transparent and easy to follow.</p>
        </div>

        {/* =====================================================
            STEPS
        ===================================================== */}
        <div className="relative mt-14 lg:mt-16">

          {/* Desktop Connector */}
          <div className="pointer-events-none absolute left-[12%] right-[12%] top-[57px] hidden h-px lg:block">
            <div className="h-[2px] w-full bg-gradient-to-r from-blue-200 via-purple-300 to-pink-200" />

            {/* Arrow 1 */}
            <div className="absolute left-[32%] top-1/2 flex -translate-y-1/2 items-center justify-center">
              <div className="rounded-full border border-purple-100 bg-[#fff9fd] p-1">
                <ArrowRight
                  size={15}
                  strokeWidth={2.5}
                  className="text-purple-500"
                />
              </div>
            </div>

            {/* Arrow 2 */}
            <div className="absolute left-[65%] top-1/2 flex -translate-y-1/2 items-center justify-center">
              <div className="rounded-full border border-purple-100 bg-[#fff9fd] p-1">
                <ArrowRight
                  size={15}
                  strokeWidth={2.5}
                  className="text-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="group relative"
                >
                  <div className="relative h-full overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-6 text-center shadow-[0_12px_45px_rgba(23,43,99,0.05)] transition-all duration-300 hover:-translate-y-2 hover:border-purple-200 hover:shadow-[0_25px_60px_rgba(124,58,237,0.11)]">

                    {/* Card Glow */}
                    <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-purple-50 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

                    {/* Number */}
                    <div className="absolute right-5 top-5 text-[11px] font-bold tracking-[0.12em] text-slate-300">
                      {step.number}
                    </div>

                    {/* Icon */}
                    <div className="relative mx-auto w-fit">

                      {/* Outer Ring */}
                      <div className="absolute -inset-2 rounded-full border border-purple-100 opacity-0 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100" />

                      <div
                        className={`relative flex h-[76px] w-[76px] items-center justify-center rounded-full bg-gradient-to-br ${step.color} shadow-[0_12px_30px_rgba(79,70,229,0.20)] transition-transform duration-300 group-hover:scale-105`}
                      >
                        <Icon
                          size={29}
                          strokeWidth={1.8}
                          className="text-white"
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="relative mt-7">

                      <h3 className="text-[16px] font-bold text-[#172b63]">
                        {step.title}
                      </h3>

                      <p className="mx-auto mt-2 max-w-[220px] text-[13px] leading-6 text-slate-500">
                        {step.description}
                      </p>

                      {/* Bottom Status */}
                      <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full ${step.soft} ${step.iconColor}`}
                        >
                          <Check size={11} strokeWidth={3} />
                        </span>

                        Easy & transparent
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =====================================================
            BOTTOM CTA / SUMMARY
        ===================================================== */}
        <div className="mx-auto mt-10 max-w-[850px] rounded-[24px] border border-purple-100 bg-white px-6 py-5 shadow-[0_12px_40px_rgba(124,58,237,0.06)] sm:px-8">

          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 text-purple-600">
                <Sparkles size={18} />
              </div>

              <div>
                <p className="text-sm font-bold text-[#172b63]">
                  Ready to get started?
                </p>

                <p className="mt-0.5 text-xs text-slate-400">
                  Create your account and take the first step.
                </p>
              </div>
            </div>

            <a
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-purple-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-purple-500/30"
            >
              Get Started
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}