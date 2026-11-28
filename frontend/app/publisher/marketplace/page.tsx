"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Share2, X } from "lucide-react";
import { ApiClientError } from "@/lib/api/client";
import { fetchMe } from "@/lib/api/auth";
import {
  assignPublisherCampaign,
  fetchPublisherAssignments,
  fetchPublisherCommunities,
  fetchPublisherMarketplace,
  pausePublisherAssignment,
  type MarketplaceCampaign,
  type PublisherAssignment,
  type PublisherCommunity,
} from "@/lib/api/publisher";
import { rememberPublicCode } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { shareDestinationUrl } from "@/lib/tracking/subid";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";
import PageHeader from "@/components/layout/PageHeader";

function assignmentShareUrl(
  publicCode: string,
  assignment: PublisherAssignment,
): string {
  const code = publicCode.trim() || "PUBLISHER";
  const programId = Number(assignment.program?.id ?? 0);
  const dest = (assignment.destination_url || "").trim();
  const title = assignment.program?.title || undefined;
  if (dest.startsWith("https://")) {
    return shareDestinationUrl(code, dest, {
      title,
      referenceId: `assignment:${assignment.id}`,
    });
  }
  const params = new URLSearchParams({
    code,
    subid: code,
    ref: programId
      ? `campaign:${programId}`
      : `assignment:${assignment.id}`,
  });
  if (title) params.set("title", title);
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/go/?${params.toString()}`;
}

export default function PublisherMarketplacePage() {
  const [campaigns, setCampaigns] = useState<MarketplaceCampaign[]>([]);
  const [assignments, setAssignments] = useState<PublisherAssignment[]>([]);
  const [communities, setCommunities] = useState<PublisherCommunity[]>([]);
  const [publicCode, setPublicCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignFor, setAssignFor] = useState<MarketplaceCampaign | null>(null);
  const [pickedIds, setPickedIds] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);

  const liveCommunities = useMemo(
    () => communities.filter((c) => c.status === "active"),
    [communities],
  );

  const load = () => {
    setLoading(true);
    Promise.all([
      fetchPublisherMarketplace(),
      fetchPublisherAssignments(),
      fetchPublisherCommunities(),
      fetchMe()
        .then((u) => rememberPublicCode(u) || "")
        .catch(() => ""),
    ])
      .then(([c, a, com, code]) => {
        setCampaigns(c);
        setAssignments(a);
        setCommunities(com);
        if (code) setPublicCode(code);
      })
      .catch((err) =>
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load marketplace.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openAssign = (campaign: MarketplaceCampaign) => {
    const already = new Set(campaign.assigned_community_ids ?? []);
    setAssignFor(campaign);
    setPickedIds(
      liveCommunities
        .filter((c) => !already.has(c.id))
        .map((c) => c.id)
        .slice(0, 0),
    );
  };

  const closeAssign = () => {
    if (assigning) return;
    setAssignFor(null);
    setPickedIds([]);
  };

  const toggleCommunity = (id: number) => {
    setPickedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const confirmAssign = async () => {
    if (!assignFor) return;
    if (pickedIds.length === 0) {
      toast.error("Select at least one live community.");
      return;
    }
    setAssigning(true);
    setBusyId(assignFor.id);
    try {
      const res = await assignPublisherCampaign({
        program_id: assignFor.id,
        community_ids: pickedIds,
        notify_members: true,
      });
      const notified = Number(res.notified_members ?? 0);
      toast.success(
        `Assigned to ${pickedIds.length} community${
          pickedIds.length === 1 ? "" : "ies"
        }${
          notified
            ? ` · notified ${notified} member${notified === 1 ? "" : "s"}`
            : ""
        }.`,
      );
      setAssignFor(null);
      setPickedIds([]);
      load();
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Could not assign campaign.",
      );
    } finally {
      setAssigning(false);
      setBusyId(null);
    }
  };

  async function pause(id: number) {
    setBusyId(id);
    try {
      await pausePublisherAssignment(id);
      toast.success("Assignment paused.");
      load();
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Could not pause assignment.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function copyAssignmentLink(a: PublisherAssignment) {
    const link = assignmentShareUrl(publicCode, a);
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Share link copied");
    } catch {
      toast.error("Could not copy link.");
    }
  }

  async function shareAssignment(a: PublisherAssignment) {
    const link = assignmentShareUrl(publicCode, a);
    const title = a.program?.title ?? "Campaign";
    const text = `Check out ${title} on Upclift: ${link}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url: link });
      } else {
        await navigator.clipboard.writeText(link);
        toast.success("Share link copied");
      }
    } catch {
      /* cancelled */
    }
  }

  const alreadyOn = (c: MarketplaceCampaign, communityId: number) =>
    (c.assigned_community_ids ?? []).includes(communityId);

  return (
    <>
      <PageHeader title="Assign campaigns" />
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          Campaign Marketplace
        </p>
        <p className="mt-2 text-slate-500">
          When a new campaign goes live, click Assign, pick the communities, and
          network members in those communities get notified.
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">Live campaigns</h2>
        {loading ? (
          <CardGridSkeleton count={4} className="mt-4 sm:grid-cols-2" />
        ) : campaigns.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No active campaigns available.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {campaigns.map((c) => (
              <li
                key={c.id}
                className="flex h-full flex-col rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <p className="font-bold text-[#172b63]">{c.title}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {String(c.pricing_model).toUpperCase()}{" "}
                  {formatMoney(Number(c.rate_usd), "USD")}
                  {c.employer ? ` · ${c.employer}` : ""}
                  {c.assigned_community_count
                    ? ` · on ${c.assigned_community_count} community${
                        c.assigned_community_count === 1 ? "" : "ies"
                      }`
                    : ""}
                </p>
                <button
                  type="button"
                  disabled={busyId === c.id || liveCommunities.length === 0}
                  onClick={() => openAssign(c)}
                  className="mt-auto pt-4 text-left text-sm font-bold text-violet-700 disabled:opacity-60"
                >
                  {busyId === c.id
                    ? "Assigning…"
                    : liveCommunities.length === 0
                      ? "Create a live community first"
                      : c.already_assigned
                        ? "Assign to more communities"
                        : "Assign"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">Your assignments</h2>
            <p className="mt-1 text-sm text-slate-500">
              {assignments.length} assignment
              {assignments.length === 1 ? "" : "s"} · copy or share the tracked
              link
            </p>
          </div>
        </div>
        {loading ? (
          <CardGridSkeleton count={3} className="mt-4 sm:grid-cols-2 lg:grid-cols-3" />
        ) : assignments.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No assignments yet.</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assignments.map((a) => (
              <li
                key={a.id}
                className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 font-bold text-[#172b63]">
                    {a.program?.title ?? "Campaign"}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      a.status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {a.community?.name ?? "All members"}
                  {a.pricing_model || a.program?.pricing_model
                    ? ` · ${String(
                        a.pricing_model ?? a.program?.pricing_model,
                      ).toUpperCase()}`
                    : ""}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#172b63]">
                  Locked {formatMoney(Number(a.accepted_rate_usd ?? 0), "USD")}
                  {a.rate_version != null ? ` · v${a.rate_version}` : ""}
                </p>

                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => void copyAssignmentLink(a)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-bold text-white"
                  >
                    <Copy size={13} />
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => void shareAssignment(a)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-bold text-violet-700"
                  >
                    <Share2 size={13} />
                    Share
                  </button>
                  {a.status === "active" ? (
                    <button
                      type="button"
                      disabled={busyId === a.id}
                      onClick={() => void pause(a.id)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-60"
                    >
                      Pause
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {assignFor ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-campaign-title"
            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
                  Assign campaign
                </p>
                <h3
                  id="assign-campaign-title"
                  className="mt-1 text-lg font-bold text-[#172b63]"
                >
                  {assignFor.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Choose live communities. Members in those communities will be
                  notified.
                </p>
              </div>
              <button
                type="button"
                onClick={closeAssign}
                disabled={assigning}
                className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {liveCommunities.length === 0 ? (
              <p className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No live communities yet. Create one first, then assign.
              </p>
            ) : (
              <ul className="mt-5 max-h-72 space-y-2 overflow-y-auto">
                {liveCommunities.map((c) => {
                  const taken = alreadyOn(assignFor, c.id);
                  const checked = pickedIds.includes(c.id);
                  return (
                    <li key={c.id}>
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 ${
                          taken
                            ? "border-slate-100 bg-slate-50 opacity-70"
                            : checked
                              ? "border-violet-300 bg-violet-50"
                              : "border-slate-200 bg-white hover:border-violet-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                          checked={checked}
                          disabled={taken || assigning}
                          onChange={() => toggleCommunity(c.id)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-[#172b63]">
                            {c.name}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            {c.code} · {c.members_count} members
                            {taken ? " · already assigned" : ""}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                {pickedIds.length} selected
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeAssign}
                  disabled={assigning}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void confirmAssign()}
                  disabled={assigning || pickedIds.length === 0}
                  className="rounded-full bg-violet-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  {assigning ? "Assigning…" : "Assign & notify"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
