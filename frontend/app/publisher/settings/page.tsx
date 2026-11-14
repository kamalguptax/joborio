"use client";

import { FormEvent, useEffect, useState } from "react";
import MultiSelect from "@/components/ui/MultiSelect";
import { ApiClientError } from "@/lib/api/client";
import { fetchNiches } from "@/lib/api/creator";
import type { Niche } from "@/lib/api/types";
import {
  fetchPublisherSettings,
  revokePublisherOtherSessions,
  updatePublisherPassword,
  updatePublisherProfile,
  type PublisherNotificationPrefs,
  type PublisherSettings,
} from "@/lib/api/publisher";

const field =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#172b63] outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10";

const JOB_OPTS = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "remote", label: "Remote" },
  { value: "internship", label: "Internship" },
];

const NETWORK_OPTS = ["agency", "publisher", "affiliate", "community"];
const COUNTRY_OPTS = [
  { value: "IN", label: "India" },
  { value: "AE", label: "UAE" },
  { value: "US", label: "USA" },
];

const NOTIF_LABELS: Array<[keyof PublisherNotificationPrefs, string]> = [
  ["email_invites", "Invite activity emails"],
  ["email_campaigns", "Campaign assignment emails"],
  ["email_settlements", "Settlement & payment emails"],
  ["email_security", "Security alerts"],
];

