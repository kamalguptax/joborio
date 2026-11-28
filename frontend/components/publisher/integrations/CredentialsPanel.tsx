"use client";

import { FormEvent, useState } from "react";
import { KeyRound, RefreshCw, ShieldOff } from "lucide-react";
import { ApiClientError } from "@/lib/api/client";
import {
  createPublisherCredential,
  revokePublisherCredential,
  rotatePublisherCredential,
  updatePublisherCredential,
  type PublisherCredential,
} from "@/lib/api/publisher";
import { toast } from "@/components/ui/Toast";

const field =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#172b63] outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10";

type Props = {
  credentials: PublisherCredential[];
  onChanged: () => void;
  onSecrets: (secrets: { api_key: string; webhook_secret: string }) => void;
  showOutbound?: boolean;
};

export default function CredentialsPanel({
  credentials,
  onChanged,
  onSecrets,
  showOutbound = true,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [credName, setCredName] = useState("Default");
  const [outboundUrl, setOutboundUrl] = useState("");
  const [editUrlId, setEditUrlId] = useState<number | null>(null);
  const [editUrl, setEditUrl] = useState("");

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await createPublisherCredential({
        name: credName.trim() || "Default",
        outbound_webhook_url: showOutbound
          ? outboundUrl.trim() || null
          : null,
      });
      onSecrets(res.secrets);
      setOutboundUrl("");
      toast.success(
        "Credentials created. Copy the secret now — it won’t be shown again.",
      );
      onChanged();
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Could not create credentials.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onRotate(id: number) {
    setBusy(true);
    try {
      const res = await rotatePublisherCredential(id);
      onSecrets(res.secrets);
      toast.success("Credentials rotated. Copy the new secret now.");
      onChanged();
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Could not rotate credentials.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onRevoke(id: number) {
    setBusy(true);
    try {
      await revokePublisherCredential(id);
      toast.success("Credential revoked.");
      onChanged();
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Could not revoke credentials.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onSaveUrl(id: number) {
    setBusy(true);
    try {
      await updatePublisherCredential(id, {
        outbound_webhook_url: editUrl.trim() || null,
      });
      setEditUrlId(null);
      toast.success("Outbound URL updated.");
      onChanged();
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Could not update URL.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form
        onSubmit={onCreate}
        className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <KeyRound size={18} /> Create API credentials
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Generates an API key and webhook secret. Copy them when shown — they
          are never returned again.
        </p>
        <div
          className={`mt-4 grid gap-4 ${showOutbound ? "sm:grid-cols-2" : ""}`}
        >
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Name
            <input
              className={field}
              value={credName}
              onChange={(e) => setCredName(e.target.value)}
            />
          </label>
          {showOutbound ? (
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Outbound webhook URL (optional)
              <input
                className={field}
                type="url"
                placeholder="https://your-site.com/hooks/upclift"
                value={outboundUrl}
                onChange={(e) => setOutboundUrl(e.target.value)}
              />
            </label>
          ) : null}
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
        {credentials.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No credentials yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {credentials.map((c) => (
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
                    {showOutbound ? (
                      <p className="mt-1 break-all text-xs text-slate-500">
                        Outbound: {c.outbound_webhook_url || "not set"}
                      </p>
                    ) : null}
                  </div>
                  {c.is_active ? (
                    <div className="flex flex-wrap gap-2">
                      {showOutbound ? (
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
                      ) : null}
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
                {showOutbound && editUrlId === c.id ? (
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
    </>
  );
}
