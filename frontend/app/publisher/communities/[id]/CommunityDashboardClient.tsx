"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ApiClientError } from "@/lib/api/client";
import {
  fetchPublisherCommunityDashboard,
  fetchPublisherMemberActivity,
  type PublisherCommunityDashboard,
  type NetworkMemberRow,
} from "@/lib/api/publisher";
import { useResolvedParam } from "@/lib/hooks/useResolvedParam";
import { STATIC_EXPORT_PLACEHOLDER } from "@/lib/staticExport";
import { ListSkeleton, PageSkeleton } from "@/components/ui/Skeleton";
import BackButton from "@/components/ui/BackButton";

function money(n: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
}

function when(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export default function CommunityDashboardClient() {
  const search = useSearchParams();
  const pathId = useResolvedParam("id", /\/publisher\/communities\/([^/]+)/);
  const idRaw =
    pathId && pathId !== STATIC_EXPORT_PLACEHOLDER
      ? pathId
      : (search.get("id") ?? "").trim();
  const communityId = Number(idRaw);
  const from = (search.get("from") || "reports").trim();
  const backHref =
    from === "communities"
      ? "/publisher/communities"
      : from === "earnings"
        ? "/publisher/earnings"
        : from === "dashboard"
          ? "/publisher/dashboard"
          : "/publisher/reports";
  const backLabel =
    from === "communities"
      ? "Back to communities"
      : from === "earnings"
        ? "Back to earning"
        : from === "dashboard"
          ? "Back to dashboard"
          : "Back to reports";

  const [data, setData] = useState<PublisherCommunityDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [memberDash, setMemberDash] = useState<Awaited<
    ReturnType<typeof fetchPublisherMemberActivity>
  > | null>(null);
  const [memberLoading, setMemberLoading] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(communityId) || communityId <= 0) {
      setError("Missing community id.");
      return;
    }
    let cancelled = false;
    fetchPublisherCommunityDashboard(communityId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiClientError
              ? err.message
              : "Could not load community dashboard.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [communityId]);

  async function openMember(member: NetworkMemberRow) {
    setSelectedMemberId(member.id);
    setMemberLoading(true);
    setMemberDash(null);
    try {
      setMemberDash(await fetchPublisherMemberActivity(member.id));
    } catch {
      setMemberDash(null);
    } finally {
      setMemberLoading(false);
    }
  }

  if (error) {
    return (
      <div className="space-y-3">
        <BackButton href={backHref} label={backLabel} />
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </p>
      </div>
    );
  }

  if (!data) return <PageSkeleton />;

  const { community, summary, members, assignments, recent_activity } = data;
  const canFinance = data.can_view_financials;

  const kpis: Array<[string, string | number]> = [
    ["Active members", summary.members_active],
    ["All members", summary.members_total],
    ["Clicks", summary.clicks],
    ["Signups", summary.signups],
    ["Applications", summary.applications],
    ["Conversions", summary.conversions],
    ["Pending invites", summary.pending_invites],
    ["XML jobs", summary.xml_jobs_count],
  ];
  if (canFinance) {
    kpis.push(
      ["Campaigns earned", money(summary.campaigns_earned_usd ?? summary.publisher_earnings_usd)],
      ["Campaigns pending", money(summary.campaigns_pending_usd)],
      ["Campaigns total", money(summary.campaigns_total_usd)],
      ["Member pending", money(summary.member_pending_usd)],
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <BackButton href={backHref} label={backLabel} />
          <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-violet-600">
            Community earnings
          </p>
          <h1 className="mt-1 text-3xl font-bold">{community.name}</h1>
          <p className="mt-2 text-slate-500">
            {community.code}
            {community.category ? ` · ${community.category}` : ""} ·{" "}
            <span className="font-semibold uppercase text-emerald-700">
              {community.status}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/publisher/earnings"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            All earning
          </Link>
          <Link
            href={`/publisher/network?community=${community.id}`}
            className="rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-bold text-white"
          >
            Invite members
          </Link>
        </div>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
          >
            <p className="text-2xl font-bold text-[#172b63]">{value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold">Members</h2>
              <p className="mt-1 text-sm text-slate-500">
                Everyone in this community. Click a member for their track.
              </p>
            </div>
            <p className="text-xs font-semibold text-slate-400">
              {members.length} shown
            </p>
          </div>

          {members.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No members yet.{" "}
              <Link
                href={`/publisher/network?community=${community.id}`}
                className="font-semibold text-violet-700"
              >
                Invite from Performance Team
              </Link>
            </p>
          ) : (
            <ul className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto">
              {members.map((m) => {
                const active = selectedMemberId === m.id;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => void openMember(m)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        active
                          ? "border-violet-300 bg-violet-50"
                          : "border-slate-100 bg-slate-50 hover:border-violet-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-[#172b63]">
                            {m.display_name || "Member"}
                          </p>
                          <p className="text-xs text-slate-500">{m.email}</p>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase ${
                            m.status === "active"
                              ? "text-emerald-700"
                              : "text-amber-700"
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-slate-600">
                        {m.activity?.clicks_total ?? 0} clicks ·{" "}
                        {m.activity?.signups ?? 0} PPR
                        {canFinance && m.earnings
                          ? ` · ${money(m.earnings.total_usd)}`
                          : ""}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Member detail</h2>
              {selectedMemberId ? (
                <BackButton
                  label="Back to members"
                  onClick={() => {
                    setSelectedMemberId(null);
                    setMemberDash(null);
                  }}
                />
              ) : null}
            </div>
            {!selectedMemberId ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                Select a member to open their community activity.
              </p>
            ) : memberLoading ? (
              <div className="mt-4">
                <ListSkeleton rows={4} />
              </div>
            ) : !memberDash ? (
              <p className="mt-4 text-sm text-slate-500">
                Could not load this member.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-[#172b63]">
                    {memberDash.member.display_name || "Member"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {memberDash.member.email} · {memberDash.member.status}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      Clicks
                    </p>
                    <p className="font-bold">
                      {memberDash.dashboard?.total_clicks ??
                        memberDash.activity?.clicks_total ??
                        0}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      PPR
                    </p>
                    <p className="font-bold">
                      {memberDash.dashboard?.ppr ??
                        memberDash.activity?.signups ??
                        0}
                    </p>
                  </div>
                  {canFinance && memberDash.earnings ? (
                    <>
                      <div className="rounded-xl bg-emerald-50 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase text-emerald-700">
                          Settled
                        </p>
                        <p className="font-bold text-emerald-900">
                          {money(memberDash.earnings.settled_usd)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-amber-50 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase text-amber-700">
                          Pending
                        </p>
                        <p className="font-bold text-amber-900">
                          {money(memberDash.earnings.pending_usd)}
                        </p>
                      </div>
                    </>
                  ) : null}
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Recent track
                  </p>
                  {(memberDash.recent ?? []).length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">No activity yet.</p>
                  ) : (
                    <ul className="mt-2 divide-y divide-slate-100 text-sm">
                      {(memberDash.recent ?? []).slice(0, 8).map((ev) => (
                        <li
                          key={ev.id}
                          className="flex justify-between gap-2 py-2"
                        >
                          <span className="font-semibold text-[#172b63]">
                            {ev.activity_type}
                            {ev.title ? ` · ${ev.title}` : ""}
                          </span>
                          <span className="shrink-0 text-xs text-slate-400">
                            {when(ev.occurred_at)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold">Campaigns</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Earnings for this community only.
                </p>
              </div>
              {canFinance ? (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                    Campaigns total
                  </p>
                  <p className="text-lg font-bold text-emerald-900">
                    {money(summary.campaigns_total_usd ?? 0)}
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    Earned {money(summary.campaigns_earned_usd ?? 0)}
                    {" · "}
                    Pending {money(summary.campaigns_pending_usd ?? 0)}
                  </p>
                </div>
              ) : null}
            </div>
            {assignments.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                No campaigns assigned.{" "}
                <Link
                  href="/publisher/earnings"
                  className="font-semibold text-violet-700"
                >
                  View campaign earning
                </Link>
                {" · "}
                <Link
                  href="/publisher/marketplace"
                  className="font-semibold text-violet-700"
                >
                  Marketplace
                </Link>
              </p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {assignments.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/publisher/earnings?assignment=${a.id}&from=reports`}
                      className="block rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 transition hover:border-violet-300 hover:bg-violet-50/60"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-[#172b63]">
                            {a.program_title ?? "Campaign"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {a.scope === "network"
                              ? "All communities"
                              : "This community"}
                            {a.pricing_model ? ` · ${a.pricing_model}` : ""}
                          </p>
                          {a.accepted_rate_usd != null &&
                          a.accepted_rate_usd !== "" ? (
                            <p className="mt-1 text-xs font-semibold text-slate-600">
                              Locked rate: $
                              {Number(a.accepted_rate_usd).toFixed(2)}
                            </p>
                          ) : null}
                          <p className="mt-1 text-[11px] font-semibold text-violet-700">
                            Open campaign earning →
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-xs font-bold uppercase text-violet-700">
                            {a.status}
                          </span>
                          {canFinance ? (
                            <>
                              <p className="mt-1 text-base font-bold text-emerald-700">
                                {money(a.total_usd ?? 0)}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                Earned {money(a.earned_usd ?? 0)}
                                {(a.pending_usd ?? 0) > 0
                                  ? ` · Pending ${money(a.pending_usd)}`
                                  : ""}
                              </p>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">Recent community activity</h2>
        {recent_activity.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No clicks or signups in this community yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 text-sm">
            {recent_activity.map((ev) => (
              <li
                key={ev.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <span className="font-semibold text-[#172b63]">
                  {ev.activity_type}
                  {ev.member_name ? ` · ${ev.member_name}` : ""}
                  {ev.title ? ` · ${ev.title}` : ""}
                </span>
                <span className="text-xs text-slate-400">{when(ev.occurred_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
