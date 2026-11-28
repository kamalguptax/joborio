"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { fetchMe } from "@/lib/api/auth";
import { createCreatorOnboarding, fetchNiches } from "@/lib/api/creator";
import { hasNoRole, homePathForUser, navigateTo } from "@/lib/auth/redirect";
import { getReferralCode, clearReferralCode } from "@/lib/auth/referralStorage";
import { ApiClientError } from "@/lib/api/client";
import { getAuthToken } from "@/lib/auth/session";
import { clearOnboardingPending, isOnboardingPending } from "@/lib/auth/onboardingFlag";
import { detectCurrentPlace } from "@/lib/maps/detectPlace";
import GooglePlacesLocationInput from "@/components/maps/GooglePlacesLocationInput";
import NicheSearch from "@/components/jobs/NicheSearch";
import PromoteJobTypes from "@/components/jobs/PromoteJobTypes";
import { readPromoteJobTypes, savePromoteJobTypes } from "@/lib/jobs/promoteTypes";
import { clearSignupRoleIntent, getSignupRoleIntent } from "@/components/auth/SignupForm";
import type { Niche } from "@/lib/api/types";
import { ClipboardCheck, Rocket, Sparkles, Target, UserRound } from "lucide-react";
import OnboardingShell, { type OnboardingStep } from "@/components/auth/OnboardingShell";
import { authField, authLabel, authTextarea } from "@/components/auth/authStyles";

type StepDef = OnboardingStep & { number: number };

