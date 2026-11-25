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
  type MemberActivityRecent,
  type NetworkMemberRow,
  type PublisherCommunity,
  type PublisherInvitation,
  type PublisherMemberDashboard,
} from "@/lib/api/publisher";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";
import BackButton from "@/components/ui/BackButton";

const field =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#172b63] outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10";

function formatMemberDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMemberDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Membership table shows only Active / Deactive (not released/payment states). */
function memberDisplayStatus(status?: string | null): "Active" | "Deactive" {
  return String(status || "").toLowerCase() === "active" ? "Active" : "Deactive";
}

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
  const [recentById, setRecentById] = useState<
    Record<number, MemberActivityRecent[]>
  >({});
  const [dashboardById, setDashboardById] = useState<
    Record<number, PublisherMemberDashboard>
  >({});
  const [openDashboardId, setOpenDashboardId] = useState<number | null>(null);
  const [memberQuery, setMemberQuery] = useState("");
  /** Client-side filters (community still reloads from API via communityId). */
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "deactive">(
    "all",
  );
  const [earningsFilter, setEarningsFilter] = useState<
    "all" | "has_pending" | "has_settled" | "has_any" | "zero" | "has_activity" | "no_activity"
  >("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedCommunity = useMemo(
    () => communities.find((c) => String(c.id) === communityId) ?? null,
    [communities, communityId],
  );

  const filteredMembers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    return members.filter((m) => {
      const display = memberDisplayStatus(m.status);
      if (statusFilter === "active" && display !== "Active") return false;
      if (statusFilter === "deactive" && display !== "Deactive") return false;

      const settled = Number(m.earnings?.settled_usd ?? 0);
      const pending = Number(m.earnings?.pending_usd ?? 0);
      const total = Number(m.earnings?.total_usd ?? settled + pending);
      const hasActivity = Boolean(m.last_activity_at);

      switch (earningsFilter) {
        case "has_pending":
          if (!(pending > 0)) return false;
          break;
        case "has_settled":
          if (!(settled > 0)) return false;
          break;
        case "has_any":
          if (!(total > 0)) return false;
          break;
        case "zero":
          if (total > 0) return false;
          break;
        case "has_activity":
          if (!hasActivity) return false;
          break;
        case "no_activity":
          if (hasActivity) return false;
          break;
        default:
          break;
      }

      if (!q) return true;
      const hay = [
        m.display_name,
        m.email,
        display,
        ...(m.communities ?? []).map((c) => c.name),
        ...(m.communities ?? []).map((c) => c.code),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [members, memberQuery, statusFilter, earningsFilter]);

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
    setRecentById({});
    setDashboardById({});
    setOpenDashboardId(null);
    setMemberQuery("");
    setStatusFilter("all");
    setEarningsFilter("all");
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
      toast.success("Invitation created.");
      loadNetwork(communityId);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Could not create invitation.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function loadMemberDashboard(id: number) {
    setMemberBusyId(id);
    setError(null);
    try {
      const res = await fetchPublisherMemberActivity(id);
      setActivityById((prev) => ({ ...prev, [id]: res.activity }));
      setRecentById((prev) => ({ ...prev, [id]: res.recent ?? [] }));
      setDashboardById((prev) => ({ ...prev, [id]: res }));
      return res;
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not load member dashboard.",
      );
      return null;
    } finally {
      setMemberBusyId(null);
    }
  }

  async function onOpenMemberDashboard(id: number) {
    if (openDashboardId === id) {
      setOpenDashboardId(null);
      return;
    }
    if (!dashboardById[id]) {
      const res = await loadMemberDashboard(id);
      if (!res) return;
    }
    setOpenDashboardId(id);
  }

  async function onShowActivity(id: number) {
    if (activityById[id] && openDashboardId !== id) {
      setActivityById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setRecentById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    await loadMemberDashboard(id);
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
      toast.success("Member removed.");
      loadNetwork(communityId);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : "Could not remove member.",
      );
    } finally {
      setMemberBusyId(null);
    }
  }

  async function onReleaseMember(id: number) {
    if (
      !window.confirm(
        "Formally release this membership? Pending payments must already be released with evidence on Payout status.",
      )
    ) {
      return;
    }
    setMemberBusyId(id);
    setError(null);
    try {
      await releasePublisherMember(id);
      toast.success("Membership released.");
      loadNetwork(communityId);
    } catch (err) {
      toast.error(
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
      toast.success("CSV invites imported.");
      loadNetwork(communityId);
    } catch (err) {
      toast.error(
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
          Performance Team
        </p>
        <h1 className="mt-1 text-3xl font-bold">Invite creators to your community</h1>
        <p className="mt-2 text-slate-500">
          Share a join link, upload a CSV of creators, or use the API. Creators
          sign in as Network Members — campaign prices and publisher financials
          stay hidden from them.
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Filters
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Use the three dropdowns to narrow the member list.
            </p>
          </div>
          {(communityId ||
            statusFilter !== "all" ||
            earningsFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setCommunityId("");
                setStatusFilter("all");
                setEarningsFilter("all");
                setMemberQuery("");
              }}
              className="text-xs font-semibold text-violet-700 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            1 · Community
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

          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            2 · Status
            <select
              className={field}
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "active" | "deactive")
              }
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="deactive">Deactive</option>
            </select>
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            3 · {canViewEarnings ? "Earnings" : "Activity"}
            <select
              className={field}
              value={earningsFilter}
              onChange={(e) =>
                setEarningsFilter(
                  e.target.value as
                    | "all"
                    | "has_pending"
                    | "has_settled"
                    | "has_any"
                    | "zero"
                    | "has_activity"
                    | "no_activity",
                )
              }
            >
              {canViewEarnings ? (
                <>
                  <option value="all">All earnings</option>
                  <option value="has_any">Has any earnings</option>
                  <option value="has_pending">Has pending</option>
                  <option value="has_settled">Has settled</option>
                  <option value="zero">Zero earnings</option>
                </>
              ) : (
                <>
                  <option value="all">All activity</option>
                  <option value="has_activity">Has activity</option>
                  <option value="no_activity">No activity yet</option>
                </>
              )}
            </select>
          </label>
        </div>

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
              <ListSkeleton rows={3} className="mt-4" />
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
            {filteredMembers.length}
            {filteredMembers.length !== members.length
              ? ` of ${members.length}`
              : ""}{" "}
            member
            {filteredMembers.length === 1 ? "" : "s"}
          </p>
        </div>

        {loading ? (
          <ListSkeleton rows={3} className="mt-4" />
        ) : members.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No members yet. Select a community and share an invite link.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Click a member name to open their earning dashboard.
              </p>
              <label className="block min-w-[14rem] flex-1 sm:max-w-xs">
                <span className="sr-only">Search members</span>
                <input
                  type="search"
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                  placeholder="Search name, email, community…"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#172b63] outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                />
              </label>
            </div>
            {openDashboardId && dashboardById[openDashboardId] ? (
              <MemberEarningDashboard
                data={dashboardById[openDashboardId]}
                canViewEarnings={canViewEarnings}
                onClose={() => setOpenDashboardId(null)}
              />
            ) : null}
            {filteredMembers.length === 0 ? (
              <p className="mb-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                No members match the current filters
                {memberQuery.trim() ? ` or “${memberQuery.trim()}”` : ""}.
              </p>
            ) : null}
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-2 py-2 font-semibold">Member</th>
                  <th className="px-2 py-2 font-semibold">Community</th>
                  <th className="px-2 py-2 font-semibold">Registered</th>
                  <th className="px-2 py-2 font-semibold">Last activity</th>
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
                {filteredMembers.map((m) => (
                  <tr
                    key={m.id}
                    className={`border-b border-slate-100 align-top ${
                      openDashboardId === m.id ? "bg-violet-50/40" : ""
                    }`}
                  >
                    <td className="px-2 py-3">
                      <button
                        type="button"
                        disabled={memberBusyId === m.id}
                        onClick={() => void onOpenMemberDashboard(m.id)}
                        className="text-left disabled:opacity-60"
                      >
                        <p className="font-semibold text-violet-700 underline-offset-2 hover:underline">
                          {m.display_name ?? "Member"}
                        </p>
                        <p className="text-xs text-slate-500">{m.email}</p>
                        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-600">
                          {openDashboardId === m.id
                            ? "Dashboard open"
                            : "Open earning dashboard"}
                        </p>
                      </button>
                    </td>
                    <td className="px-2 py-3 text-xs text-slate-600">
                      {(m.communities ?? []).length > 0
                        ? (m.communities ?? [])
                            .map((c) => c.name)
                            .join(", ")
                        : "—"}
                    </td>
                    <td className="px-2 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {formatMemberDate(m.registered_at ?? m.joined_at)}
                    </td>
                    <td className="px-2 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {formatMemberDateTime(m.last_activity_at)}
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`text-xs font-bold uppercase ${
                          memberDisplayStatus(m.status) === "Active"
                            ? "text-emerald-700"
                            : "text-slate-400"
                        }`}
                      >
                        {memberDisplayStatus(m.status)}
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
                          onClick={() => void onOpenMemberDashboard(m.id)}
                          className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800 disabled:opacity-60"
                        >
                          {openDashboardId === m.id ? "Hide dashboard" : "Dashboard"}
                        </button>
                        <button
                          type="button"
                          disabled={memberBusyId === m.id}
                          onClick={() => void onShowActivity(m.id)}
                          className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 disabled:opacity-60"
                        >
                          {activityById[m.id] && openDashboardId !== m.id
                            ? "Hide"
                            : "Activity"}
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
                        <div className="mt-2 space-y-2">
                          <p className="text-xs text-slate-500">
                            clicks {activityById[m.id].clicks_total}/
                            {activityById[m.id].clicks_valid} · signups{" "}
                            {activityById[m.id].signups} · apps{" "}
                            {activityById[m.id].applications} · leads{" "}
                            {activityById[m.id].leads} · conv{" "}
                            {activityById[m.id].conversions}
                          </p>
                          {(recentById[m.id] ?? []).length > 0 ? (
                            <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-2 text-[11px] text-slate-600">
                              {(recentById[m.id] ?? []).slice(0, 12).map((ev) => (
                                <li key={ev.id} className="flex justify-between gap-2">
                                  <span className="truncate font-semibold">
                                    {ev.activity_type}
                                    {ev.title ? ` · ${ev.title}` : ""}
                                  </span>
                                  <span className="shrink-0 text-slate-400">
                                    {ev.occurred_at
                                      ? new Date(ev.occurred_at).toLocaleString()
                                      : ""}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[11px] text-slate-400">
                              No click trail yet. Member shares will appear here.
                            </p>
                          )}
                        </div>
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

function MemberEarningDashboard({
  data,
  canViewEarnings,
  onClose,
}: {
  data: PublisherMemberDashboard;
  canViewEarnings: boolean;
  onClose: () => void;
}) {
  const dash = data.dashboard;
  const earnings = data.earnings;
  const communities = data.by_community ?? [];
  const settlements = data.settlements ?? [];
  const recent = data.recent ?? [];

  return (
    <div className="mb-5 rounded-3xl border border-violet-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <BackButton label="Back to members" onClick={onClose} />
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-violet-600">
            Member earning dashboard
          </p>
          <h3 className="mt-1 text-xl font-bold text-[#172b63]">
            {data.member.display_name ?? "Member"}
          </h3>
          <p className="text-sm text-slate-500">
            {data.member.email} · {memberDisplayStatus(data.member.status)}
          </p>
          {data.note ? (
            <p className="mt-1 text-xs text-slate-400">{data.note}</p>
          ) : null}
        </div>
        {canViewEarnings && earnings ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              Total earning
            </p>
            <p className="text-2xl font-bold text-emerald-900">
              {money(earnings.total_usd)}
            </p>
            <p className="text-xs text-emerald-800">
              Settled {money(earnings.settled_usd)} · Pending{" "}
              {money(earnings.pending_usd)}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Clicks", dash?.total_clicks ?? data.activity.clicks_total],
          ["Valid clicks", dash?.valid_clicks ?? data.activity.clicks_valid],
          ["PPR / signups", dash?.ppr ?? data.activity.signups],
          ["Applications", dash?.applications ?? data.activity.applications],
          ["Leads", dash?.leads ?? data.activity.leads],
          ["Conversions", dash?.conversions ?? data.activity.conversions],
          ["Approved actions", dash?.actions_approved ?? data.activity.actions_approved],
          ["Pending actions", dash?.actions_pending ?? data.activity.actions_pending],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {label}
            </p>
            <p className="mt-0.5 text-lg font-bold text-[#172b63]">{value}</p>
          </div>
        ))}
      </div>

      {canViewEarnings ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <h4 className="text-sm font-bold text-[#172b63]">
              Earnings by community
            </h4>
            {communities.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">No communities linked.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {communities.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-start justify-between gap-2 rounded-xl border border-white bg-white px-3 py-2"
                  >
                    <div>
                      <p className="font-semibold text-[#172b63]">{c.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {c.code} · {c.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-700">
                        {money(c.total_usd)}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Settled {money(c.settled_usd)} · Pending{" "}
                        {money(c.pending_usd)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <h4 className="text-sm font-bold text-[#172b63]">Settlements</h4>
            {settlements.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">
                No settlement rows yet. Pending totals appear after campaigns
                credit this member.
              </p>
            ) : (
              <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto text-sm">
                {settlements.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-xl border border-white bg-white px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold capitalize text-[#172b63]">
                          {s.status}
                          {s.period_label ? ` · ${s.period_label}` : ""}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {s.community_name || "Community"}
                          {" · "}
                          {s.settled_at
                            ? `Settled ${formatMemberDateTime(s.settled_at)}`
                            : `Created ${formatMemberDateTime(s.created_at)}`}
                        </p>
                      </div>
                      <p className="font-bold text-violet-700">
                        {money(s.amount_usd)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/publisher/payments"
              className="mt-3 inline-block text-xs font-semibold text-violet-700 hover:underline"
            >
              Open payment release →
            </Link>
          </div>
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
        <h4 className="text-sm font-bold text-[#172b63]">Recent activity</h4>
        {recent.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">
            No click trail yet. Member shares will appear here.
          </p>
        ) : (
          <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-xs text-slate-600">
            {recent.slice(0, 20).map((ev) => (
              <li key={ev.id} className="flex justify-between gap-2 py-1">
                <span className="truncate font-semibold">
                  {ev.activity_type}
                  {ev.title ? ` · ${ev.title}` : ""}
                </span>
                <span className="shrink-0 text-slate-400">
                  {ev.occurred_at
                    ? new Date(ev.occurred_at).toLocaleString()
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
