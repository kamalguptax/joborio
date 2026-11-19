"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchEmployerBilling,
  fetchEmployerProgramStats,
  pauseEmployerProgram,
  resumeEmployerProgram,
  syncEmployerProgramAds,
  updateEmployerProgram,
  type RazorpayConfig,
} from "@/lib/api/employer";
import {
  defaultCampaignSchedule,
  pricingNeedsSchedule,
  toLocalDateTimeInput,
} from "@/lib/campaigns/launchOptions";
import { useResolvedParam } from "@/lib/hooks/useResolvedParam";
import CampaignScheduleFields from "@/components/campaigns/CampaignScheduleFields";
import RazorpayTopUp from "@/components/employer/RazorpayTopUp";
import { toast } from "@/components/ui/Toast";

type EditForm = {
  title: string;
  description: string;
  destination_url: string;
  rate_usd: string;
  budget_total_usd: string;
  post_url: string;
  engage_brief: string;
  engagement_like: boolean;
  engagement_comment: boolean;
  engagement_repost: boolean;
  starts_at: string;
  ends_at: string;
};

const scheduleDefaults = defaultCampaignSchedule();

const emptyEdit: EditForm = {
  title: "",
  description: "",
  destination_url: "https://",
  rate_usd: "0.05",
  budget_total_usd: "500",
  post_url: "",
  engage_brief: "",
  engagement_like: true,
  engagement_comment: true,
  engagement_repost: true,
  starts_at: scheduleDefaults.starts_at,
  ends_at: scheduleDefaults.ends_at,
};

