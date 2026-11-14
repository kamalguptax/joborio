"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { ApiClientError } from "@/lib/api/client";
import {
  communityJoinUrl,
  createPublisherCommunity,
  fetchPublisherCommunities,
  fetchPublisherTeam,
  invitePublisherManager,
  updatePublisherCommunity,
  type PublisherCommunity,
  type PublisherTeamMember,
} from "@/lib/api/publisher";

const field =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#172b63] outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10";

export default function PublisherCommunitiesPage() {
  const [rows, setRows] = useState<PublisherCommunity[]>([]);
  const [team, setTeam] = useState<PublisherTeamMember[]>([]);
  const [canInvite, setCanInvite] = useState(false);
  const [role, setRole] = useState<string>("owner");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [country, setCountry] = useState("IN");
  const [campaignAccess, setCampaignAccess] = useState("all_eligible");
  const [managerId, setManagerId] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isOwner = role === "owner";
  const managers = team.filter((t) => t.role === "manager" || t.role === "owner");

  const load = () => {
    setLoading(true);
    return Promise.all([fetchPublisherCommunities(), fetchPublisherTeam()])
      .then(([communities, teamRes]) => {
        setRows(communities);
        setTeam(teamRes.team);
        setCanInvite(teamRes.can_invite_managers);
        setRole(teamRes.membership_role);
        return communities;
      })
      .catch((err) => {
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load communities.",
        );
        return [] as PublisherCommunity[];
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, []);

  async function copyJoinLink(row: PublisherCommunity) {
    const url = communityJoinUrl(row);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(row.id);
      setTimeout(() => setCopiedId((id) => (id === row.id ? null : id)), 2000);
    } catch {
      setError("Could not copy join link.");
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    if (!name.trim()) {
      setError("Community name is required.");
      return;
    }
    setSaving(true);
    try {
      const created = await createPublisherCommunity({
        name: name.trim(),
        category: category.trim() || undefined,
        description: description.trim() || undefined,
        country_code: country,
        campaign_access: campaignAccess,
        status: "active",
        ...(managerId ? { manager_user_id: Number(managerId) } : {}),
      });
      setName("");
      setCategory("");
      setDescription("");
      setManagerId("");
      setHighlightId(created.id);
      setMsg(
        communityJoinUrl(created) || created.join_path
          ? `Community created. Share the join link below so members join “${created.name}”.`
          : "Community created.",
      );
      await load();
      requestAnimationFrame(() => {
        listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not create community.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(row: PublisherCommunity) {
    const next = row.status === "active" ? "paused" : "active";
    try {
      await updatePublisherCommunity(row.id, { status: next });
      load();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not update community.",
      );
    }
  }

  async function onAssignManager(row: PublisherCommunity, userId: string) {
    try {
      await updatePublisherCommunity(row.id, {
        manager_user_id: userId ? Number(userId) : null,
      });
      setMsg("Community manager updated.");
      load();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not assign manager.",
      );
    }
  }

  async function onInviteManager(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      const res = await invitePublisherManager({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
      });
      setInviteName("");
      setInviteEmail("");
      setMsg(res.message);
      load();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not invite manager.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          Communities
        </p>
        <h1 className="mt-1 text-3xl font-bold">Manage communities</h1>
        <p className="mt-2 text-slate-500">
          {isOwner
            ? "Create communities, assign managers, and set campaign access."
            : "You only see communities assigned to you as manager."}
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {msg ? (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {msg}
        </p>
      ) : null}

      {isOwner ? (
        <form
          onSubmit={onCreate}
          className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold">Create community</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Community name *
              <input
                className={field}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="IT & Career Creators"
                required
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Category
              <input
                className={field}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Education / Technology"
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Country
              <select
                className={field}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="IN">India</option>
                <option value="AE">UAE</option>
                <option value="US">USA</option>
              </select>
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Campaign access
              <select
                className={field}
                value={campaignAccess}
                onChange={(e) => setCampaignAccess(e.target.value)}
              >
                <option value="all_eligible">All eligible</option>
                <option value="selected">Selected campaigns</option>
              </select>
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Manager (optional)
              <select
                className={field}
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
              >
                <option value="">No manager</option>
                {managers.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.name} ({m.email}) · {m.role}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 sm:col-span-2">
              Description
              <textarea
                className={`${field} min-h-[88px]`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Creators promoting IT jobs and courses"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create community"}
          </button>
        </form>
      ) : null}

      {canInvite ? (
        <form
          onSubmit={onInviteManager}
          className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold">Invite manager</h2>
          <p className="mt-1 text-sm text-slate-500">
            Managers only access communities you assign to them. Financial and
            credential APIs stay owner-only.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Name
              <input
                className={field}
                required
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Email
              <input
                type="email"
                className={field}
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-full bg-[#172b63] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            Add manager
          </button>
        </form>
      ) : null}

      <div
        ref={listRef}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">
            {isOwner ? "Your communities" : "Assigned communities"}
          </h2>
          <p className="text-xs font-semibold text-slate-400">{rows.length} total</p>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Each community has a join link. Anyone who opens it and accepts is
          added as a member of that community.
        </p>
        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            {isOwner
              ? "No communities yet. Create your first one above."
              : "No communities assigned to you yet."}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {rows.map((row) => (
              <li
                key={row.id}
                className={`rounded-2xl border px-4 py-3 ${
                  highlightId === row.id
                    ? "border-violet-300 bg-violet-50/60 ring-2 ring-violet-200"
                    : "border-slate-100 bg-slate-50"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-[#172b63]">{row.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.code}
                      {row.category ? ` · ${row.category}` : ""}
                      {" · "}
                      {row.members_count} members
                      {" · "}
                      {row.campaign_access === "all_eligible"
                        ? "All eligible campaigns"
                        : "Selected campaigns"}
                      {row.manager
                        ? ` · Manager: ${row.manager.name}`
                        : " · No manager"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/publisher/network?community=${row.id}`}
                      className="rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-1.5 text-xs font-bold text-white"
                    >
                      Invite by email
                    </Link>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                        row.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {row.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => void toggleStatus(row)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      {row.status === "active" ? "Pause" : "Activate"}
                    </button>
                  </div>
                </div>

                {communityJoinUrl(row) || row.join_path ? (
                  <div className="mt-3 rounded-xl border border-emerald-100 bg-white px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                      Community join link
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <p className="min-w-0 flex-1 break-all text-xs font-medium text-[#172b63]">
                        {communityJoinUrl(row)}
                      </p>
                      <button
                        type="button"
                        onClick={() => void copyJoinLink(row)}
                        className="inline-flex items-center gap-1 rounded-full bg-[#172b63] px-3 py-1.5 text-xs font-bold text-white"
                      >
                        {copiedId === row.id ? (
                          <>
                            <Check size={14} /> Copied
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> Copy link
                          </>
                        )}
                      </button>
                      <a
                        href={communityJoinUrl(row)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        Open
                      </a>
                    </div>
                  </div>
                ) : null}

                {isOwner ? (
                  <label className="mt-3 block max-w-sm text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Assign manager
                    <select
                      className={field}
                      value={row.manager_user_id ? String(row.manager_user_id) : ""}
                      onChange={(e) => void onAssignManager(row, e.target.value)}
                    >
                      <option value="">No manager</option>
                      {managers.map((m) => (
                        <option key={m.user_id} value={m.user_id}>
                          {m.name} ({m.email})
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
