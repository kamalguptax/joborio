"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Copy, Upload, Users } from "lucide-react";
import { ApiClientError } from "@/lib/api/client";
import {
  absoluteSiteUrl,
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

export default function PublisherNetworkClient() {
  const search = useSearchParams();
  const [communities, setCommunities] = useState<PublisherCommunity[]>([]);
  const [invites, setInvites] = useState<PublisherInvitation[]>([]);
  const [members, setMembers] = useState<NetworkMemberRow[]>([]);
  const [canViewEarnings, setCanViewEarnings] = useState(false);
  const [communityId, setCommunityId] = useState<string>("");
  const [email, setEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const selectedCommunity = useMemo(
    () => communities.find((c) => String(c.id) === communityId) ?? null,
    [communities, communityId],
  );

  const loadCommunities = () =>
    fetchPublisherCommunities().then((c) => {
      setCommunities(c);
      return c;
    });

  const loadNetwork = (id: string) => {
    setLoading(true);
    const num = id ? Number(id) : null;
    Promise.all([
      id ? fetchPublisherInvitations(num) : Promise.resolve([] as PublisherInvitation[]),
      fetchPublisherMembers(num),
    ])
      .then(([i, memberRes]) => {
        setInvites(i);
        setMembers(memberRes.members);
        setCanViewEarnings(Boolean(memberRes.can_view_earnings));
      })
      .catch((err) =>
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load community network data.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const fromQuery = (search.get("community") ?? "").trim();
    loadCommunities()
      .then((c) => {
        if (fromQuery && c.some((row) => String(row.id) === fromQuery)) {
          setCommunityId(fromQuery);
          return;
        }
        // Default: show all communities' members; invite still needs a pick.
        setCommunityId("");
      })
      .catch((err) =>
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load communities.",
        ),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setInviteUrl(null);
    setCsvResult(null);
    setActivityById({});
    loadNetwork(communityId);
  }, [communityId]);

  async function onCreateInvite(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInviteUrl(null);
    if (!communityId) {
      setError("Select a community to invite members into.");
      return;
    }
    setSaving(true);
    try {
      const res = await createPublisherInvitation({
        community_id: Number(communityId),
        email: email.trim() || undefined,
        channel: email.trim() ? "email" : "link",
        expires_in_days: 14,
      });
      setInviteUrl(
        absoluteSiteUrl(res.invitation?.path, res.invite_url) || res.invite_url,
      );
      setEmail("");
      loadNetwork(communityId);
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
      loadNetwork(communityId);
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
      loadNetwork(communityId);
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
    if (!communityId) {
      setError("Select a community before uploading CSV invites.");
      return;
    }
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
        community_id: Number(communityId),
        expires_in_days: 14,
      });
      setCsvResult(result);
      setCsvFile(null);
      if (fileRef.current) fileRef.current.value = "";
      loadNetwork(communityId);
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
        <h1 className="mt-1 text-3xl font-bold">Community members & invites</h1>
        <p className="mt-2 text-slate-500">
          View all members and their earnings. Select a community to invite or
          filter the list.
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Community filter
          <select
            className={field}
            value={communityId}
            onChange={(e) => setCommunityId(e.target.value)}
          >
            <option value="">All communities</option>
            {communities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code}) · {c.members_count} members
              </option>
            ))}
          </select>
        </label>
        {communities.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No communities yet.{" "}
            <Link href="/publisher/communities" className="font-semibold text-violet-700">
              Create a community
            </Link>{" "}
            first, then invite members here.
          </p>
        ) : selectedCommunity ? (
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <Users size={16} className="text-violet-600" />
            Filtered to{" "}
            <span className="font-bold text-[#172b63]">{selectedCommunity.name}</span>
            <span className="text-xs text-slate-400">({selectedCommunity.code})</span>
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            Showing members across all communities. Pick a community to send
            invites.
          </p>
        )}
      </div>

      {communityId ? (
        <>
          <form
            onSubmit={onCreateInvite}
            className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold">
              Invite to {selectedCommunity?.name ?? "community"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Generate a link or email invite for this community only.
            </p>
            <div className="mt-4">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Email (optional — leave blank for a shareable link)
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
              {saving ? "Creating…" : "Generate community invite"}
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
                  All rows invite into{" "}
                  <span className="font-semibold text-[#172b63]">
                    {selectedCommunity?.name}
                  </span>
                  . Header: <code className="text-xs">email</code> (required).
                </p>
              </div>
              <a
                href={`data:text/csv;charset=utf-8,${encodeURIComponent(
                  "email\nmember@example.com\n",
                )}`}
                download="community-invites-template.csv"
                className="text-sm font-semibold text-violet-600 hover:underline"
              >
                Download template
              </a>
            </div>
            <div className="mt-4">
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
              {csvUploading ? "Importing…" : "Upload CSV for this community"}
            </button>

            {csvResult ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-4">
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
            ) : null}
          </form>

          <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">
              Invites · {selectedCommunity?.name}
            </h2>
            {loading ? (
              <p className="mt-4 text-sm text-slate-500">Loading…</p>
            ) : invites.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                No invitations for this community yet.
              </p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {invites.map((inv) => (
                  <li
                    key={inv.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <p className="font-semibold text-[#172b63]">
                      {inv.email ?? "Shareable link"} · {inv.status}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
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
        </>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">
              Members
              {selectedCommunity ? ` · ${selectedCommunity.name}` : " · all communities"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {canViewEarnings
                ? "Member settlement earnings (publisher reconciliation)."
                : "Member list for your assigned communities."}
            </p>
          </div>
          <p className="text-xs font-semibold text-slate-400">
            {members.length} member{members.length === 1 ? "" : "s"}
          </p>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Loading…</p>
        ) : members.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No members yet. Select a community and share an invite link.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-2 py-2 font-semibold">Member</th>
                  <th className="px-2 py-2 font-semibold">Community</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                  {canViewEarnings ? (
                    <>
                      <th className="px-2 py-2 font-semibold">Settled</th>
                      <th className="px-2 py-2 font-semibold">Pending</th>
                      <th className="px-2 py-2 font-semibold">Total</th>
                    </>
                  ) : null}
                  <th className="px-2 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100 align-top">
                    <td className="px-2 py-3">
                      <p className="font-semibold text-[#172b63]">
                        {m.display_name ?? "Member"}
                      </p>
                      <p className="text-xs text-slate-500">{m.email}</p>
                    </td>
                    <td className="px-2 py-3 text-xs text-slate-600">
                      {(m.communities ?? []).length > 0
                        ? (m.communities ?? [])
                            .map((c) => c.name)
                            .join(", ")
                        : "—"}
                    </td>
                    <td className="px-2 py-3">
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
                    </td>
                    {canViewEarnings ? (
                      <>
                        <td className="px-2 py-3 font-semibold tabular-nums">
                          {money(m.earnings?.settled_usd)}
                        </td>
                        <td className="px-2 py-3 font-semibold tabular-nums text-amber-700">
                          {money(m.earnings?.pending_usd)}
                        </td>
                        <td className="px-2 py-3 font-bold tabular-nums text-violet-700">
                          {money(m.earnings?.total_usd)}
                        </td>
                      </>
                    ) : null}
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          disabled={memberBusyId === m.id}
                          onClick={() => void onShowActivity(m.id)}
                          className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 disabled:opacity-60"
                        >
                          {activityById[m.id] ? "Hide" : "Activity"}
                        </button>
                        {m.status === "active" ? (
                          <button
                            type="button"
                            disabled={memberBusyId === m.id}
                            onClick={() => void onRemoveMember(m.id)}
                            className="rounded-full border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-700 disabled:opacity-60"
                          >
                            Remove
                          </button>
                        ) : null}
                        {m.status === "removed" || m.status === "active" ? (
                          <button
                            type="button"
                            disabled={memberBusyId === m.id}
                            onClick={() => void onReleaseMember(m.id)}
                            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 disabled:opacity-60"
                          >
                            Release
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
                          {activityById[m.id].conversions}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function money(n: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
}
