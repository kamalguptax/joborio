"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import MathCaptcha from "@/components/auth/MathCaptcha";
import MultiSelect from "@/components/ui/MultiSelect";
import { fetchNiches } from "@/lib/api/creator";
import { ApiClientError } from "@/lib/api/client";
import {
  checkPublisherUsername,
  registerPublisher,
} from "@/lib/api/publisherAuth";
import type { Niche } from "@/lib/api/types";
import { rememberPublicCode, setAuthToken } from "@/lib/auth/session";

const baseField =
  "mt-2 h-12 w-full rounded-xl border bg-white px-4 text-base text-[#0F1B3D] placeholder:text-slate-400 focus:outline-none focus:ring-4";
const fieldOk =
  `${baseField} border-indigo-100 focus:border-violet-500 focus:ring-violet-500/15`;
const fieldErr =
  `${baseField} border-red-400 focus:border-red-500 focus:ring-red-500/15`;

const countries = [
  { value: "IN", label: "India" },
  { value: "AE", label: "UAE" },
  { value: "US", label: "USA" },
] as const;

const networkTypes = [
  { value: "agency", label: "Agency" },
  { value: "publisher", label: "Publisher" },
  { value: "affiliate", label: "Affiliate" },
  { value: "community", label: "Community" },
] as const;

const jobPrefs = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "remote", label: "Remote" },
  { value: "internship", label: "Internship" },
] as const;

const integrations = [
  { value: "dashboard", label: "Dashboard" },
  { value: "api", label: "API" },
  { value: "xml", label: "XML" },
  { value: "webhook", label: "Webhook" },
] as const;

type FieldKey =
  | "fullName"
  | "username"
  | "email"
  | "password"
  | "confirm"
  | "country"
  | "networkType"
  | "niches"
  | "jobs"
  | "socialUrl"
  | "websiteUrl"
  | "integration"
  | "accepted"
  | "captcha";

type FieldErrors = Partial<Record<FieldKey, string>>;

