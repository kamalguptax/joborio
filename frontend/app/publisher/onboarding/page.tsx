"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Globe, Plug, Rocket, Users } from "lucide-react";
import OnboardingShell from "@/components/auth/OnboardingShell";
import MultiSelect from "@/components/ui/MultiSelect";
import { authField, authFieldError, authLabel, authTextarea } from "@/components/auth/authStyles";
import { fetchMe } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { fetchNiches } from "@/lib/api/creator";
import type { Niche } from "@/lib/api/types";
import {
  createPublisherCommunity,
  fetchPublisherCommunities,
  fetchPublisherIntegrations,
  fetchPublisherSettings,
  updatePublisherIntegrationPreference,
  updatePublisherProfile,
} from "@/lib/api/publisher";
import { clearOnboardingPending } from "@/lib/auth/onboardingFlag";
import { homePathForUser, navigateTo, roleFlags } from "@/lib/auth/redirect";
import { getAuthToken } from "@/lib/auth/session";
import {
  isValidHttpUrl,
  publisherCountries,
  publisherJobPrefs,
  publisherNetworkTypes,
} from "@/lib/publisherProfileOptions";

const steps = [
  {
    icon: Globe,
    title: "Tell us about your network",
    description:
      "Your country, audience and links help us match you with the right campaigns.",
  },
  {
    icon: Users,
    title: "Create your first community",
    description:
      "A community is the group of members you invite and earn from. You can add more later.",
  },
  {
    icon: Plug,
    title: "How will you connect?",
    description: "Choose how your platform will exchange data with Upclift.",
  },
  {
    icon: Rocket,
    title: "You're ready",
    description: "Pick campaigns from the marketplace and start inviting members.",
  },
];

const integrations = [
  { value: "dashboard", label: "Dashboard", hint: "Manage everything from the Upclift dashboard." },
  { value: "api", label: "API", hint: "Create and track via API keys." },
  { value: "xml", label: "XML feed", hint: "Pull listings through an XML feed." },
  { value: "webhook", label: "Webhook", hint: "Receive events on your own endpoint." },
];

type ProfileErrors = Partial<Record<"country" | "networkType" | "niches" | "jobs" | "links", string>>;