export default function EmployerProgramDetailClient() {
  const idParam = useResolvedParam("id", /^\/employer\/programs\/([^/]+)/);
  const programId = Number(idParam);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [razorpay, setRazorpay] = useState<RazorpayConfig | null>(null);
  const [adsBusy, setAdsBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>(emptyEdit);
  const [saveBusy, setSaveBusy] = useState(false);

  const load = () => {
    fetchEmployerProgramStats(programId).then(setData).catch(() => setData(null));
  };

  useEffect(() => {
    if (!Number.isFinite(programId)) return;
    load();
  }, [programId]);

  useEffect(() => {
    fetchEmployerBilling()
      .then((d) => setRazorpay(d.razorpay ?? null))
      .catch(() => setRazorpay(null));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("edit") === "1") {
      setEditing(true);
    }
  }, []);

  const program = (data?.program ?? {}) as Record<string, unknown>;
  const listing = (program.listing ?? {}) as Record<string, unknown>;
  const match = (data?.match_preview ?? {}) as Record<string, unknown>;
  const status = String(program.status ?? "");
  const budgetTotal = Number(program.budget_total_usd ?? 0);
  const budgetSpent = Number(program.budget_spent_usd ?? 0);
  const adSyncs = (Array.isArray(data?.ad_syncs) ? data.ad_syncs : []) as Array<
    Record<string, unknown>
  >;
  const adsConfig = (data?.ads_config ?? {}) as Record<string, unknown>;
  const isPpe =
    program.pricing_model === "ppe" || program.promotion_type === "post_promote";
  const isTrial = Boolean(program.trial_without_ip);
  const needsSchedule = pricingNeedsSchedule(String(program.pricing_model ?? ""));

  useEffect(() => {
    if (!data?.program) return;
    const p = data.program as Record<string, unknown>;
    const l = (p.listing ?? {}) as Record<string, unknown>;
    const actions = Array.isArray(p.engagement_actions)
      ? (p.engagement_actions as string[])
      : [];
    const schedule = defaultCampaignSchedule();
    setEditForm({
      title: String(p.title ?? ""),
      description: String(p.description ?? ""),
      destination_url: String(l.destination_url ?? "https://"),
      rate_usd: String(p.rate_usd ?? "0.05"),
      budget_total_usd: String(p.budget_total_usd ?? "500"),
      post_url: String(p.post_url ?? ""),
      engage_brief: String(p.engage_brief ?? ""),
      engagement_like: actions.length ? actions.includes("like") : true,
      engagement_comment: actions.length ? actions.includes("comment") : true,
      engagement_repost: actions.length ? actions.includes("repost") : true,
      starts_at:
        toLocalDateTimeInput(String(p.starts_at ?? "")) || schedule.starts_at,
      ends_at: toLocalDateTimeInput(String(p.ends_at ?? "")) || schedule.ends_at,
    });
  }, [data]);

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveBusy(true);
    try {
      if (isPpe && !editForm.post_url.trim()) {
        toast.error("Post promote needs the social post URL.");
        setSaveBusy(false);
        return;
      }
      if (needsSchedule && (!editForm.starts_at || !editForm.ends_at)) {
        toast.error("PPC, PPR, and PPE need a start date and expiry date.");
        setSaveBusy(false);
        return;
      }
      const engagement_actions = (
        [
          editForm.engagement_like ? "like" : null,
          editForm.engagement_comment ? "comment" : null,
          editForm.engagement_repost ? "repost" : null,
        ] as Array<"like" | "comment" | "repost" | null>
      ).filter((v): v is "like" | "comment" | "repost" => Boolean(v));

      await updateEmployerProgram(programId, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        destination_url: editForm.destination_url.trim(),
        rate_usd: Number(editForm.rate_usd),
        budget_total_usd: Number(editForm.budget_total_usd),
        post_url: isPpe ? editForm.post_url.trim() : undefined,
        engage_brief: isPpe ? editForm.engage_brief.trim() || undefined : undefined,
        engagement_actions: isPpe
          ? engagement_actions.length
            ? engagement_actions
            : ["like", "comment", "repost"]
          : undefined,
        ...(needsSchedule
          ? { starts_at: editForm.starts_at, ends_at: editForm.ends_at }
          : {}),
      });
      toast.success("Campaign updated.");
      setEditing(false);
      const url = new URL(window.location.href);
      url.searchParams.delete("edit");
      window.history.replaceState({}, "", `${url.pathname}${url.search}`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update campaign.");
    } finally {
      setSaveBusy(false);
    }
  };

  return (
    <>
      <Link href="/employer/programs" className="text-sm font-semibold text-purple-600">
        ← Programs
      </Link>
      <h1 className="mt-4 text-2xl font-bold">{String(program.title ?? "Program")}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {String(program.pricing_model ?? "").toUpperCase()} · {status} · Budget $
        {budgetTotal.toFixed(0)} (spent ${budgetSpent.toFixed(2)})
        {program.starts_at
          ? ` · ${new Date(String(program.starts_at)).toLocaleDateString()} → ${
              program.ends_at
                ? new Date(String(program.ends_at)).toLocaleDateString()
                : "—"
            }`
          : ""}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold"
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? "Close edit" : "Edit campaign"}
        </button>
        {status === "active" ? (
          <button
            type="button"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold"
            onClick={() =>
              pauseEmployerProgram(programId)
                .then(() => {
                  toast.success("Program paused.");
                  load();
                })
                .catch(() => toast.error("Could not pause the program."))
            }
          >
            Pause program
          </button>
        ) : null}
        {status === "paused" ? (
          <button
            type="button"
            className="rounded-full bg-purple-600 px-4 py-2 text-sm font-bold text-white"
            onClick={() =>
              resumeEmployerProgram(programId)
                .then(() => {
                  toast.success("Program resumed.");
                  load();
                })
                .catch(() => toast.error("Could not resume the program."))
            }
          >
            Resume program
          </button>
        ) : null}
        {program.pricing_model === "ppa" ? (
          <Link
            href={`/employer/programs/${programId}/applications`}
            className="rounded-full border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-700"
          >
            PPA applications
          </Link>
        ) : null}
        {isPpe ? (
          <Link
            href={`/employer/programs/${programId}/post-promote`}
            className="rounded-full border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-700"
          >
            Post promote reviews
          </Link>
        ) : null}
      </div>

      {editing ? (
        <form
          onSubmit={saveEdit}
          className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2"
        >
          <h2 className="sm:col-span-2 text-lg font-bold text-[#172b63]">Edit campaign</h2>
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-500">Title</span>
            <input
              required
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-500">Destination URL</span>
            <input
              required
              type="url"
              value={editForm.destination_url}
              onChange={(e) =>
                setEditForm({ ...editForm, destination_url: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          {isPpe ? (
            <>
              <label className="block text-sm sm:col-span-2">
                <span className="text-slate-500">Social post URL</span>
                <input
                  required
                  type="url"
                  value={editForm.post_url}
                  onChange={(e) =>
                    setEditForm({ ...editForm, post_url: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <fieldset className="sm:col-span-2">
                <legend className="text-sm text-slate-500">Engagement actions</legend>
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  {(
                    [
                      ["engagement_like", "Like"],
                      ["engagement_comment", "Comment"],
                      ["engagement_repost", "Repost"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editForm[key]}
                        onChange={(e) =>
                          setEditForm({ ...editForm, [key]: e.target.checked })
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="block text-sm sm:col-span-2">
                <span className="text-slate-500">Creator brief</span>
                <textarea
                  value={editForm.engage_brief}
                  onChange={(e) =>
                    setEditForm({ ...editForm, engage_brief: e.target.value })
                  }
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            </>
          ) : null}
          <label className="block text-sm">
            <span className="text-slate-500">Rate (USD)</span>
            <input
              required
              value={editForm.rate_usd}
              disabled={isTrial}
              onChange={(e) => setEditForm({ ...editForm, rate_usd: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-500">Budget (USD)</span>
            <input
              required
              value={editForm.budget_total_usd}
              disabled={isTrial}
              onChange={(e) =>
                setEditForm({ ...editForm, budget_total_usd: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
            />
          </label>
          {needsSchedule ? (
            <div className="sm:col-span-2">
              <CampaignScheduleFields
                tone="employer"
                required
                startsAt={editForm.starts_at}
                endsAt={editForm.ends_at}
                onStartsAtChange={(starts_at) =>
                  setEditForm({ ...editForm, starts_at })
                }
                onEndsAtChange={(ends_at) =>
                  setEditForm({ ...editForm, ends_at })
                }
              />
            </div>
          ) : null}
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-500">Description</span>
            <textarea
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saveBusy}
              className="rounded-full bg-purple-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {saveBusy ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {program.post_url ? (
        <p className="mt-4 text-sm text-slate-600">
          Promoting post:{" "}
          <a
            href={String(program.post_url)}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-purple-700 underline"
          >
            {String(program.post_url)}
          </a>
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase text-slate-400">Matched creators</p>
          <p className="mt-2 text-2xl font-bold">{Number(match.matched_count ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase text-slate-400">Avg fit score</p>
          <p className="mt-2 text-2xl font-bold">{Number(match.avg_fit_score ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase text-slate-400">Creators opted in</p>
          <p className="mt-2 text-2xl font-bold">{Number(data?.creators_opted_in ?? 0)}</p>
        </div>
      </div>

      <div className="mt-8">
        <RazorpayTopUp
          razorpay={razorpay}
          purpose="program_budget"
          programId={programId}
          title="Add campaign budget"
          description="Pay with Razorpay to increase this campaign’s budget for PPC, PPR, or PPA spend."
          onSuccess={() => load()}
        />
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#172b63]">Platform ads sync</h2>
            <p className="mt-1 text-sm text-slate-500">
              Auto-create matching Meta & LinkedIn campaigns when this JobOrio campaign is live.
            </p>
          </div>
          {status === "active" ? (
            <button
              type="button"
              disabled={adsBusy}
              className="rounded-full bg-[#172b63] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              onClick={() => {
                setAdsBusy(true);
                syncEmployerProgramAds(programId)
                  .then((r) => {
                    toast.success(r.message ?? "Sync complete.");
                    load();
                  })
                  .catch(() => toast.error("Ads sync failed. Check API credentials."))
                  .finally(() => setAdsBusy(false));
              }}
            >
              {adsBusy ? "Syncing…" : "Sync Meta + LinkedIn now"}
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
            <p className="font-semibold text-slate-800">Meta Ads API</p>
            <p className="mt-1 text-slate-500">
              {adsConfig.meta_configured ? "Configured" : "Needs META_ADS_* env on API"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
            <p className="font-semibold text-slate-800">LinkedIn Ads API</p>
            <p className="mt-1 text-slate-500">
              {adsConfig.linkedin_configured
                ? "Configured"
                : "Needs LINKEDIN_ADS_* env on API"}
            </p>
          </div>
        </div>

        {adSyncs.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {adSyncs.map((row) => (
              <li
                key={String(row.platform)}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-4 py-3 text-sm"
              >
                <span className="font-semibold capitalize text-slate-800">
                  {String(row.platform)}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase text-slate-600">
                  {String(row.status)}
                </span>
                {row.external_campaign_id ? (
                  <span className="w-full font-mono text-xs text-slate-500">
                    ID: {String(row.external_campaign_id)}
                  </span>
                ) : null}
                {row.last_error ? (
                  <span className="w-full text-xs text-amber-800">{String(row.last_error)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            No platform sync yet. Enable Meta/LinkedIn on launch, or sync after go-live.
          </p>
        )}
      </section>

      <p className="mt-6 text-sm text-slate-500">
        Creators see this program in Campaigns when they match your niche and audience countries
        (Module H). Performance events flow through tracked links (Module D).
      </p>
    </>
  );
}
