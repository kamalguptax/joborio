"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import MathCaptcha from "@/components/auth/MathCaptcha";
import PasswordInput from "@/components/auth/PasswordInput";
import {
  authAlertError,
  authField,
  authFieldError,
  authLabel,
  authLink,
  authPrimaryButton,
} from "@/components/auth/authStyles";
import { ApiClientError } from "@/lib/api/client";
import {
  checkPublisherUsername,
  registerPublisher,
} from "@/lib/api/publisherAuth";
import { rememberPublicCode, setAuthToken } from "@/lib/auth/session";
import { markOnboardingPending } from "@/lib/auth/onboardingFlag";

const fieldOk = authField;
const fieldErr = authFieldError;

type FieldKey =
  | "fullName"
  | "username"
  | "email"
  | "password"
  | "confirm"
  | "accepted"
  | "captcha";

type FieldErrors = Partial<Record<FieldKey, string>>;

function RequiredMark() {
  return <span className="text-violet-600"> *</span>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const apiFieldMap: Record<string, FieldKey> = {
  email: "email",
  username: "username",
  full_name: "fullName",
  password: "password",
  password_confirmation: "confirm",
  accepted_terms: "accepted",
  captcha_id: "captcha",
  captcha_answer: "captcha",
};

function firstDetailMessage(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const first = value.find((v) => typeof v === "string" && v.trim());
    return typeof first === "string" ? first.trim() : null;
  }
  return null;
}

/** Map API validation / conflict messages onto form fields. */
function fieldErrorsFromApi(err: ApiClientError): FieldErrors {
  const next: FieldErrors = {};
  const details = err.details;
  if (details && typeof details === "object" && !Array.isArray(details)) {
    for (const [key, value] of Object.entries(details as Record<string, unknown>)) {
      const field = apiFieldMap[key];
      const message = firstDetailMessage(value);
      if (field && message) next[field] = message;
    }
  }

  const msg = err.message || "";
  if (
    !next.email &&
    /email.*(already|taken|registered)|already registered|already been taken/i.test(msg)
  ) {
    next.email = msg;
  }
  if (!next.username && /username.*(already|taken)/i.test(msg)) {
    next.username = msg;
  }

  return next;
}

export default function PublisherRegisterForm() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    const name = fullName.trim();
    const user = username.trim().toLowerCase();
    const mail = email.trim();

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
        accepted_terms: true,
        captcha_id: captcha.captcha_id,
        captcha_answer: captcha.captcha_answer,
      });
      setAuthToken(data.token);
      rememberPublicCode(data.user);
      markOnboardingPending(data.user.id, "publisher");
      router.push("/publisher/onboarding");
    } catch (err) {
      if (err instanceof ApiClientError) {
        const fieldErrs = fieldErrorsFromApi(err);
        setErrors(fieldErrs);
        setFormError(err.message);
        if (fieldErrs.email) {
          requestAnimationFrame(() => {
            emailRef.current?.focus();
            emailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          });
        }
      } else {
        setFormError("Could not register. Check the API is running.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit} noValidate>
      {formError ? (
        <p className={authAlertError}>{formError}</p>
      ) : null}

      <p className="text-xs text-slate-500">
        Fields marked <span className="font-semibold text-violet-600">*</span> are mandatory.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={authLabel}>
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
        <label className={authLabel}>
          Username
          <RequiredMark />
          <input
            className={
              errors.username || usernameStatus === "taken" || usernameStatus === "invalid"
                ? fieldErr
                : usernameStatus === "available"
                  ? `${fieldOk} border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/15`
                  : fieldOk
            }
            value={username}
            onChange={(e) => {
              setUsername(e.target.value.toLowerCase());
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

      <label className={authLabel}>
        Email
        <RequiredMark />
        <input
          ref={emailRef}
          type="email"
          aria-invalid={Boolean(errors.email)}
          className={errors.email ? fieldErr : fieldOk}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError("email");
            if (formError) setFormError(null);
          }}
          autoComplete="email"
          required
        />
        <FieldError message={errors.email} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={authLabel}>
          Password
          <RequiredMark />
          <PasswordInput
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
        <label className={authLabel}>
          Confirm password
          <RequiredMark />
          <PasswordInput
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

      <div>
        <MathCaptcha onChange={onCaptcha} />
        <FieldError message={errors.captcha} />
      </div>

      <div>
        <label className="flex items-start gap-3 text-[13px] text-slate-600">
          <input
            type="checkbox"
            className={`mt-0.5 h-4 w-4 accent-violet-600 ${errors.accepted ? "outline outline-2 outline-red-400" : ""}`}
            checked={accepted}
            onChange={(e) => {
              setAccepted(e.target.checked);
              if (e.target.checked) clearError("accepted");
            }}
            required
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className={authLink}>
              Terms & Conditions
            </Link>
            ,{" "}
            <Link href="/privacy" className={authLink}>
              Privacy Policy
            </Link>
            , and{" "}
            <Link href="/payout-policy" className={authLink}>
              Payout Policy
            </Link>
            <RequiredMark />
          </span>
        </label>
        <FieldError message={errors.accepted} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={authPrimaryButton}
      >
        {loading ? "Submitting…" : "Apply Now"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Already a publisher?{" "}
        <Link href="/publisher/login" className={authLink}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