export default function PublisherSettingsPage() {
  const [data, setData] = useState<PublisherSettings | null>(null);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("IN");
  const [networkType, setNetworkType] = useState("publisher");
  const [socialUrl, setSocialUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [selectedNiches, setSelectedNiches] = useState<number[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [notifs, setNotifs] = useState<PublisherNotificationPrefs>({
    email_invites: true,
    email_campaigns: true,
    email_settlements: true,
    email_security: true,
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  useEffect(() => {
    Promise.all([fetchPublisherSettings(), fetchNiches()])
      .then(([settings, nicheList]) => {
        setData(settings);
        setNiches(nicheList);
        const p = settings.publisher;
        setFullName(p.display_name);
        setCountry(p.country_code);
        setNetworkType(p.network_type);
        setSocialUrl(p.social_url);
        setWebsiteUrl(p.website_url);
        setSelectedNiches(p.niche_ids ?? []);
        setSelectedJobs(p.job_preferences ?? []);
        setNotifs(p.notification_preferences);
      })
      .catch((err) =>
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load account settings.",
        ),
      );
  }, []);

  async function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await updatePublisherProfile({
        full_name: fullName.trim(),
        country_code: country,
        network_type: networkType,
        social_url: socialUrl.trim(),
        website_url: websiteUrl.trim(),
        niche_ids: selectedNiches,
        job_preferences: selectedJobs,
        notification_preferences: notifs,
      });
      setData((prev) =>
        prev
          ? { ...prev, publisher: res.publisher, user: res.user }
          : prev,
      );
      setMessage(res.message);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Could not save profile.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onPassword(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await updatePublisherPassword({
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirm,
      });
      setCurrentPassword("");
      setPassword("");
      setPasswordConfirm("");
      setMessage(res.message);
      const refreshed = await fetchPublisherSettings();
      setData(refreshed);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not update password.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onRevokeOthers() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await revokePublisherOtherSessions();
      setData((prev) => (prev ? { ...prev, sessions: res.sessions } : prev));
      setMessage(res.message);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not revoke sessions.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!data && !error) {
    return <p className="text-sm text-slate-500">Loading account settings…</p>;
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          Account Settings
        </p>
        <h1 className="mt-1 text-3xl font-bold">Publisher profile & security</h1>
        <p className="mt-2 text-slate-500">
          Username and application status stay fixed. Update profile details,
          notifications, and password here.
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      {data ? (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Username", `@${data.publisher.username}`],
              ["Publisher code", data.publisher.code],
              ["Status", data.publisher.status_label],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {label}
                </p>
                <p className="mt-1 font-semibold text-[#172b63]">{value}</p>
              </div>
            ))}
          </div>

          {data.membership.role !== "owner" ? (
            <p className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              You are signed in as a manager. Publisher profile and notification
              settings are owner-only. You can still change your own password
              below.
            </p>
          ) : null}

          <form
            onSubmit={onSaveProfile}
            className={`mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${
              data.membership.role !== "owner" ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <h2 className="text-lg font-bold">Profile</h2>
            <p className="mt-1 text-sm text-slate-500">
              Signed in as {data.user.email} · {data.membership.role}
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Full name
                <input
                  className={field}
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Email
                <input
                  className={`${field} bg-slate-50`}
                  value={data.user.email}
                  disabled
                  readOnly
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Country
                <select
                  className={field}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  {COUNTRY_OPTS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Network type
                <select
                  className={field}
                  value={networkType}
                  onChange={(e) => setNetworkType(e.target.value)}
                >
                  {NETWORK_OPTS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 sm:col-span-2">
                Social media URL
                <input
                  className={field}
                  type="url"
                  required
                  value={socialUrl}
                  onChange={(e) => setSocialUrl(e.target.value)}
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 sm:col-span-2">
                Website / community URL
                <input
                  className={field}
                  type="url"
                  required
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </label>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Audience niches
              </p>
              <div className="mt-1">
                <MultiSelect
                  options={niches.map((n) => ({
                    value: String(n.id),
                    label: n.name,
                  }))}
                  value={selectedNiches.map(String)}
                  onChange={(next) => setSelectedNiches(next.map(Number))}
                  disabled={niches.length === 0}
                  placeholder={
                    niches.length === 0 ? "Loading niches…" : "Search & select niches"
                  }
                  searchPlaceholder="Type to search niches…"
                  emptyLabel="No niches match your search"
                />
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Job preferences
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {JOB_OPTS.map((j) => {
                  const on = selectedJobs.includes(j.value);
                  return (
                    <button
                      key={j.value}
                      type="button"
                      onClick={() =>
                        setSelectedJobs((prev) =>
                          on
                            ? prev.filter((x) => x !== j.value)
                            : [...prev, j.value],
                        )
                      }
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                        on
                          ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white"
                          : "border border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {j.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <h3 className="font-bold text-[#172b63]">Notifications</h3>
              <ul className="mt-3 space-y-2">
                {NOTIF_LABELS.map(([key, label]) => (
                  <li key={key}>
                    <label className="flex cursor-pointer items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                        checked={notifs[key]}
                        onChange={(e) =>
                          setNotifs((prev) => ({
                            ...prev,
                            [key]: e.target.checked,
                          }))
                        }
                      />
                      {label}
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="submit"
              disabled={busy || selectedNiches.length === 0 || selectedJobs.length === 0}
              className="mt-6 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save profile"}
            </button>
          </form>

          <form
            onSubmit={onPassword}
            className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold">Change password</h2>
            <p className="mt-1 text-sm text-slate-500">
              Other sessions are signed out after a successful change.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Current password
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  className={field}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                New password
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  className={field}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Confirm new password
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  className={field}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="mt-4 rounded-full bg-[#172b63] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              Update password
            </button>
          </form>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Active sessions</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Sanctum API tokens for this account. Revoke others to force
                  re-login elsewhere.
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onRevokeOthers()}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
              >
                Sign out other sessions
              </button>
            </div>
            {data.sessions.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No sessions listed.</p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {data.sessions.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div>
                      <p className="font-semibold text-[#172b63]">
                        {s.name}
                        {s.is_current ? (
                          <span className="ml-2 text-xs font-bold uppercase text-emerald-700">
                            current
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-slate-500">
                        Created{" "}
                        {s.created_at
                          ? new Date(s.created_at).toLocaleString()
                          : "—"}
                        {s.last_used_at
                          ? ` · last used ${new Date(s.last_used_at).toLocaleString()}`
                          : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </>
  );
}