const steps: StepDef[] = [
  {
    number: 1,
    icon: UserRound,
    title: "Build your profile",
    description:
      "Tell us a little about yourself so we can personalize your Upclift experience.",
  },
  {
    number: 2,
    icon: Rocket,
    title: "Choose how you'll use Upclift",
    description:
      "Pick the option that fits you best. You can always change this later.",
  },
  {
    number: 3,
    icon: Sparkles,
    title: "Pick your skills",
    description:
      "Select the skills and content categories that represent you.",
  },
  {
    number: 4,
    icon: Target,
    title: "Set your goals",
    description: "Tell us what you want to find and share on Upclift.",
  },
  {
    number: 5,
    icon: ClipboardCheck,
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
  const userIdRef = useRef<number | null>(null);
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [community, setCommunity] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace("/creator/login");
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

    // Onboarding is only for brand-new accounts. Creator / brand / publisher /
    // network accounts that already exist go straight to their own dashboard.
    fetchMe()
      .then((me) => {
        if (cancelled) return;
        userIdRef.current = me.id;
        // A brand-new account can already have a creator profile (the API may
        // create it at sign-up), so the pending flag, not "no role", decides.
        if (!hasNoRole(me) && !isOnboardingPending(me.id, "creator")) {
          navigateTo(router, homePathForUser(me));
        }
      })
      .catch(() => undefined);

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

  const finishOnboarding = () => {
    if (userIdRef.current != null) clearOnboardingPending(userIdRef.current, "creator");
  };

  const completeOnboarding = async () => {
    setSubmitError(null);

    if (selectedRole === "recruiter") {
      finishOnboarding();
      router.push("/brand/setup");
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
        referral_code:
          getReferralCode() ??
          (typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("ref")?.toUpperCase()
            : undefined) ??
          undefined,
      });
      savePromoteJobTypes(jobTypes);
      clearReferralCode();
      clearSignupRoleIntent();
      finishOnboarding();
      // "Both": creator profile is done, now set up the company too.
      router.push(selectedRole === "both" ? "/brand/setup" : "/creator/dashboard");
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
  const isLast = currentStep === 5;

  return (
    <OnboardingShell
      steps={visibleSteps}
      current={visibleIndex}
      intro="Get started by setting up your Upclift profile in a few quick steps."
      error={submitError}
      exitHref="/creator/dashboard"
      exitLabel="Skip for now"
      onExit={finishOnboarding}
      onBack={currentStep === 1 ? undefined : previousStep}
      onNext={isLast ? completeOnboarding : nextStep}
      nextDisabled={submitting}
      nextLabel={submitting ? "Saving…" : "Save and continue"}
    >
      {currentStep === 1 && (
        <div className="space-y-5">
          <div>
            <label htmlFor="ob-name" className={authLabel}>Full name</label>
            <input
              id="ob-name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="e.g. Aarav Sharma"
              className={authField}
            />
          </div>
          <div>
            <label htmlFor="ob-location" className={authLabel}>Location</label>
            <GooglePlacesLocationInput
              id="ob-location"
              value={location}
              onChange={(next) => {
                setLocation(next);
                setLocationFromGoogle(false);
              }}
              onPlaceSelect={(place) => {
                setLocation(place.label);
                setLocationFromGoogle(true);
                if (place.countryCode) setCountryCode(place.countryCode);
              }}
              placeholder={
                locating ? "Finding your location…" : "Start typing a city…"
              }
              className={authField}
            />
            {locating ? (
              <p className="mt-1.5 text-xs text-slate-500">
                Checking Google for your city…
              </p>
            ) : locationFromGoogle ? (
              <p className="mt-1.5 text-xs text-slate-500">
                Filled from Google. You can search again or edit it.
              </p>
            ) : null}
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="grid gap-3">
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
                className={`flex items-center gap-4 rounded-xl border bg-white p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 ${
                  selected
                    ? "border-violet-500 shadow-[inset_0_0_0_1px_rgba(10,95,207,0.5)]"
                    : "border-slate-200 hover:border-violet-300"
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xl">
                  {role.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-[#0A2150]">{role.title}</span>
                  <span className="mt-0.5 block text-[13px] text-slate-500">{role.description}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                    selected ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300 text-transparent"
                  }`}
                >
                  ✓
                </span>
              </button>
            );
          })}
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-7">
          <NicheSearch
            niches={niches}
            selectedIds={selectedNicheIds}
            onToggle={toggleNiche}
            onChange={setSelectedNicheIds}
          />
          <PromoteJobTypes
            selected={jobTypes}
            onToggle={(id) =>
              setJobTypes((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
              )
            }
          />
        </div>
      )}

      {currentStep === 4 && (
        <div className="grid gap-3">
          {goals.map((goal) => {
            const selected = selectedGoals.includes(goal.title);
            return (
              <button
                key={goal.title}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleGoal(goal.title)}
                className={`flex items-center gap-4 rounded-xl border bg-white p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 ${
                  selected
                    ? "border-violet-500 shadow-[inset_0_0_0_1px_rgba(10,95,207,0.5)]"
                    : "border-slate-200 hover:border-violet-300"
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xl">
                  {goal.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-[#0A2150]">{goal.title}</span>
                  <span className="mt-0.5 block text-[13px] text-slate-500">{goal.description}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] ${
                    selected ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300 text-transparent"
                  }`}
                >
                  ✓
                </span>
              </button>
            );
          })}
        </div>
      )}

      {currentStep === 5 && (
        <div className="space-y-5">
          <div>
            <label htmlFor="ob-handle" className={authLabel}>Public handle</label>
            <input
              id="ob-handle"
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase())}
              placeholder="yourname"
              className={authField}
            />
            <p className="mt-1.5 text-xs text-slate-500">Your page: /p/{handle || "yourname"}</p>
          </div>

          <div>
            <label htmlFor="ob-bio" className={authLabel}>Short bio</label>
            <textarea
              id="ob-bio"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself, your experience and what you do…"
              className={`${authTextarea} resize-none`}
            />
          </div>

          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900">
            <strong>Required:</strong> add at least one LinkedIn, Instagram, community, or
            website link. We review and approve creator accounts manually.
          </p>

          <div>
            <label htmlFor="ob-linkedin" className={authLabel}>LinkedIn</label>
            <input
              id="ob-linkedin"
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://www.linkedin.com/in/you"
              className={authField}
            />
          </div>
          <div>
            <label htmlFor="ob-instagram" className={authLabel}>Instagram</label>
            <input
              id="ob-instagram"
              type="url"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://www.instagram.com/you"
              className={authField}
            />
          </div>
          <div>
            <label htmlFor="ob-community" className={authLabel}>Community link</label>
            <input
              id="ob-community"
              type="url"
              value={community}
              onChange={(e) => setCommunity(e.target.value)}
              placeholder="https://t.me/yourgroup or Discord invite"
              className={authField}
            />
          </div>
          <div>
            <label htmlFor="ob-website" className={authLabel}>Website / portfolio</label>
            <input
              id="ob-website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourwebsite.com"
              className={authField}
            />
          </div>
        </div>
      )}
    </OnboardingShell>
  );
}
