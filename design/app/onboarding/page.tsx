"use client";

import Link from "next/link";
import { useState } from "react";

const steps = [
  {
    number: 1,
    title: "Let's build your profile",
    description:
      "Tell us a little about yourself so we can personalize your CreatorHub experience.",
  },
  {
    number: 2,
    title: "What brings you to CreatorHub?",
    description:
      "Choose how you want to use the platform. You can always change this later.",
  },
  {
    number: 3,
    title: "What are you great at?",
    description:
      "Select the skills and content categories that represent you.",
  },
  {
    number: 4,
    title: "What are your goals?",
    description:
      "Tell us what you want to achieve on CreatorHub.",
  },
  {
    number: 5,
    title: "Complete your profile",
    description:
      "Add a few final details so people can discover you and your work.",
  },
];

const roles = [
  {
    icon: "🎨",
    title: "Creator",
    description:
      "Create content, find opportunities and grow your audience.",
  },
  {
    icon: "💼",
    title: "Recruiter",
    description:
      "Find talented creators and hire the right people.",
  },
  {
    icon: "🚀",
    title: "Both",
    description:
      "Create, hire and collaborate with other professionals.",
  },
];

const skills = [
  "Web Design",
  "UI/UX",
  "Development",
  "Photography",
  "Video",
  "Writing",
  "Marketing",
  "Social Media",
  "Fashion",
  "Fitness",
  "Gaming",
  "Technology",
];

