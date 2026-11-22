"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Plug, Rocket, Users } from "lucide-react";
import OnboardingShell from "@/components/auth/OnboardingShell";
import { authField, authLabel, authTextarea } from "@/components/auth/authStyles";
import { fetchMe } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import {
  createPublisherCommunity,
  fetchPublisherCommunities,
  fetchPublisherIntegrations,
  updatePublisherIntegrationPreference,
} from "@/lib/api/publisher";
import { clearOnboardingPending } from "@/lib/auth/onboardingFlag";
import { homePathForUser, navigateTo, roleFlags } from "@/lib/auth/redirect";
import { getAuthToken } from "@/lib/auth/session";

const steps = [
  {
    icon: Users,
    title: "Create your first community",
    description:
      "A community is the group of members you invite and earn from. You can add more later.",
  },
  {
    icon: Plug,
    title: "How will you connect?",
    description: "Choose how your platform will exchange data with JobOrio.",
  },
  {
    icon: Rocket,
    title: "You're ready",
    description: "Pick campaigns from the marketplace and start inviting members.",
  },
];

const integrations = [
  { value: "dashboard", label: "Dashboard", hint: "Manage everything from the JobOrio dashboard." },
  { value: "api", label: "API", hint: "Create and track via API keys." },
  { value: "xml", label: "XML feed", hint: "Pull listings through an XML feed." },
  { value: "webhook", label: "Webhook", hint: "Receive events on your own endpoint." },
];

/** Onboarding for a freshly registered publisher / network owner. */
export default function PublisherOnboardingPage() {
  const router = useRouter();
  const userId = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [hasCommunity, setHasCommunity] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [commissionPercent, setCommissionPercent] = useState(12);
  const [integration, setIntegration] = useState("dashboard");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const commissionOptions = [10, 11, 12, 13, 14, 15];

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace("/publisher/login");
      return;
    }
    fetchMe()
      .then((u) => {
        userId.current = u.id;
        if (!roleFlags(u).isPublisher) {
          navigateTo(router, homePathForUser(u));
        }
      })
      .catch(() => router.replace("/publisher/login"));
    fetchPublisherCommunities()
      .then((c) => setHasCommunity(c.length > 0))
      .catch(() => undefined);
    fetchPublisherIntegrations()
      .then((i) => i.integration_preference && setIntegration(i.integration_preference))
      .catch(() => undefined);
  }, [router]);

  const done = () => {
    if (userId.current != null) clearOnboardingPending(userId.current, "publisher");
  };

  const next = async () => {
    setError(null);
    setSaving(true);
    try {
      if (step === 0 && !hasCommunity && name.trim()) {
        await createPublisherCommunity({
          name: name.trim(),
          category: category.trim() || undefined,
          categories: category.trim() ? [category.trim()] : undefined,
          commission_percent: commissionPercent,
          description: description.trim() || undefined,
        });
        setHasCommunity(true);
      }
      if (step === 1) {
        await updatePublisherIntegrationPreference(integration);
      }
      if (step < steps.length - 1) {
        setStep(step + 1);
      } else {
        done();
        router.push("/publisher/marketplace");
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingShell
      steps={steps}
      current={step}
      intro="Welcome to JobOrio. Let's set up your publisher account."
      error={error}
      exitHref="/publisher/dashboard"
      exitLabel="Skip for now"
      onExit={done}
      onBack={step === 0 ? undefined : () => setStep(step - 1)}
      onNext={next}
      nextDisabled={saving}
      nextLabel={
        saving ? "Saving…" : step === steps.length - 1 ? "Browse campaigns" : "Save and continue"
      }
    >
      {step === 0 &&
        (hasCommunity ? (
          <p className="text-sm font-semibold text-emerald-700">
            You already have a community. You can add more from Communities later.
          </p>
        ) : (
          <div className="space-y-5">
            <div>
              <label htmlFor="pc-name" className={authLabel}>Community name</label>
              <input
                id="pc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Delhi Job Seekers"
                className={authField}
              />
            </div>
            <div>
              <label htmlFor="pc-cat" className={authLabel}>Category (optional)</label>
              <input
                id="pc-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Jobs, Courses, Tech"
                className={authField}
              />
            </div>
            <div>
              <label htmlFor="pc-desc" className={authLabel}>Description (optional)</label>
              <textarea
                id="pc-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={authTextarea}
              />
            </div>
            <div>
              <p className={authLabel}>Publisher commission (10–15% of creator pool)</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {commissionOptions.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setCommissionPercent(pct)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      commissionPercent === pct
                        ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white"
                        : "border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                JobOrio keeps 30% first; your rate is from the remaining pool.
              </p>
            </div>
            <p className="text-xs text-slate-500">Leave the name empty to skip this step.</p>
          </div>
        ))}

      {step === 1 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {integrations.map((i) => (
            <button
              key={i.value}
              type="button"
              onClick={() => setIntegration(i.value)}
              className={`rounded-xl border p-4 text-left transition ${
                integration === i.value
                  ? "border-violet-600 bg-violet-50"
                  : "border-slate-200 bg-white hover:border-violet-300"
              }`}
            >
              <p className="font-semibold text-slate-900">{i.label}</p>
              <p className="mt-1 text-xs text-slate-500">{i.hint}</p>
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            Next, assign campaigns to your community from the marketplace, then invite members with
            your community link.
          </p>
          <Link
            href="/publisher/dashboard"
            onClick={done}
            className="inline-block font-semibold text-violet-700 hover:underline"
          >
            Go to dashboard instead
          </Link>
        </div>
      )}
    </OnboardingShell>
  );
}
