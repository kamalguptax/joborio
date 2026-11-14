"use client";

import {
  Briefcase,
  GraduationCap,
  Megaphone,
  Palette,
  Rocket,
  Sparkles,
  Target,
  UserRound,
  BadgeCheck,
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchMe } from "@/lib/api/auth";
import { createCreatorOnboarding, fetchNiches } from "@/lib/api/creator";
import { getReferralCode, clearReferralCode } from "@/lib/auth/referralStorage";
import { ApiClientError } from "@/lib/api/client";
import { getAuthToken } from "@/lib/auth/session";
import { detectCurrentPlace } from "@/lib/maps/detectPlace";
import NicheSearch from "@/components/jobs/NicheSearch";
import PromoteJobTypes from "@/components/jobs/PromoteJobTypes";
import { readPromoteJobTypes, savePromoteJobTypes } from "@/lib/jobs/promoteTypes";
import {
  SIGNUP_NAME_KEY,
  clearSignupRoleIntent,
  getSignupRoleIntent,
} from "@/components/auth/SignupForm";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import {
  authError,
  authInput,
  authLabel,
  authPrimaryButton,
  authSecondaryButton,
  authTextarea,
} from "@/components/auth/authStyles";
import type { Niche } from "@/lib/api/types";

const steps = [
  {
    number: 1,
    icon: UserRound,
    title: "Your profile",
    description: "Confirm your name and where you are based.",
    heading: "Let’s build your profile",
    lead: "Tell us a little about yourself so we can personalize your JobOrio experience.",
  },
  {
    number: 2,
    icon: Rocket,
    title: "How you use JobOrio",
    description: "Choose creator, recruiter or both.",
    heading: "What brings you to JobOrio?",
    lead: "Choose how you want to use the platform. You can change this later.",
  },
  {
    number: 3,
    icon: Sparkles,
    title: "Your niches",
    description: "Pick the topics and job types you promote.",
    heading: "What are you great at?",
    lead: "Select the skills and content categories that represent you.",
  },
  {
    number: 4,
    icon: Target,
    title: "Your goals",
    description: "Choose what you want to find and share.",
    heading: "What are your goals?",
    lead: "Choose what you want to find on JobOrio.",
  },
  {
    number: 5,
    icon: BadgeCheck,
    title: "Public profile",
    description: "Add your handle, bio and links so we can approve you.",
    heading: "Complete your profile",
    lead: "Add a few final details so people can discover you and your work.",
  },
];

const roles = [
  {
    id: "creator" as const,
    icon: Palette,
    title: "Creator",
    description: "Share opportunities with your audience and earn on results.",
  },
  {
    id: "recruiter" as const,
    icon: Briefcase,
    title: "Recruiter",
    description: "Find talented creators and hire the right people.",
  },
  {
    id: "both" as const,
    icon: Rocket,
    title: "Both",
    description: "Share, hire and collaborate with other professionals.",
  },
];

const goals = [
  { icon: Briefcase, title: "Find jobs", description: "Browse open jobs you can share." },
  { icon: GraduationCap, title: "Find courses", description: "Browse courses you can share." },
  { icon: Megaphone, title: "Find campaigns", description: "Browse campaigns you can share." },
];

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={authLabel}>
        {label}
      </label>
      {children}
      {hint ? <p className="mt-2 text-[13px] text-slate-500">{hint}</p> : null}
    </div>
  );
}

const choiceCard = (selected: boolean) =>
  `group relative flex w-full gap-4 rounded-2xl border p-5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 ${
    selected
      ? "border-violet-600 bg-violet-50/70 ring-1 ring-violet-600"
      : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/30"
  }`;