function RequiredMark() {
  return <span className="text-red-500"> *</span>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function PublisherRegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [country, setCountry] = useState<"" | "IN" | "AE" | "US">("");
  const [networkType, setNetworkType] = useState("");
  const [integration, setIntegration] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [selectedNiches, setSelectedNiches] = useState<number[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [captcha, setCaptcha] = useState({ captcha_id: "", captcha_answer: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [usernameHint, setUsernameHint] = useState<string | null>(null);

  useEffect(() => {
    fetchNiches()
      .then(setNiches)
      .catch(() => setNiches([]));
  }, []);

  useEffect(() => {
    const value = username.trim().toLowerCase();
    if (!value) {
      setUsernameStatus("idle");
      setUsernameHint(null);
      return;
    }

    if (!/^[a-z0-9_]{3,32}$/.test(value)) {
      setUsernameStatus("invalid");
      setUsernameHint(
        value.length < 3
          ? "Username must be at least 3 characters."
          : "Only lowercase letters, numbers, and underscore.",
      );
      return;
    }

    setUsernameStatus("checking");
    setUsernameHint("Checking availability…");
    const handle = window.setTimeout(() => {
      checkPublisherUsername(value)
        .then((res) => {
          if (username.trim().toLowerCase() !== value) return;
          if (!res.valid) {
            setUsernameStatus("invalid");
            setUsernameHint(res.message);
            setErrors((prev) => ({ ...prev, username: res.message }));
            return;
          }
          if (!res.available) {
            setUsernameStatus("taken");
            setUsernameHint(res.message);
            setErrors((prev) => ({ ...prev, username: res.message }));
            return;
          }
          setUsernameStatus("available");
          setUsernameHint(res.message);
          setErrors((prev) => {
            if (!prev.username) return prev;
            const next = { ...prev };
            delete next.username;
            return next;
          });
        })
        .catch(() => {
          if (username.trim().toLowerCase() !== value) return;
          setUsernameStatus("idle");
          setUsernameHint("Could not verify username right now.");
        });
    }, 400);

    return () => window.clearTimeout(handle);
  }, [username]);

  const onCaptcha = useCallback((v: { captcha_id: string; captcha_answer: string }) => {
    setCaptcha(v);
    setErrors((prev) => {
      if (!prev.captcha) return prev;
      const next = { ...prev };
      delete next.captcha;
      return next;
    });
  }, []);

  function clearError(key: FieldKey) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function toggleJob(value: string) {
    setSelectedJobs((prev) => {
      const next = prev.includes(value)
        ? prev.filter((j) => j !== value)
        : [...prev, value];
      if (next.length > 0) clearError("jobs");
      return next;
    });
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    const name = fullName.trim();
    const user = username.trim().toLowerCase();
    const mail = email.trim();
    const social = socialUrl.trim();
    const website = websiteUrl.trim();

    if (!name) next.fullName = "Full name is required.";
    else if (name.length < 2) next.fullName = "Enter your full name.";

    if (!user) next.username = "Username is required.";
    else if (!/^[a-z0-9_]{3,32}$/.test(user)) {
      next.username = "3–32 characters: lowercase letters, numbers, underscore.";
    } else if (usernameStatus === "taken") {
      next.username = "This username is already taken.";
    } else if (usernameStatus === "checking") {
      next.username = "Please wait while we check this username.";
    } else if (usernameStatus === "invalid") {
      next.username = usernameHint ?? "Invalid username.";
    }

    if (!mail) next.email = "Email is required.";
    else if (!isValidEmail(mail)) next.email = "Enter a valid email address.";

    if (!password) next.password = "Password is required.";
    else if (password.length < 8) {
      next.password = "Password must be at least 8 characters.";
    } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      next.password = "Use letters and numbers in your password.";
    }

    if (!confirm) next.confirm = "Confirm your password.";
    else if (password !== confirm) next.confirm = "Passwords do not match.";

    if (!country) next.country = "Select a country.";
    if (!networkType) next.networkType = "Select a network type.";
    if (!integration) next.integration = "Select an integration preference.";

    if (selectedNiches.length < 1) {
      next.niches = "Select at least one audience niche.";
    }
    if (selectedJobs.length < 1) {
      next.jobs = "Select at least one job preference.";
    }

    if (!social) next.socialUrl = "Social media URL is required.";
    else if (!isValidUrl(social)) {
      next.socialUrl = "Enter a valid URL starting with https://";
    }

    if (!website) next.websiteUrl = "Website / community URL is required.";
    else if (!isValidUrl(website)) {
      next.websiteUrl = "Enter a valid URL starting with https://";
    }

    if (!accepted) next.accepted = "You must accept the Terms & Conditions.";
    if (!captcha.captcha_id || !captcha.captcha_answer.trim()) {
      next.captcha = "Complete the captcha.";
    }

    return next;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError("Please fix the highlighted mandatory fields.");
      return;
    }

    setLoading(true);
    try {
      const data = await registerPublisher({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim(),
        password,
        password_confirmation: confirm,
        country: country as "IN" | "AE" | "US",
        niche_ids: selectedNiches,
        job_preferences: selectedJobs,
        network_type: networkType,
        social_url: socialUrl.trim(),
        website_url: websiteUrl.trim(),
        integration_preference: integration,
        accepted_terms: true,
        captcha_id: captcha.captcha_id,
        captcha_answer: captcha.captcha_answer,
      });
      setAuthToken(data.token);
      rememberPublicCode(data.user);
      router.push("/publisher/dashboard");
    } catch (err) {
      setFormError(
        err instanceof ApiClientError
          ? err.message
          : "Could not register. Check the API is running.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit} noValidate>
      {formError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </p>
      ) : null}

      <p className="text-xs text-slate-500">
        Fields marked <span className="font-semibold text-red-500">*</span> are mandatory.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          Full name
          <RequiredMark />
          <input
            className={errors.fullName ? fieldErr : fieldOk}
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              clearError("fullName");
            }}
            autoComplete="name"
            required
          />
          <FieldError message={errors.fullName} />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Username
          <RequiredMark />
          <input
            className={
              errors.username || usernameStatus === "taken" || usernameStatus === "invalid"
                ? fieldErr
                : usernameStatus === "available"
                  ? `${baseField} border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/15`
                  : fieldOk
            }
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              clearError("username");
            }}
            pattern="[a-zA-Z0-9_]{3,32}"
            placeholder="unique_handle"
            autoComplete="username"
            required
          />
          {usernameHint && !errors.username ? (
            <p
              className={`mt-1 text-xs font-medium ${
                usernameStatus === "available"
                  ? "text-emerald-600"
                  : usernameStatus === "checking"
                    ? "text-slate-500"
                    : "text-red-600"
              }`}
            >
              {usernameHint}
            </p>
          ) : (
            <FieldError message={errors.username} />
          )}
        </label>
      </div>

      <label className="block text-sm font-semibold text-slate-700">
        Email
        <RequiredMark />
        <input
          type="email"
          className={errors.email ? fieldErr : fieldOk}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError("email");
          }}
          autoComplete="email"
          required
        />
        <FieldError message={errors.email} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          Password
          <RequiredMark />
          <input
            type="password"
            className={errors.password ? fieldErr : fieldOk}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError("password");
            }}
            autoComplete="new-password"
            required
          />
          <FieldError message={errors.password} />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Confirm password
          <RequiredMark />
          <input
            type="password"
            className={errors.confirm ? fieldErr : fieldOk}
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              clearError("confirm");
            }}
            autoComplete="new-password"
            required
          />
          <FieldError message={errors.confirm} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          Country
          <RequiredMark />
          <select
            className={errors.country ? fieldErr : fieldOk}
            value={country}
            onChange={(e) => {
              setCountry(e.target.value as "" | "IN" | "AE" | "US");
              clearError("country");
            }}
            required
          >
            <option value="">Select country</option>
            {countries.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <FieldError message={errors.country} />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Network type
          <RequiredMark />
          <select
            className={errors.networkType ? fieldErr : fieldOk}
            value={networkType}
            onChange={(e) => {
              setNetworkType(e.target.value);
              clearError("networkType");
            }}
            required
          >
            <option value="">Select network type</option>
            {networkTypes.map((n) => (
              <option key={n.value} value={n.value}>
                {n.label}
              </option>
            ))}
          </select>
          <FieldError message={errors.networkType} />
        </label>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700">
          Audience niches
          <RequiredMark />
        </p>
        <div
          className={
            errors.niches
              ? "rounded-xl ring-2 ring-red-400/70 ring-offset-1"
              : undefined
          }
        >
          <MultiSelect
            options={niches.map((n) => ({
              value: String(n.id),
              label: n.name,
            }))}
            value={selectedNiches.map(String)}
            onChange={(next) => {
              setSelectedNiches(next.map(Number));
              if (next.length > 0) clearError("niches");
            }}
            disabled={niches.length === 0}
            placeholder={
              niches.length === 0 ? "Loading niches…" : "Search & select niches"
            }
            searchPlaceholder="Type to search niches…"
            emptyLabel="No niches match your search"
          />
        </div>
        <FieldError message={errors.niches} />
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700">
          Job preferences
          <RequiredMark />
        </p>
        <div
          className={`mt-2 flex flex-wrap gap-2 rounded-xl p-1 ${
            errors.jobs ? "ring-2 ring-red-400/70" : ""
          }`}
        >
          {jobPrefs.map((j) => {
            const active = selectedJobs.includes(j.value);
            return (
              <button
                key={j.value}
                type="button"
                onClick={() => toggleJob(j.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  active
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600"
                }`}
              >
                {j.label}
              </button>
            );
          })}
        </div>
        <FieldError message={errors.jobs} />
      </div>

      <label className="block text-sm font-semibold text-slate-700">
        Social media URL
        <RequiredMark />
        <input
          type="url"
          className={errors.socialUrl ? fieldErr : fieldOk}
          value={socialUrl}
          onChange={(e) => {
            setSocialUrl(e.target.value);
            clearError("socialUrl");
          }}
          placeholder="https://…"
          required
        />
        <FieldError message={errors.socialUrl} />
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        Website / community URL
        <RequiredMark />
        <input
          type="url"
          className={errors.websiteUrl ? fieldErr : fieldOk}
          value={websiteUrl}
          onChange={(e) => {
            setWebsiteUrl(e.target.value);
            clearError("websiteUrl");
          }}
          placeholder="https://…"
          required
        />
        <FieldError message={errors.websiteUrl} />
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        Integration preference
        <RequiredMark />
        <select
          className={errors.integration ? fieldErr : fieldOk}
          value={integration}
          onChange={(e) => {
            setIntegration(e.target.value);
            clearError("integration");
          }}
          required
        >
          <option value="">Select integration</option>
          {integrations.map((i) => (
            <option key={i.value} value={i.value}>
              {i.label}
            </option>
          ))}
        </select>
        <FieldError message={errors.integration} />
      </label>

      <div>
        <MathCaptcha onChange={onCaptcha} />
        <FieldError message={errors.captcha} />
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            className={`mt-1 ${errors.accepted ? "outline outline-2 outline-red-400" : ""}`}
            checked={accepted}
            onChange={(e) => {
              setAccepted(e.target.checked);
              if (e.target.checked) clearError("accepted");
            }}
            required
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="font-semibold text-violet-600">
              Terms & Conditions
            </Link>
            <RequiredMark />
          </span>
        </label>
        <FieldError message={errors.accepted} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-sm font-bold text-white shadow-lg disabled:opacity-60"
      >
        {loading ? "Submitting…" : "Submit publisher application"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Already a publisher?{" "}
        <Link href="/publisher/login" className="font-bold text-violet-600">
          Sign in
        </Link>
      </p>
    </form>
  );
}
