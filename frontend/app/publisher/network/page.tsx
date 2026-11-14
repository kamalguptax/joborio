"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Check, Copy, Upload } from "lucide-react";
import { ApiClientError } from "@/lib/api/client";
import {
  createPublisherInvitation,
  fetchPublisherCommunities,
  fetchPublisherInvitations,
  fetchPublisherMembers,
  importPublisherInvitesCsv,
  fetchPublisherMemberActivity,
  releasePublisherMember,
  removePublisherMember,
  type CsvImportResult,
  type NetworkMemberRow,
  type PublisherCommunity,
  type PublisherInvitation,
} from "@/lib/api/publisher";

const field =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#172b63] outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10";

export default function PublisherNetworkPage() {
  const [communities, setCommunities] = useState<PublisherCommunity[]>([]);
  const [invites, setInvites] = useState<PublisherInvitation[]>([]);
  const [members, setMembers] = useState<NetworkMemberRow[]>([]);
  const [communityId, setCommunityId] = useState<string>("");
  const [email, setEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [csvCommunityId, setCsvCommunityId] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<CsvImportResult | null>(null);
  const [memberBusyId, setMemberBusyId] = useState<number | null>(null);
  const [activityById, setActivityById] = useState<
    Record<
      number,
      {
        clicks_total: number;
        clicks_valid: number;
        signups: number;
        applications: number;
        leads: number;
        conversions: number;
        actions_approved: number;
        actions_pending: number;
      }
    >
  >({});
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetchPublisherCommunities(),
      fetchPublisherInvitations(),
      fetchPublisherMembers(),
    ])
      .then(([c, i, m]) => {
        setCommunities(c);
        setInvites(i);
        setMembers(m);
      })
      .catch((err) =>
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load network data.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  async function onCreateInvite(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInviteUrl(null);
    setSaving(true);
    try {
      const res = await createPublisherInvitation({
        community_id: communityId ? Number(communityId) : null,
        email: email.trim() || undefined,
        channel: email.trim() ? "email" : "link",
        expires_in_days: 14,
      });
      setInviteUrl(res.invite_url);
      setEmail("");
      load();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not create invitation.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function onShowActivity(id: number) {
    if (activityById[id]) {
      setActivityById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    setMemberBusyId(id);
    setError(null);
    try {
      const res = await fetchPublisherMemberActivity(id);
      setActivityById((prev) => ({ ...prev, [id]: res.activity }));
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not load member activity.",
      );
    } finally {
      setMemberBusyId(null);
    }
  }

  async function onRemoveMember(id: number) {
    if (
      !window.confirm(
        "Remove this member? History is kept. Formal release is still required before Creator eligibility.",
      )
    ) {
      return;
    }
    setMemberBusyId(id);
    setError(null);
    try {
      await removePublisherMember(id);
      load();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Could not remove member.",
      );
    } finally {
      setMemberBusyId(null);
    }
  }

  async function onReleaseMember(id: number) {
    if (
      !window.confirm(
        "Formally release this membership? Pending settlements will be marked settled if needed.",
      )
    ) {
      return;
    }
    setMemberBusyId(id);
    setError(null);
    try {
      await releasePublisherMember(id, { settle_pending: true });
      load();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not release membership.",
      );
    } finally {
      setMemberBusyId(null);
    }
  }

  async function onCsvUpload(e: FormEvent) {
    e.preventDefault();
    if (!csvFile) {
      setError("Choose a CSV file first.");
      return;
    }
    setError(null);
    setCsvResult(null);
    setCsvUploading(true);
    try {
      const result = await importPublisherInvitesCsv({
        file: csvFile,
        community_id: csvCommunityId ? Number(csvCommunityId) : null,
        expires_in_days: 14,
      });
      setCsvResult(result);
      setCsvFile(null);
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "CSV import failed.",
      );
    } finally {
      setCsvUploading(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          My Network
        </p>
        <h1 className="mt-1 text-3xl font-bold">Invite members</h1>
        <p className="mt-2 text-slate-500">
          Create invite links for communities. Members join as private network accounts.
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={onCreateInvite}
        className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-bold">Create invitation</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Community (optional)
            <select
              className={field}
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
            >
              <option value="">All / publisher-level</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Email (optional)
            <input
              type="email"
              className={field}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Creating…" : "Generate invite link"}
        </button>

        {inviteUrl ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="min-w-0 flex-1 break-all text-sm font-medium text-emerald-900">
              {inviteUrl}
            </p>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(inviteUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="inline-flex items-center gap-1 rounded-full bg-[#172b63] px-3 py-1.5 text-xs font-bold text-white"
            >
              {copied ? (
                <>
                  <Check size={14} /> Copied
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy link
                </>
              )}
            </button>
          </div>
        ) : null}
      </form>

      <form
        onSubmit={onCsvUpload}
        className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">CSV bulk invites</h2>
            <p className="mt-1 text-sm text-slate-500">
              Headers: <code className="text-xs">email</code> (required),{" "}
              <code className="text-xs">community_code</code> (optional). Safe to
              retry — pending duplicates are skipped.
            </p>
          </div>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(
              "email,community_code\nmember@example.com,\n",
            )}`}
            download="publisher-invites-template.csv"
            className="text-sm font-semibold text-violet-600 hover:underline"
          >
            Download template
          </a>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Default community (optional)
            <select
              className={field}
              value={csvCommunityId}
              onChange={(e) => setCsvCommunityId(e.target.value)}
            >
              <option value="">Use community_code column / publisher-level</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            CSV file
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className={`${field} file:mr-3 file:rounded-full file:border-0 file:bg-violet-50 file:px-3 file:py-1 file:text-xs file:font-bold file:text-violet-700`}
              onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={csvUploading || !csvFile}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#172b63] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          <Upload size={16} />
          {csvUploading ? "Importing…" : "Upload CSV"}
        </button>

        {csvResult ? (
          <div className="mt-4 space-y-3">
            <div className="grid gap-2 sm:grid-cols-4">
              {[
                ["Created", csvResult.summary.created],
                ["Skipped", csvResult.summary.skipped_duplicates],
                ["Failed", csvResult.summary.failed],
                ["Rows", csvResult.summary.rows_processed],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-center"
                >
                  <p className="text-lg font-bold text-[#172b63]">{value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                </div>
              ))}
            </div>
            {csvResult.errors.length > 0 ? (
              <div className="max-h-40 overflow-auto rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-800">
                {csvResult.errors.slice(0, 30).map((err) => (
                  <p key={`${err.row}-${err.email ?? ""}`}>
                    Row {err.row}
                    {err.email ? ` (${err.email})` : ""}: {err.error}
                  </p>
                ))}
              </div>
            ) : null}
            {csvResult.sample_invites.length > 0 ? (
              <ul className="space-y-1 text-xs text-slate-600">
                {csvResult.sample_invites.slice(0, 5).map((s) => (
                  <li key={s.email} className="break-all">
                    <span className="font-semibold">{s.email}</span> — {s.invite_url}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Recent invites</h2>
          {loading ? (
            <p className="mt-4 text-sm text-slate-500">Loading…</p>
          ) : invites.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No invitations yet.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {invites.slice(0, 12).map((inv) => (
                <li
                  key={inv.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <p className="font-semibold text-[#172b63]">
                    {inv.community?.name ?? "Publisher-level"} · {inv.status}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {inv.email ? `${inv.email} · ` : ""}
                    {inv.channel} · expires{" "}
                    {inv.expires_at
                      ? new Date(inv.expires_at).toLocaleDateString()
                      : "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Network members</h2>
          {loading ? (
            <p className="mt-4 text-sm text-slate-500">Loading…</p>
          ) : members.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No members yet. Share an invite link to grow your network.
            </p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{m.display_name ?? "Member"}</p>
                      <p className="text-xs text-slate-500">{m.email}</p>
                    </div>
                    <span
                      className={`text-xs font-bold uppercase ${
                        m.status === "active"
                          ? "text-emerald-700"
                          : m.status === "released"
                            ? "text-slate-400"
                            : "text-amber-700"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={memberBusyId === m.id}
                      onClick={() => void onShowActivity(m.id)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 disabled:opacity-60"
                    >
                      {activityById[m.id] ? "Hide activity" : "Activity"}
                    </button>
                    {m.status === "active" ? (
                      <button
                        type="button"
                        disabled={memberBusyId === m.id}
                        onClick={() => void onRemoveMember(m.id)}
                        className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700 disabled:opacity-60"
                      >
                        Remove
                      </button>
                    ) : null}
                    {m.status === "removed" || m.status === "active" ? (
                      <button
                        type="button"
                        disabled={memberBusyId === m.id}
                        onClick={() => void onReleaseMember(m.id)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 disabled:opacity-60"
                      >
                        Formal release
                      </button>
                    ) : null}
                  </div>
                  {activityById[m.id] ? (
                    <p className="mt-2 text-xs text-slate-500">
                      clicks {activityById[m.id].clicks_total}/
                      {activityById[m.id].clicks_valid} · signups{" "}
                      {activityById[m.id].signups} · apps{" "}
                      {activityById[m.id].applications} · leads{" "}
                      {activityById[m.id].leads} · conv{" "}
                      {activityById[m.id].conversions} · approved{" "}
                      {activityById[m.id].actions_approved} · pending{" "}
                      {activityById[m.id].actions_pending}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
