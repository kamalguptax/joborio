"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Copy, KeyRound, RefreshCw, ShieldOff } from "lucide-react";
import { ApiClientError } from "@/lib/api/client";
import {
  createPublisherCredential,
  createPublisherMemberInvite,
  fetchPublisherIntegrations,
  revokePublisherCredential,
  rotatePublisherCredential,
  updatePublisherCredential,
  updatePublisherIntegrationPreference,
  type PublisherIntegrations,
} from "@/lib/api/publisher";

const field =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#172b63] outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10";

export default function PublisherIntegrationsPage() {
  const [data, setData] = useState<PublisherIntegrations | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [secrets, setSecrets] = useState<{
    api_key: string;
    webhook_secret: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [credName, setCredName] = useState("Default");
  const [outboundUrl, setOutboundUrl] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberInviteUrl, setMemberInviteUrl] = useState<string | null>(null);
  const [editUrlId, setEditUrlId] = useState<number | null>(null);
  const [editUrl, setEditUrl] = useState("");

  const load = () => {
    fetchPublisherIntegrations()
      .then(setData)
      .catch((err) =>
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load integrations.",
        ),
      );
  };

  useEffect(() => {
    load();
  }, []);

  async function copyText(label: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  async function onPreference(mode: string) {
    setBusy(true);
    setError(null);
    try {
      await updatePublisherIntegrationPreference(mode);
      load();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Could not update preference.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onCreateCredential(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSecrets(null);
    try {
      const res = await createPublisherCredential({
        name: credName.trim() || "Default",
        outbound_webhook_url: outboundUrl.trim() || null,
      });
      setSecrets(res.secrets);
      setOutboundUrl("");
      load();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Could not create credentials.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onRotate(id: number) {
    setBusy(true);
    setError(null);
    setSecrets(null);
    try {
      const res = await rotatePublisherCredential(id);
      setSecrets(res.secrets);
      load();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Could not rotate credentials.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onRevoke(id: number) {
    setBusy(true);
    setError(null);
    try {
      await revokePublisherCredential(id);
      load();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Could not revoke credentials.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onSaveUrl(id: number) {
    setBusy(true);
    setError(null);
    try {
      await updatePublisherCredential(id, {
        outbound_webhook_url: editUrl.trim() || null,
      });
      setEditUrlId(null);
      load();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Could not update webhook URL.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onApiMember(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMemberInviteUrl(null);
    try {
      const res = await createPublisherMemberInvite({ email: memberEmail.trim() });
      setMemberInviteUrl(res.invite_url);
      setMemberEmail("");
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Could not create member invite.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!data && !error) {
    return <p className="text-sm text-slate-500">Loading integrations…</p>;
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          API & Integration
        </p>
        <h1 className="mt-1 text-3xl font-bold">Credentials & webhooks</h1>
        <p className="mt-2 max-w-2xl text-slate-500">
          {data?.note ??
            "Manage dashboard, API, XML, and webhook credentials for your publisher account."}
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {secrets ? (
        <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4">
          <p className="font-bold text-amber-950">Copy secrets now</p>
          <p className="mt-1 text-sm text-amber-900">
            These values are shown once and are never returned again.
          </p>
          <div className="mt-3 space-y-2 text-sm">
            {[
              ["API key", secrets.api_key],
              ["Webhook secret", secrets.webhook_secret],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-white px-3 py-2"
              >
                <span className="w-28 text-xs font-semibold uppercase text-slate-400">
                  {label}
                </span>
                <code className="min-w-0 flex-1 break-all text-xs text-[#172b63]">
                  {value}
                </code>
                <button
                  type="button"
                  onClick={() => void copyText(label, value)}
                  className="inline-flex items-center gap-1 rounded-full bg-[#172b63] px-3 py-1 text-xs font-bold text-white"
                >
                  {copied === label ? <Check size={14} /> : <Copy size={14} />}
                  {copied === label ? "Copied" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {data ? (
        <>
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Integration mode</h2>
            <p className="mt-1 text-sm text-slate-500">
              Current:{" "}
              <span className="font-semibold capitalize text-[#172b63]">
                {data.integration_preference}
              </span>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.modes.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  disabled={busy || mode === data.integration_preference}
                  onClick={() => void onPreference(mode)}
                  className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${
                    mode === data.integration_preference
                      ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white"
                      : "border border-slate-200 bg-white text-slate-700 disabled:opacity-60"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Inbound webhook URL
                </p>
                <p className="mt-1 break-all font-medium text-[#172b63]">
                  {data.inbound_webhook_url}
                </p>
                <button
                  type="button"
                  className="mt-2 text-xs font-semibold text-violet-600 hover:underline"
                  onClick={() =>
                    void copyText("inbound", data.inbound_webhook_url)
                  }
                >
                  {copied === "inbound" ? "Copied" : "Copy URL"}
                </button>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  XML feed hint
                </p>
                <p className="mt-1 break-all font-medium text-[#172b63]">
                  {data.xml_feed_hint}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Partner XML contracts are not fabricated — use when a feed is
                  provisioned.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={onCreateCredential}
            className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <KeyRound size={18} /> Create API credentials
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Name
                <input
                  className={field}
                  value={credName}
                  onChange={(e) => setCredName(e.target.value)}
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Outbound webhook URL (optional)
                <input
                  className={field}
                  type="url"
                  placeholder="https://your-site.com/hooks/joborio"
                  value={outboundUrl}
                  onChange={(e) => setOutboundUrl(e.target.value)}
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="mt-4 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              Generate key + webhook secret
            </button>
          </form>

          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Credentials</h2>
            {data.credentials.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No credentials yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {data.credentials.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[#172b63]">
                          {c.name}{" "}
                          <span
                            className={`text-xs font-bold uppercase ${
                              c.is_active ? "text-emerald-700" : "text-slate-400"
                            }`}
                          >
                            {c.is_active ? "active" : "revoked"}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Key {c.key_prefix}… · Secret{" "}
                          {c.webhook_secret_prefix ?? "—"}…
                          {c.last_used_at
                            ? ` · last used ${new Date(c.last_used_at).toLocaleString()}`
                            : ""}
                        </p>
                        <p className="mt-1 break-all text-xs text-slate-500">
                          Outbound: {c.outbound_webhook_url || "not set"}
                        </p>
                      </div>
                      {c.is_active ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setEditUrlId(c.id);
                              setEditUrl(c.outbound_webhook_url ?? "");
                            }}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold"
                          >
                            Edit URL
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void onRotate(c.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold"
                          >
                            <RefreshCw size={12} /> Rotate
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void onRevoke(c.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                          >
                            <ShieldOff size={12} /> Revoke
                          </button>
                        </div>
                      ) : null}
                    </div>
                    {editUrlId === c.id ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <input
                          className={`${field} mt-0 max-w-md flex-1`}
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          placeholder="https://…"
                        />
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void onSaveUrl(c.id)}
                          className="rounded-full bg-[#172b63] px-3 py-2 text-xs font-bold text-white"
                        >
                          Save
                        </button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form
            onSubmit={onApiMember}
            className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold">API member creation</h2>
            <p className="mt-1 text-sm text-slate-500">
              Creates a pending invite via the API channel (safe retry — duplicates
              rejected).
            </p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Email
              <input
                type="email"
                required
                className={field}
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="mt-4 rounded-full bg-[#172b63] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              Create invite
            </button>
            {memberInviteUrl ? (
              <p className="mt-3 break-all text-sm text-emerald-800">
                {memberInviteUrl}
              </p>
            ) : null}
          </form>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Recent webhook events</h2>
            {data.webhook_events.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                No events yet. Send{" "}
                <code className="text-xs">X-Joborio-Webhook-Secret</code> with
                your payload to the inbound URL. Duplicate{" "}
                <code className="text-xs">event_id</code> values are ignored.
              </p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {data.webhook_events.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <p className="font-semibold text-[#172b63]">
                      {e.event_type} · {e.status} · {e.direction}
                    </p>
                    <p className="text-xs text-slate-500">
                      {e.external_event_id
                        ? `id ${e.external_event_id} · `
                        : ""}
                      {e.created_at
                        ? new Date(e.created_at).toLocaleString()
                        : ""}
                      {e.error_message ? ` · ${e.error_message}` : ""}
                    </p>
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
