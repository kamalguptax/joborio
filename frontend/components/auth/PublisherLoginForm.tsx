"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useRef, useState } from "react";
import MathCaptcha, { isCaptchaFailureMessage } from "@/components/auth/MathCaptcha";
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
import { fetchMe } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { homePathForRole, navigateTo, nextForRole } from "@/lib/auth/redirect";
import { rejectWrongRole, type WrongRoleError } from "@/lib/auth/loginRoleGate";
import { sanitizeNextParam } from "@/lib/auth/safeRedirect";
import { loginPublisher } from "@/lib/api/publisherAuth";
import { getAuthToken, rememberPublicCode, setAuthToken } from "@/lib/auth/session";
import { cacheUser } from "@/lib/auth/userCache";

type FieldKey = "email" | "password" | "captcha";

const apiFieldMap: Record<string, FieldKey> = {
  email: "email",
  password: "password",
  captcha_id: "captcha",
  captcha_answer: "captcha",
};

export default function PublisherLoginForm() {
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
      const data = await loginPublisher({
        email: email.trim(),
        password,
        captcha_id: captcha.captcha_id,
        captcha_answer: captcha.captcha_answer,
      });
      setAuthToken(data.token);
      rememberPublicCode(data.user);
      const me = await fetchMe();

      // Publisher login only lets publishers in; other account types must
      // use their own login page.
      const wrong = await rejectWrongRole(me, "publisher");
      if (wrong) {
        setError(wrong.message);
        setWrongRole(wrong);
        setCaptcha({ captcha_id: "", captcha_answer: "" });
        setCaptchaResetKey((k) => k + 1);
        return;
      }

      rememberPublicCode(me);
      cacheUser(me, getAuthToken()); // header shows the avatar instantly
      navigateTo(
        router,
        nextForRole(nextAfterLogin, me, "publisher") ?? homePathForRole(me, "publisher"),
      );
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Unable to sign in. Check the API is running.";
      const mapped = err instanceof ApiClientError ? apiFieldErrors(err, apiFieldMap) : {};
      if (isCaptchaFailureMessage(message)) {
        mapped.captcha = message;
        setCaptcha({ captcha_id: "", captcha_answer: "" });
        setCaptchaResetKey((k) => k + 1);
      }
      setErrors(mapped);
      if (Object.keys(mapped).length === 0) setError(message);
      focusFirstInvalid(formRef.current);
    } finally {
      setLoading(false);
    }
  }

  return (
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
        <label htmlFor="publisher-email" className={authLabel}>
          Email address<span className="text-violet-600">*</span>
        </label>
        <input
          id="publisher-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={errors.email ? authFieldError : authField}
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
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "publisher-email-error" : undefined}
        />
        <FieldError id="publisher-email-error" message={errors.email} />
      </div>

      <div>
        <label htmlFor="publisher-password" className={authLabel}>
          Password<span className="text-violet-600">*</span>
        </label>
        <PasswordInput
          id="publisher-password"
          autoComplete="current-password"
          placeholder="Enter your password"
          className={errors.password ? authFieldError : authField}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clear("password");
            if (error) {
              setError(null);
              setWrongRole(null);
            }
          }}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "publisher-password-error" : undefined}
        />
        <FieldError id="publisher-password-error" message={errors.password} />
      </div>

      <div>
        <MathCaptcha onChange={onCaptcha} resetKey={captchaResetKey} />
        <FieldError id="publisher-captcha-error" message={errors.captcha} />
      </div>

      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className={authLink}>
          Forgot password?
        </Link>
        <Link
          href="/login"
          className="font-semibold text-slate-500 transition hover:text-violet-600"
        >
          Network Member sign-in
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={authPrimaryButton}
      >
        {loading ? "Signing in…" : "Sign in as Publisher"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Joining a community? Use{" "}
        <Link href="/login" className={authLink}>
          Network Member
        </Link>{" "}
        sign-in after you accept an invite.
      </p>
      <p className="text-center text-sm text-slate-500">
        New publisher?{" "}
        <Link href="/publisher/register" className={authLink}>
          Apply Now
        </Link>
      </p>
    </form>
  );
}