const iconTile = (selected: boolean) =>
  `flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition ${
    selected ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-violet-100 group-hover:text-violet-700"
  }`;

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
  const [userEmail, setUserEmail] = useState<string | null>(null);
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

    // Pre-fill the full name entered at signup (or by Google / LinkedIn).
    try {
      const savedName = sessionStorage.getItem(SIGNUP_NAME_KEY);
      if (savedName) setFullName((current) => current || savedName);
    } catch {
      /* storage unavailable */
    }
    fetchMe()
      .then((me) => {
        setFullName((current) => current || me.name || "");
        setUserEmail(me.email ?? null);
      })
      .catch(() => undefined);
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
      try {
        sessionStorage.removeItem(SIGNUP_NAME_KEY);
      } catch {
        /* ignore */
      }
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

  /** "Save & exit": save whatever is filled in and go to the dashboard. */
  const saveAndExit = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const me = await fetchMe();
      if (me.creator) {
        router.push("/creator/dashboard");
        return;
      }
      if (selectedRole === "recruiter") {
        router.push("/employer/onboarding");
        return;
      }

      const typed = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
      const seed = (fullName || me.email.split("@")[0] || "creator")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 18);
      const cleanHandle =
        typed.length >= 3
          ? typed
          : `${seed.length >= 3 ? seed : "creator"}${Math.floor(1000 + Math.random() * 9000)}`;

      await createCreatorOnboarding({
        handle: cleanHandle,
        bio: bio || undefined,
        social_links: {
          linkedin: linkedin.trim() || undefined,
          instagram: instagram.trim() || undefined,
          community: community.trim() || undefined,
          website: website.trim() || undefined,
        },
        niche_ids: selectedNicheIds,
        audience_countries: countryCode ? [countryCode] : undefined,
        promote_job_types: jobTypes,
        referral_code: getReferralCode() ?? undefined,
      });
      savePromoteJobTypes(jobTypes);
      clearReferralCode();
      clearSignupRoleIntent();
      try {
        sessionStorage.removeItem(SIGNUP_NAME_KEY);
      } catch {
        /* ignore */
      }
      router.push("/creator/dashboard");
    } catch (err) {
      setSubmitError(
        err instanceof ApiClientError
          ? err.message
          : "Could not save your progress. Please try again.",
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
  const step = steps.find((s) => s.number === currentStep) ?? steps[0];
  const isLast = currentStep === 5;

  return (
    <OnboardingShell
      steps={visibleSteps.map((s) => ({
        id: s.number,
        title: s.title,
        description: s.description,
        icon: s.icon,
      }))}
      activeIndex={visibleIndex}
      heading={step.heading}
      lead={step.lead}
      userEmail={userEmail}
      onSaveExit={saveAndExit}
      saveExitBusy={submitting}
    >
      <div key={currentStep} className="animate-[fadeIn_.35s_ease]">
        {/* ================= STEP 1 ================= */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <Field label="Full name" htmlFor="fullName">
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Enter your full name"
                className={authInput}
              />
            </Field>

            <Field
              label="Location"
              htmlFor="location"
              hint={
                locating
                  ? "Checking Google for your city…"
                  : locationFromGoogle
                    ? "Filled from Google. You can edit it."
                    : undefined
              }
            >
              <input
                id="location"
                type="text"
                autoComplete="address-level2"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder={locating ? "Finding your location…" : "e.g. Lucknow, India"}
                className={authInput}
              />
            </Field>
          </div>
        )}

        {/* ================= STEP 2 ================= */}
        {currentStep === 2 && (
          <div>
            <div className="grid gap-3">
              {roles.map((role) => {
                const selected = selectedRole === role.id;
                const Icon = role.icon;
                return (
                  <button
                    key={role.title}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setSelectedRole(role.id);
                      setSubmitError(null);
                    }}
                    className={choiceCard(selected)}
                  >
                    <span className={iconTile(selected)}>
                      <Icon size={22} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[17px] font-semibold text-[#0F1B3D]">
                        {role.title}
                      </span>
                      <span className="mt-1 block text-[15px] leading-6 text-slate-500">
                        {role.description}
                      </span>
                    </span>
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                        selected
                          ? "border-violet-600 bg-violet-600 text-white"
                          : "border-slate-300 bg-white text-transparent"
                      }`}
                    >
                      <Check size={14} strokeWidth={3} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= STEP 3 ================= */}
        {currentStep === 3 && (
          <div className="space-y-8">
            <NicheSearch
              niches={niches}
              selectedIds={selectedNicheIds}
              onToggle={toggleNiche}
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

        {/* ================= STEP 4 ================= */}
        {currentStep === 4 && (
          <div className="grid gap-3">
            {goals.map((goal) => {
              const selected = selectedGoals.includes(goal.title);
              const Icon = goal.icon;
              return (
                <button
                  key={goal.title}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleGoal(goal.title)}
                  className={choiceCard(selected)}
                >
                  <span className={iconTile(selected)}>
                    <Icon size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-semibold text-[#0F1B3D]">
                      {goal.title}
                    </span>
                    <span className="mt-1 block text-[15px] leading-6 text-slate-500">
                      {goal.description}
                    </span>
                  </span>
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${
                      selected
                        ? "border-violet-600 bg-violet-600 text-white"
                        : "border-slate-300 bg-white text-transparent"
                    }`}
                  >
                    <Check size={14} strokeWidth={3} />
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ================= STEP 5 ================= */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <Field
              label="Public handle"
              htmlFor="handle"
              hint={`Your page: /p/${handle || "yourname"}`}
            >
              <input
                id="handle"
                type="text"
                autoComplete="username"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="yourname"
                className={authInput}
              />
            </Field>

            <Field label="Short bio" htmlFor="bio">
              <textarea
                id="bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself, your experience and what you do…"
                className={authTextarea}
              />
            </Field>

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              Add at least one link below. New creator accounts stay pending until an admin approves
              them.
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="LinkedIn" htmlFor="linkedin">
                <input
                  id="linkedin"
                  type="url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://www.linkedin.com/in/you"
                  className={authInput}
                />
              </Field>
              <Field label="Instagram" htmlFor="instagram">
                <input
                  id="instagram"
                  type="url"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://www.instagram.com/you"
                  className={authInput}
                />
              </Field>
              <Field label="Community link" htmlFor="community">
                <input
                  id="community"
                  type="url"
                  value={community}
                  onChange={(e) => setCommunity(e.target.value)}
                  placeholder="https://t.me/yourgroup"
                  className={authInput}
                />
              </Field>
              <Field label="Website / portfolio" htmlFor="website">
                <input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className={authInput}
                />
              </Field>
            </div>
          </div>
        )}
      </div>

      {/* ================= ACTIONS ================= */}
      {submitError ? (
        <p role="alert" className={`${authError} mt-6`}>
          {submitError}
        </p>
      ) : null}

      <div className="mt-10 flex items-center gap-3 border-t border-slate-100 pt-6">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={previousStep}
            className={`${authSecondaryButton} px-5`}
          >
            <ArrowLeft size={18} />
            Back
          </button>
        ) : null}

        <button
          type="button"
          onClick={isLast ? completeOnboarding : nextStep}
          disabled={submitting}
          className={`${authPrimaryButton} sm:w-auto sm:min-w-[200px]`}
        >
          {isLast ? (submitting ? "Saving…" : "Complete profile") : "Save and continue"}
          {!isLast ? <ArrowRight size={18} /> : null}
        </button>
      </div>

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
    </OnboardingShell>
  );
}
