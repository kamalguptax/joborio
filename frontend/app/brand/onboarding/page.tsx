"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Briefcase, CreditCard, Rocket } from "lucide-react";
import OnboardingShell from "@/components/auth/OnboardingShell";
import NicheSearch from "@/components/jobs/NicheSearch";
import PromoteJobTypes from "@/components/jobs/PromoteJobTypes";
import { fetchMe } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { fetchNiches } from "@/lib/api/creator";
import {
  fetchEmployerMe,
  updateEmployerJobPreferences,
} from "@/lib/api/employer";
import type { Niche } from "@/lib/api/types";
import { clearOnboardingPending } from "@/lib/auth/onboardingFlag";
import { homePathForUser, navigateTo, roleFlags } from "@/lib/auth/redirect";
import { getAuthToken } from "@/lib/auth/session";

const steps = [
  {
    icon: Briefcase,
    title: "What do you hire for?",
    description:
      "Pick the roles and skills you hire for. We use this to show you relevant listings and creators.",
  },
  {
    icon: CreditCard,
    title: "Billing & payment",
    description:
      "Billing details are needed before a program can go live. You can add them now or later.",
  },
  {
    icon: Rocket,
    title: "Launch your first program",
    description: "Your brand account is ready. Create a program to start reaching creators.",
  },
];

/** Onboarding for a freshly registered brand / company account. */
export default function BrandOnboardingPage() {
  const router = useRouter();
  const userId = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState("");
  const [niches, setNiches] = useState<Niche[]>([]);
  const [nicheIds, setNicheIds] = useState<number[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [billingMissing, setBillingMissing] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace("/brand/login");
      return;
    }
    fetchMe()
      .then((u) => {
        userId.current = u.id;
        if (!roleFlags(u).isEmployer) {
          navigateTo(router, homePathForUser(u, { prefer: "employer" }));
          return;
        }
        setCompany(u.employer?.company_name ?? "");
      })
      .catch(() => router.replace("/brand/login"));
    fetchNiches().then(setNiches).catch(() => setNiches([]));
    fetchEmployerMe()
      .then((d) => setBillingMissing(d.billing_missing ?? []))
      .catch(() => setBillingMissing(null));
  }, [router]);

  const finish = (to: string) => {
    if (userId.current != null) clearOnboardingPending(userId.current, "employer");
    router.push(to);
  };

  const next = async () => {
    setError(null);
    if (step === 0) {
      setSaving(true);
      try {
        await updateEmployerJobPreferences({
          niche_ids: nicheIds,
          countries: [],
          remote_only: remoteOnly,
          job_types: jobTypes,
        });
        setStep(1);
      } catch (err) {
        setError(
          err instanceof ApiClientError ? err.message : "Could not save your preferences.",
        );
      } finally {
        setSaving(false);
      }
      return;
    }
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }
    finish("/employer/programs/new");
  };

  const toggle = <T,>(list: T[], v: T) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  return (
    <OnboardingShell
      steps={steps}
      current={step}
      intro={
        company
          ? `Welcome, ${company}. Let's set up your brand account.`
          : "Let's set up your brand account."
      }
      error={error}
      exitHref="/employer/dashboard"
      exitLabel="Skip for now"
      onExit={() => {
        if (userId.current != null) clearOnboardingPending(userId.current, "employer");
      }}
      onBack={step === 0 ? undefined : () => setStep(step - 1)}
      onNext={next}
      nextDisabled={saving}
      nextLabel={
        saving ? "Saving…" : step === steps.length - 1 ? "Create first program" : "Save and continue"
      }
    >
      {step === 0 && (
        <div className="space-y-5">
          <NicheSearch
            niches={niches}
            selectedIds={nicheIds}
            onToggle={(id) => setNicheIds((p) => toggle(p, id))}
            onChange={setNicheIds}
            heading="Skills and categories you hire for"
          />
          <PromoteJobTypes
            selected={jobTypes}
            onToggle={(id) => setJobTypes((p) => toggle(p, id))}
            legend="Which type of roles do you hire for?"
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => setRemoteOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-violet-600"
            />
            Remote roles only
          </label>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4 text-sm text-slate-600">
          {billingMissing === null ? (
            <p>Add your company and payment details from Company &amp; payment.</p>
          ) : billingMissing.length === 0 ? (
            <p className="font-semibold text-emerald-700">
              Your billing details are complete. Nothing more to do here.
            </p>
          ) : (
            <>
              <p>Still needed before a program can go live:</p>
              <ul className="list-disc space-y-1 pl-5">
                {billingMissing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => finish("/employer/billing")}
                className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-[13px] font-semibold text-violet-700 hover:bg-violet-100"
              >
                Add billing details now
              </button>
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            Programs are how you pay creators for clicks, registrations and applications. You can
            create one now, or open your dashboard first.
          </p>
          <Link
            href="/employer/dashboard"
            onClick={() => {
              if (userId.current != null) clearOnboardingPending(userId.current, "employer");
            }}
            className="inline-block font-semibold text-violet-700 hover:underline"
          >
            Go to dashboard instead
          </Link>
        </div>
      )}
    </OnboardingShell>
  );
}