const goals = [
  {
    icon: "💼",
    title: "Find Jobs",
    description:
      "Discover jobs and freelance opportunities.",
  },
  {
    icon: "🤝",
    title: "Brand Collaborations",
    description:
      "Work with brands and businesses.",
  },
  {
    icon: "💰",
    title: "Monetize Content",
    description:
      "Turn your skills and audience into income.",
  },
  {
    icon: "📈",
    title: "Grow My Audience",
    description:
      "Build your personal brand and reach.",
  },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <main className="min-h-screen bg-[#f5f7ff] px-4 py-8 sm:px-6 lg:px-8">

      {/* ================= HEADER ================= */}
      <div className="mx-auto mb-8 flex max-w-6xl items-center justify-between">

        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-slate-900"
        >
          Creator<span className="text-indigo-600">Hub</span>
        </Link>

        <div className="flex items-center gap-4">

          <span className="hidden text-sm font-medium text-slate-500 sm:block">
            Step {currentStep} of {steps.length}
          </span>

          <Link
            href="/"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Save & Exit
          </Link>

        </div>
      </div>

      {/* ================= PROGRESS ================= */}
      <div className="mx-auto mb-8 max-w-6xl">

        <div className="mb-2 flex items-center justify-between">

          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Your profile setup
          </span>

          <span className="text-sm font-semibold text-slate-600">
            {Math.round(progress)}%
          </span>

        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-200">

          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>
      </div>

      {/* ================= MAIN CARD ================= */}
      <div className="mx-auto max-w-6xl">

        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">

          {/* ================= CONTENT ================= */}
          <div className="min-h-[560px] px-6 py-10 sm:px-10 lg:px-16 lg:py-14">

            {/* ================= STEP 1 ================= */}
            {currentStep === 1 && (
              <div className="animate-[fadeIn_.35s_ease]">

                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">
                  👋
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Let's build your profile
                </h1>

                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
                  Tell us a little about yourself so we can personalize your
                  CreatorHub experience.
                </p>

                <div className="mt-10 grid gap-5 sm:grid-cols-2">

                  {/* Full Name */}
                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Full Name
                    </label>

                    <input
                      type="text"
                      placeholder="Enter your full name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />

                  </div>

                  {/* Location */}
                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Location
                    </label>

                    <input
                      type="text"
                      placeholder="e.g. Lucknow, India"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />

                  </div>

                </div>
              </div>
            )}

            {/* ================= STEP 2 ================= */}
            {currentStep === 2 && (
              <div className="animate-[fadeIn_.35s_ease]">

                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">
                  🚀
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  What brings you to CreatorHub?
                </h1>

                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
                  Choose how you want to use the platform.
                </p>

                <div className="mt-10 grid gap-5 md:grid-cols-3">

                  {roles.map((role) => (
                    <button
                      key={role.title}
                      type="button"
                      className="group relative rounded-2xl border border-slate-200 bg-white p-6 text-left outline-none transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg focus:outline-none"
                    >

                      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-3xl transition-all duration-300 group-hover:bg-indigo-100">
                        {role.icon}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900">
                        {role.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {role.description}
                      </p>

                    </button>
                  ))}

                </div>
              </div>
            )}

            {/* ================= STEP 3 ================= */}
            {currentStep === 3 && (
              <div className="animate-[fadeIn_.35s_ease]">

                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">
                  ✨
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  What are you great at?
                </h1>

                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
                  Select the skills and content categories that represent you.
                </p>

                <div className="mt-10">

                  <label className="mb-4 block text-sm font-semibold text-slate-700">
                    Select your skills
                  </label>

                  <div className="flex flex-wrap gap-3">

                    {skills.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 outline-none transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-400 hover:text-indigo-600 hover:shadow-sm focus:outline-none"
                      >
                        {skill}
                      </button>
                    ))}

                  </div>

                </div>

                <div className="mt-10">

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Primary Niche
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. Technology, Fashion, Fitness, Web Design"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />

                </div>

              </div>
            )}

            {/* ================= STEP 4 ================= */}
            {currentStep === 4 && (
              <div className="animate-[fadeIn_.35s_ease]">

                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">
                  🎯
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  What are your goals?
                </h1>

                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
                  Select everything you want to achieve on CreatorHub.
                </p>

                <div className="mt-10 grid gap-4 sm:grid-cols-2">

                  {goals.map((goal) => (
                    <button
                      key={goal.title}
                      type="button"
                      className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left outline-none transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg focus:outline-none"
                    >

                      {/* Icon */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl transition-all duration-300 group-hover:bg-indigo-50">
                        {goal.icon}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">

                        <div className="flex items-center justify-between gap-3">

                          <h3 className="font-bold text-slate-900">
                            {goal.title}
                          </h3>

                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xs text-transparent transition-all duration-300 group-hover:border-indigo-300">
                            ✓
                          </span>

                        </div>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {goal.description}
                        </p>

                      </div>

                    </button>
                  ))}

                </div>
              </div>
            )}

            {/* ================= STEP 5 ================= */}
            {currentStep === 5 && (
              <div className="animate-[fadeIn_.35s_ease]">

                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-3xl">
                  🎉
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Complete your profile
                </h1>

                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
                  Add a few final details so people can discover you and your
                  work.
                </p>

                <div className="mt-10 space-y-6">

                  {/* Bio */}
                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Short Bio
                    </label>

                    <textarea
                      rows={5}
                      placeholder="Tell us about yourself, your experience and what you do..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />

                  </div>

                  {/* Portfolio */}
                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Portfolio / Website
                    </label>

                    <input
                      type="url"
                      placeholder="https://yourwebsite.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />

                  </div>

                </div>

              </div>
            )}

          </div>

          {/* ================= FOOTER ================= */}
          <div className="flex flex-col-reverse gap-4 border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-16">

            {/* Back */}
            <button
              type="button"
              onClick={previousStep}
              disabled={currentStep === 1}
              className={`rounded-full px-6 py-3 text-sm font-semibold transition ${
                currentStep === 1
                  ? "cursor-not-allowed text-slate-300"
                  : "text-slate-600 hover:bg-white hover:text-slate-900"
              }`}
            >
              ← Back
            </button>

            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-3">

              {steps.map((step) => (
                <span
                  key={step.number}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    step.number === currentStep
                      ? "w-8 bg-indigo-600"
                      : step.number < currentStep
                        ? "w-2 bg-indigo-300"
                        : "w-2 bg-slate-200"
                  }`}
                />
              ))}

            </div>

            {/* Continue */}
            <button
              type="button"
              onClick={nextStep}
              className="rounded-full bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 outline-none transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-xl focus:outline-none active:translate-y-0"
            >
              {currentStep === 5
                ? "Complete Profile ✓"
                : "Continue →"}
            </button>

          </div>

        </div>
      </div>

      {/* ================= ANIMATION ================= */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

    </main>
  );
}