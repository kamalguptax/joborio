"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useRef, useState } from "react";
import { sanitizeNextParam } from "@/lib/auth/safeRedirect";
import { login, fetchMe } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { getAuthToken, rememberPublicCode, setAuthToken } from "@/lib/auth/session";
import { cacheUser } from "@/lib/auth/userCache";
import {
  canVisit,
  homePathForRole,
  homePathForUser,
  navigateTo,
  nextForRole,
  type LoginRole,
} from "@/lib/auth/redirect";
import {
  rejectWrongRole,
  wrongRoleFromServer,
  type WrongRoleError,
} from "@/lib/auth/loginRoleGate";
import MathCaptcha, { isCaptchaFailureMessage } from "@/components/auth/MathCaptcha";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import AuthDivider from "@/components/auth/AuthDivider";
import FieldError from "@/components/auth/FieldError";
import PasswordInput from "@/components/auth/PasswordInput";
import { focusFirstInvalid, useFieldErrors } from "@/components/auth/useFieldErrors";
import {
  authAlertError,
  authField,
  authFieldError,
  authLabel,
  authLink,
  authPrimaryButton,
} from "@/components/auth/authStyles";
import { apiFieldErrors, emailProblem } from "@/lib/validation";

type FieldKey = "email" | "password" | "captcha";

const apiFieldMap: Record<string, FieldKey> = {
  email: "email",
  password: "password",
  captcha_id: "captcha",
  captcha_answer: "captcha",
};

/**
 * `role` is set on the creator / brand login pages: only that account type can
 * sign in there and it always lands on its own dashboard. Without `role` (the
 * main /login page) any account type is accepted and routed to its own home.
 */
export default function LoginForm({
  prefer,
  role,
}: { prefer?: "employer"; role?: LoginRole } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextAfterLogin = sanitizeNextParam(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState({ captcha_id: "", captcha_answer: "" });
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [wrongRole, setWrongRole] = useState<WrongRoleError | null>(null);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { errors, setErrors, clear, setOne } = useFieldErrors<FieldKey>();

  const onCaptcha = useCallback(
    (v: { captcha_id: string; captcha_answer: string }) => {
      setCaptcha(v);
      if (v.captcha_id && v.captcha_answer.trim()) clear("captcha");
    },
    [clear],
  );

  const rules: Record<FieldKey, () => string | null> = {
    email: () => emailProblem(email),
    password: () => (password ? null : "Password is required."),
    captcha: () =>
      captcha.captcha_id && captcha.captcha_answer.trim() ? null : "Complete the captcha.",
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setWrongRole(null);

    const found: Partial<Record<FieldKey, string>> = {};
    (Object.keys(rules) as FieldKey[]).forEach((k) => {
      const problem = rules[k]();
      if (problem) found[k] = problem;
    });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirstInvalid(formRef.current);
      return;
    }
    setLoading(true);

    try {
      const data = await login({
        email: email.trim(),
        password,
        captcha_id: captcha.captcha_id,
        captcha_answer: captcha.captcha_answer,
        login_as: role,
      });
      setAuthToken(data.token);
      rememberPublicCode(data.user);

      const me = await fetchMe();

      // Creator / Brand login page: refuse any other account type.
      if (role) {
        const wrong = await rejectWrongRole(me, role);
        if (wrong) {
          setError(wrong.message);
          setWrongRole(wrong);
          setCaptcha({ captcha_id: "", captcha_answer: "" });
          setCaptchaResetKey((k) => k + 1);
          return;
        }
      }

      rememberPublicCode(me);
      cacheUser(me, getAuthToken()); // header shows the avatar instantly

      // ?next= is honoured only if it belongs to THIS account type;
      // otherwise the user goes to their own dashboard / onboarding
      // (admin → /admin/dashboard on this site).
      const target = role
        ? (nextForRole(nextAfterLogin, me, role) ?? homePathForRole(me, role))
        : nextAfterLogin && canVisit(nextAfterLogin, me)
          ? nextAfterLogin
          : homePathForUser(me, { prefer });
      navigateTo(router, target);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Unable to sign in. Check the API is running.";
      // The server already refused this account type for this login page.
      if (err instanceof ApiClientError && err.code === "ROLE_MISMATCH") {
        const d = (err.details ?? {}) as { use_login_path?: string };
        setError(message);
        setWrongRole(wrongRoleFromServer(message, d.use_login_path));
        setCaptcha({ captcha_id: "", captcha_answer: "" });
        setCaptchaResetKey((k) => k + 1);
        return;
      }
      const mapped = err instanceof ApiClientError ? apiFieldErrors(err, apiFieldMap) : {};
      if (isCaptchaFailureMessage(message)) {
        mapped.captcha = message;
        setCaptcha({ captcha_id: "", captcha_answer: "" });
        setCaptchaResetKey((k) => k + 1);
      }
      setErrors(mapped);
      // Field-level messages show under the field; anything else (e.g. wrong
      // credentials) is shown once at the top of the form.
      if (Object.keys(mapped).length === 0) setError(message);
      focusFirstInvalid(formRef.current);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SocialAuthButtons intent="login" role={role} />

      <AuthDivider />

      <form ref={formRef} className="space-y-4" onSubmit={onSubmit} noValidate>
        {error ? (
          <p role="alert" className={authAlertError}>
            {error}
            {wrongRole ? (
              <>
                {" "}
                <Link href={wrongRole.linkHref} className="font-semibold underline">
                  {wrongRole.linkLabel}
                </Link>
                .
              </>
            ) : null}
          </p>
        ) : null}

        <div>
          <label htmlFor="email" className={authLabel}>
            Email address<span className="text-violet-600">*</span>
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clear("email");
              if (error) {
                setError(null);
                setWrongRole(null);
              }
            }}
            onBlur={() => setOne("email", email ? emailProblem(email) ?? undefined : undefined)}
            placeholder="you@example.com"
            className={errors.email ? authFieldError : authField}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "login-email-error" : undefined}
          />
          <FieldError id="login-email-error" message={errors.email} />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className={authLabel}>
              Password<span className="text-violet-600">*</span>
            </label>
            <Link href="/forgot-password" className={`${authLink} text-xs`}>
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clear("password");
              if (error) {
                setError(null);
                setWrongRole(null);
              }
            }}
            placeholder="Enter your password"
            className={errors.password ? authFieldError : authField}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "login-password-error" : undefined}
          />
          <FieldError id="login-password-error" message={errors.password} />
        </div>

        <div>
          <MathCaptcha onChange={onCaptcha} resetKey={captchaResetKey} />
          <FieldError id="login-captcha-error" message={errors.captcha} />
        </div>

        <button type="submit" disabled={loading} className={authPrimaryButton}>
          {loading ? "Signing in…" : "Log in to JobOrio"}
        </button>
      </form>
    </>
  );
}
