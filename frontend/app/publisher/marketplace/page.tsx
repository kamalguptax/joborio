"use client";

import { useEffect, useState } from "react";
import { ApiClientError } from "@/lib/api/client";
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
import { formatMoney } from "@/lib/money";

export default function PublisherMarketplacePage() {
  const [campaigns, setCampaigns] = useState<MarketplaceCampaign[]>([]);
  const [assignments, setAssignments] = useState<PublisherAssignment[]>([]);
  const [communities, setCommunities] = useState<PublisherCommunity[]>([]);
  const [communityId, setCommunityId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetchPublisherMarketplace(),
      fetchPublisherAssignments(),
      fetchPublisherCommunities(),
    ])
      .then(([c, a, com]) => {
        setCampaigns(c);
        setAssignments(a);
        setCommunities(com);
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

  async function assign(programId: number) {
    setError(null);
    setMsg(null);
    setBusyId(programId);
    try {
      await assignPublisherCampaign({
        program_id: programId,
        community_id: communityId ? Number(communityId) : null,
      });
      setMsg("Campaign assigned. Rate locked for this assignment.");
      load();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not assign campaign.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function pause(id: number) {
    setBusyId(id);
    try {
      await pausePublisherAssignment(id);
      load();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not pause assignment.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          Campaign Marketplace
        </p>
        <h1 className="mt-1 text-3xl font-bold">Assign campaigns</h1>
        <p className="mt-2 text-slate-500">
          Publisher commercial rates are visible here. Assigned rates are locked for
          that assignment version.
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

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Assign to community (optional)
          <select
            className="mt-1 w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-[#172b63]"
            value={communityId}
            onChange={(e) => setCommunityId(e.target.value)}
          >
            <option value="">All network members</option>
            {communities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">Live campaigns</h2>
        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Loading…</p>
        ) : campaigns.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No active campaigns available.</p>
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
                </p>
                <button
                  type="button"
                  disabled={busyId === c.id}
                  onClick={() => void assign(c.id)}
                  className="mt-auto pt-4 text-left text-sm font-bold text-violet-700 disabled:opacity-60"
                >
                  {busyId === c.id
                    ? "Assigning…"
                    : c.already_assigned
                      ? "Assign again / refresh"
                      : "Assign to network"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">Your assignments</h2>
        {assignments.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No assignments yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {assignments.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold">{a.program?.title}</p>
                  <p className="text-xs text-slate-500">
                    {a.community?.name ?? "All members"} · locked{" "}
                    {formatMoney(Number(a.accepted_rate_usd ?? 0), "USD")} · v
                    {a.rate_version}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-slate-500">
                    {a.status}
                  </span>
                  {a.status === "active" ? (
                    <button
                      type="button"
                      disabled={busyId === a.id}
                      onClick={() => void pause(a.id)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold"
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
    </>
  );
}