"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MathCaptcha from "@/components/auth/MathCaptcha";
import { ApiClientError } from "@/lib/api/client";
import {
  acceptJoinInvitation,
  fetchJoinInvitation,
  type JoinInvitation,
} from "@/lib/api/network";
import { fetchMe } from "@/lib/api/auth";
import {
  getAuthToken,
  rememberPublicCode,
  setAuthToken,
} from "@/lib/auth/session";
import { useResolvedParam } from "@/lib/hooks/useResolvedParam";
import { STATIC_EXPORT_PLACEHOLDER } from "@/lib/staticExport";

const field =
  "mt-2 h-12 w-full rounded-xl border border-indigo-100 bg-white px-4 text-base text-[#0F1B3D] placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/15";

export default function JoinInviteClient() {
  const search = useSearchParams();
  const router = useRouter();
  const token = (search.get("token") ?? "").trim();
  const pathPub = useResolvedParam("pub", /^\/join\/([^/]+)/);
  const pathCom = useResolvedParam("com", /^\/join\/[^/]+\/([^/]+)/);
  const pub =
    pathPub && pathPub !== STATIC_EXPORT_PLACEHOLDER
      ? pathPub
      : (search.get("pub") ?? "").trim();
  const com =
    pathCom && pathCom !== STATIC_EXPORT_PLACEHOLDER
      ? pathCom
      : (search.get("com") ?? "").trim();

  const [invite, setInvite] = useState<JoinInvitation | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [captcha, setCaptcha] = useState({ captcha_id: "", captcha_answer: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const onCaptcha = useCallback((v: { captcha_id: string; captcha_answer: string }) => {
    setCaptcha(v);
  }, []);

  const title = useMemo(() => {
    if (!invite) return "Join network";
    const community = invite.community?.name;
    const publisher = invite.publisher.name ?? invite.publisher.code;
    return community
      ? `Join ${community}`
      : `Join ${publisher ?? "publisher network"}`;
  }, [invite]);

  useEffect(() => {
    if (!token) {
      setError("Missing invitation token.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    Promise.all([
      fetchJoinInvitation(token),
      getAuthToken()
        ? fetchMe()
            .then((u) => {
              setLoggedIn(true);
              setName(u.name ?? "");
              setEmail(u.email ?? "");
            })
            .catch(() => setLoggedIn(false))
        : Promise.resolve(),
    ])
      .then(([inv]) => {
        if (cancelled) return;
        setInvite(inv);
        if (inv.email && !email) setEmail(inv.email);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiClientError
            ? err.message
            : "This invitation is invalid or expired.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("Missing invitation token.");
      return;
    }

    if (!loggedIn) {
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }
      if (!captcha.captcha_id || !captcha.captcha_answer) {
        setError("Complete the captcha.");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await acceptJoinInvitation(
        loggedIn
          ? { token }
          : {
              token,
              name: name.trim(),
              email: email.trim(),
              password,
              password_confirmation: confirm,
              captcha_id: captcha.captcha_id,
              captcha_answer: captcha.captcha_answer,
            },
      );
      setAuthToken(res.token);
      rememberPublicCode(res.user);
      router.push(res.redirect || "/network/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not accept invitation.",
      );
    } finally {
      setSaving(false);
    }
  }

  const underLabel = invite?.publisher.code ?? pub;

  return (
    <section className="relative overflow-x-clip bg-[linear-gradient(135deg,#0B1D4F_0%,#14296B_45%,#3F2AA8_100%)] px-4 py-16 text-white sm:px-8 sm:py-20">
      <div className="relative mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Network invite
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{title}</h1>
          <p className="mt-4 text-slate-300">
            You are joining as a private network member
            {underLabel ? ` under ${underLabel}` : ""}
            {com ? ` / ${com}` : ""}. This is separate from a public Creator
            account.
          </p>
        </div>

        <div className="rounded-[24px] bg-white p-5 text-slate-900 shadow-2xl sm:rounded-[28px] sm:p-8">
          {loading ? (
            <p className="text-sm text-slate-500">Checking invitation…</p>
          ) : error && !invite ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : invite ? (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
                <p className="font-semibold text-[#172b63]">
                  {invite.publisher.name ?? invite.publisher.code}
                </p>
                <p className="mt-1 text-slate-500">
                  {invite.community
                    ? `Community: ${invite.community.name}`
                    : "Publisher-level membership"}
                </p>
              </div>

              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              {loggedIn ? (
                <p className="text-sm text-slate-600">
                  Signed in as <span className="font-semibold">{email || "member"}</span>.
                  Accept to join this network.
                </p>
              ) : (
                <>
                  <label className="block text-sm font-semibold text-slate-700">
                    Full name
                    <input
                      className={field}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Email
                    <input
                      type="email"
                      className={field}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Password
                      <input
                        type="password"
                        className={field}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                      Confirm
                      <input
                        type="password"
                        className={field}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                      />
                    </label>
                  </div>
                  <MathCaptcha onChange={onCaptcha} />
                </>
              )}

              <button
                type="submit"
                disabled={saving}
                className="h-12 w-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-sm font-bold text-white disabled:opacity-60"
              >
                {saving ? "Joining…" : "Accept invitation"}
              </button>

              {!loggedIn ? (
                <p className="text-center text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link
                    href={`/login?next=${encodeURIComponent(
                      typeof window !== "undefined" ? window.location.pathname + window.location.search : "/join",
                    )}`}
                    className="font-bold text-violet-600"
                  >
                    Log in
                  </Link>
                </p>
              ) : null}
            </form>
          ) : null}
        </div>
      </div>
    </section>
  );
}
