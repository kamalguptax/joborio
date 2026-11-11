"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createCreatorOnboarding, fetchNiches } from "@/lib/api/creator";
import { getReferralCode, clearReferralCode } from "@/lib/auth/referralStorage";
import { ApiClientError } from "@/lib/api/client";
import { getAuthToken } from "@/lib/auth/session";
import { detectCurrentPlace } from "@/lib/maps/detectPlace";
import NicheSearch from "@/components/jobs/NicheSearch";
import PromoteJobTypes from "@/components/jobs/PromoteJobTypes";
import { readPromoteJobTypes, savePromoteJobTypes } from "@/lib/jobs/promoteTypes";
import { clearSignupRoleIntent, getSignupRoleIntent } from "@/components/auth/SignupForm";
import type { Niche } from "@/lib/api/types";

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
    id: "creator" as const,
    icon: "🎨",
    title: "Creator",
    description:
      "Create content, find opportunities and grow your audience.",
  },
  {
    id: "recruiter" as const,
    icon: "💼",
    title: "Recruiter",
    description:
      "Find talented creators and hire the right people.",
  },
  {
    id: "both" as const,
    icon: "🚀",
    title: "Both",
    description:
      "Create, hire and collaborate with other professionals.",
  },
];

const goals = [
  {
    icon: "💼",
    title: "Find jobs",
    description: "Browse open jobs you can share.",
  },
  {
    icon: "🎓",
    title: "Find courses",
    description: "Browse courses you can share.",
  },
  {
    icon: "📣",
    title: "Find campaigns",
    description: "Browse campaigns you can share.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [niches, setNiches] = useState<Niche[]>([]);
  const [selectedNicheIds, setSelectedNicheIds] = useState<number[]>([]);
  const [selectedRole, setSelectedRole] = useState<
    "creator" | "recruiter" | "both" | null
  >(null);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationFromGoogle, setLocationFromGoogle] = useState(false);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [skipRoleStep, setSkipRoleStep] = useState(false);
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [community, setCommunity] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace("/login");
      return;
    }
    fetchNiches()
      .then(setNiches)
      .catch(() => setNiches([]));
    setJobTypes(readPromoteJobTypes());
    const signupRole = getSignupRoleIntent();
    if (signupRole === "creator" || signupRole === "partner") {
      setSelectedRole("creator");
      setSkipRoleStep(true);
    }

    let cancelled = false;
    setLocating(true);
    detectCurrentPlace()
      .then((place) => {
        if (cancelled || !place) return;
        setLocation((current) => (current.trim() ? current : place.label));
        setLocationFromGoogle(true);
        if (place.countryCode) setCountryCode(place.countryCode);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLocating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const toggleNiche = (id: number) => {
    setSelectedNicheIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleGoal = (title: string) => {
    setSelectedGoals((prev) =>
      prev.includes(title) ? prev.filter((g) => g !== title) : [...prev, title],
    );
  };

  const completeOnboarding = async () => {
    setSubmitError(null);

    if (selectedRole === "recruiter") {
      router.push("/employer/onboarding");
      return;
    }

    const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (cleanHandle.length < 3) {
      setSubmitError("Choose a handle with at least 3 characters (a-z, 0-9, _).");
      return;
    }

    const social_links = {
      linkedin: linkedin.trim() || undefined,
      instagram: instagram.trim() || undefined,
      community: community.trim() || undefined,
      website: website.trim() || undefined,
    };
    if (
      !social_links.linkedin &&
      !social_links.instagram &&
      !social_links.community &&
      !social_links.website
    ) {
      setSubmitError(
        "Add at least one LinkedIn, Instagram, community, or website link. We approve accounts manually.",
      );
      return;
    }

    setSubmitting(true);
    try {
      await createCreatorOnboarding({
        handle: cleanHandle,
        bio: bio || undefined,
        social_links,
        niche_ids: selectedNicheIds,
        audience_countries: countryCode ? [countryCode] : undefined,
        promote_job_types: jobTypes,
        referral_code: getReferralCode() ?? undefined,
      });
      savePromoteJobTypes(jobTypes);
      clearReferralCode();
      clearSignupRoleIntent();
      router.push("/creator/dashboard");
    } catch (err) {
      setSubmitError(
        err instanceof ApiClientError
          ? err.message
          : "Could not save profile. Is the API running?",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    setSubmitError(null);
    if (currentStep === 2 && !selectedRole) {
      setSubmitError("Please select Creator, Recruiter, or Both to continue.");
      return;
    }
    if (skipRoleStep && currentStep === 1) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const previousStep = () => {
    if (skipRoleStep && currentStep === 3) {
      setCurrentStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const visibleSteps = skipRoleStep
    ? steps.filter((step) => step.number !== 2)
    : steps;
  const visibleIndex = Math.max(
    visibleSteps.findIndex((step) => step.number === currentStep),
    0,
  );
  const progress = ((visibleIndex + 1) / visibleSteps.length) * 100;

  return (
    <main className="min-h-screen bg-[#f5f7ff] px-4 py-8 sm:px-6 lg:px-8">

      {/* ================= HEADER ================= */}
      <div className="mx-auto mb-8 flex max-w-6xl items-center justify-between">

        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-slate-900"
        >
          Job<span className="text-indigo-600">Orio</span>
        </Link>

        <div className="flex items-center gap-4">

          <span className="hidden text-sm font-medium text-slate-500 sm:block">
            Step {visibleIndex + 1} of {visibleSteps.length}
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
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
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
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      placeholder={locating ? "Finding your location…" : "e.g. Lucknow, India"}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                    {locating || locationFromGoogle ? (
                      <p className="mt-1.5 text-xs text-slate-400">
                        {locating ? "Checking Google for your city…" : "Filled from Google. You can edit it."}
                      </p>
                    ) : null}

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
                  What brings you to JobOrio?
                </h1>

                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
                  Choose how you want to use the platform.
                </p>

                <div className="mt-10 grid gap-5 md:grid-cols-3">

                  {roles.map((role) => {
                    const selected = selectedRole === role.id;
                    return (
                    <button
                      key={role.title}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setSelectedRole(role.id);
                        setSubmitError(null);
                      }}
                      className={`group relative rounded-2xl border p-6 text-left outline-none transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 ${
                        selected
                          ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/25"
                          : "border-slate-200 bg-white hover:border-indigo-300"
                      }`}
                    >

                      <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-all duration-300 ${
                        selected ? "bg-indigo-100" : "bg-indigo-50 group-hover:bg-indigo-100"
                      }`}>
                        {role.icon}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900">
                        {role.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {role.description}
                      </p>

                      {selected ? (
                        <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-indigo-600">
                          ✓ Selected
                        </span>
                      ) : null}

                    </button>
                    );
                  })}

                </div>
                {submitError && currentStep === 2 ? (
                  <p className="mt-4 text-sm text-red-600">{submitError}</p>
                ) : null}
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
                  <NicheSearch
                    niches={niches}
                    selectedIds={selectedNicheIds}
                    onToggle={toggleNiche}
                  />
                </div>

                <div className="mt-8">
                  <PromoteJobTypes
                    selected={jobTypes}
                    onToggle={(id) =>
                      setJobTypes((prev) =>
                        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                      )
                    }
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
                  Choose what you want to find.
                </p>

                <div className="mt-10 grid gap-4 sm:grid-cols-2">

                  {goals.map((goal) => {
                    const selected = selectedGoals.includes(goal.title);
                    return (
                    <button
                      key={goal.title}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleGoal(goal.title)}
                      className={`group flex items-start gap-4 rounded-2xl border p-5 text-left outline-none transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 ${
                        selected
                          ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20"
                          : "border-slate-200 bg-white hover:border-indigo-300"
                      }`}
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

                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition-all duration-300 ${
                              selected
                                ? "border-indigo-500 bg-indigo-600 text-white"
                                : "border-slate-200 bg-white text-transparent group-hover:border-indigo-300"
                            }`}
                          >
                            ✓
                          </span>

                        </div>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {goal.description}
                        </p>

                      </div>

                    </button>
                    );
                  })}

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
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Public handle
                    </label>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="yourname"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      Your page: /p/{handle || "yourname"}
                    </p>
                  </div>

                  {/* Bio */}
                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Short Bio
                    </label>

                    <textarea
                      rows={5}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself, your experience and what you do..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />

                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Add at least one link below. New creator accounts stay pending
                    until an admin approves them.
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://www.linkedin.com/in/you"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Instagram
                    </label>
                    <input
                      type="url"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="https://www.instagram.com/you"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Community link
                    </label>
                    <input
                      type="url"
                      value={community}
                      onChange={(e) => setCommunity(e.target.value)}
                      placeholder="https://t.me/yourgroup or Discord invite"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Website / portfolio
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
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

            {submitError ? (
              <p className="mb-3 text-center text-sm text-red-600">{submitError}</p>
            ) : null}

            {/* Continue */}
            <button
              type="button"
              onClick={currentStep === 5 ? completeOnboarding : nextStep}
              disabled={submitting}
              className="rounded-full bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 outline-none transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-xl focus:outline-none active:translate-y-0 disabled:opacity-60"
            >
              {currentStep === 5
                ? submitting
                  ? "Saving…"
                  : "Complete Profile ✓"
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