function FieldMsg({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}

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
  const [country, setCountry] = useState("");
  const [networkType, setNetworkType] = useState("");
  const [selectedNiches, setSelectedNiches] = useState<number[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [socialUrl, setSocialUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [niches, setNiches] = useState<Niche[]>([]);
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
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
    fetchNiches()
      .then(setNiches)
      .catch(() => setNiches([]));
    fetchPublisherSettings()
      .then(({ publisher }) => {
        setCountry(publisher.country_code ?? "");
        setNetworkType(publisher.network_type ?? "");
        setSelectedNiches(publisher.niche_ids ?? []);
        setSelectedJobs(publisher.job_preferences ?? []);
        setSocialUrl(publisher.social_url ?? "");
        setWebsiteUrl(publisher.website_url ?? "");
      })
      .catch(() => undefined);
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

  function validateProfile(): ProfileErrors {
    const errs: ProfileErrors = {};
    const social = socialUrl.trim();
    const website = websiteUrl.trim();
    if (!country) errs.country = "Select a country.";
    if (!networkType) errs.networkType = "Select a network type.";
    if (selectedNiches.length < 1) errs.niches = "Select at least one audience niche.";
    if (selectedJobs.length < 1) errs.jobs = "Select at least one job preference.";
    if (!social && !website) {
      errs.links = "Add a social media URL or a website / community URL (at least one).";
    } else if ((social && !isValidHttpUrl(social)) || (website && !isValidHttpUrl(website))) {
      errs.links = "Enter valid URLs starting with https://";
    }
    return errs;
  }

  function toggleJob(value: string) {
    setSelectedJobs((prev) => (prev.includes(value) ? prev.filter((j) => j !== value) : [...prev, value]));
    setProfileErrors((prev) => ({ ...prev, jobs: undefined }));
  }

  const next = async () => {
    setError(null);
    setSaving(true);
    try {
      if (step === 0) {
        const errs = validateProfile();
        setProfileErrors(errs);
        if (Object.keys(errs).length > 0) {
          setError("Please complete the required fields.");
          return;
        }
        await updatePublisherProfile({
          country_code: country,
          network_type: networkType,
          niche_ids: selectedNiches,
          job_preferences: selectedJobs,
          ...(socialUrl.trim() ? { social_url: socialUrl.trim() } : {}),
          ...(websiteUrl.trim() ? { website_url: websiteUrl.trim() } : {}),
        });
      }
      if (step === 1 && !hasCommunity && name.trim()) {
        await createPublisherCommunity({
          name: name.trim(),
          category: category.trim() || undefined,
          categories: category.trim() ? [category.trim()] : undefined,
          commission_percent: commissionPercent,
          description: description.trim() || undefined,
        });
        setHasCommunity(true);
      }
      if (step === 2) {
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
      intro="Welcome to Upclift. Let's set up your publisher account."
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
      {step === 0 && (
        <div className="space-y-5">
          <p className="text-xs text-slate-500">
            Fields marked <span className="font-semibold text-violet-600">*</span> are required.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pp-country" className={authLabel}>
                Country<span className="text-violet-600"> *</span>
              </label>
              <select
                id="pp-country"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setProfileErrors((prev) => ({ ...prev, country: undefined }));
                }}
                className={profileErrors.country ? authFieldError : authField}
              >
                <option value="">Select country</option>
                {publisherCountries.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <FieldMsg message={profileErrors.country} />
            </div>
            <div>
              <label htmlFor="pp-network" className={authLabel}>
                Network type<span className="text-violet-600"> *</span>
              </label>
              <select
                id="pp-network"
                value={networkType}
                onChange={(e) => {
                  setNetworkType(e.target.value);
                  setProfileErrors((prev) => ({ ...prev, networkType: undefined }));
                }}
                className={profileErrors.networkType ? authFieldError : authField}
              >
                <option value="">Select network type</option>
                {publisherNetworkTypes.map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </select>
              <FieldMsg message={profileErrors.networkType} />
            </div>
          </div>

          <div>
            <p className={authLabel}>
              Audience niches<span className="text-violet-600"> *</span>
            </p>
            <div
              className={
                profileErrors.niches ? "rounded-lg ring-2 ring-red-400/70 ring-offset-1" : undefined
              }
            >
              <MultiSelect
                options={niches.map((n) => ({ value: String(n.id), label: n.name }))}
                value={selectedNiches.map(String)}
                onChange={(next) => {
                  setSelectedNiches(next.map(Number));
                  if (next.length > 0) setProfileErrors((prev) => ({ ...prev, niches: undefined }));
                }}
                disabled={niches.length === 0}
                placeholder={niches.length === 0 ? "Loading niches…" : "Search & select niches"}
                searchPlaceholder="Type to search niches…"
                emptyLabel="No niches match your search"
              />
            </div>
            <FieldMsg message={profileErrors.niches} />
          </div>

          <div>
            <p className={authLabel}>
              Job preferences<span className="text-violet-600"> *</span>
            </p>
            <div
              className={`mt-2 flex flex-wrap gap-2 rounded-lg p-1 ${
                profileErrors.jobs ? "ring-2 ring-red-400/70" : ""
              }`}
            >
              {publisherJobPrefs.map((j) => {
                const active = selectedJobs.includes(j.value);
                return (
                  <button
                    key={j.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleJob(j.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border border-violet-600 bg-violet-600 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-violet-300"
                    }`}
                  >
                    {j.label}
                  </button>
                );
              })}
            </div>
            <FieldMsg message={profileErrors.jobs} />
          </div>

          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Social media or website —{" "}
              <span className="font-semibold text-violet-600">at least one required</span>.
            </p>
            <div>
              <label htmlFor="pp-social" className={authLabel}>Social media URL</label>
              <input
                id="pp-social"
                type="url"
                value={socialUrl}
                onChange={(e) => {
                  setSocialUrl(e.target.value);
                  setProfileErrors((prev) => ({ ...prev, links: undefined }));
                }}
                placeholder="https://…"
                className={profileErrors.links ? authFieldError : authField}
              />
            </div>
            <div>
              <label htmlFor="pp-website" className={authLabel}>Website / community URL</label>
              <input
                id="pp-website"
                type="url"
                value={websiteUrl}
                onChange={(e) => {
                  setWebsiteUrl(e.target.value);
                  setProfileErrors((prev) => ({ ...prev, links: undefined }));
                }}
                placeholder="https://…"
                className={profileErrors.links ? authFieldError : authField}
              />
              <FieldMsg message={profileErrors.links} />
            </div>
          </div>
        </div>
      )}

      {step === 1 &&
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
                Upclift keeps 30% first; your rate is from the remaining pool.
              </p>
            </div>
            <p className="text-xs text-slate-500">Leave the name empty to skip this step.</p>
          </div>
        ))}

      {step === 2 && (
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

      {step === 3 && (
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
