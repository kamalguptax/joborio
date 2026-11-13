"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { createEmployerProgram, fetchEmployerBilling } from "@/lib/api/employer";
import { fetchNiches } from "@/lib/api/creator";
import { ApiClientError } from "@/lib/api/client";
import {
  LAUNCH_OPTIONS,
  launchOptionById,
  type LaunchOptionId,
} from "@/lib/campaigns/launchOptions";

const ENGAGE_OPTIONS = [
  { id: "like" as const, label: "Like" },
  { id: "comment" as const, label: "Comment" },
  { id: "repost" as const, label: "Repost / share" },
];

function isLaunchOptionId(value: string | null): value is LaunchOptionId {
  return LAUNCH_OPTIONS.some((o) => o.id === value);
}

function NewEmployerProgramForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"pick" | "form">("pick");
  const [launchId, setLaunchId] = useState<LaunchOptionId>("ppc");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("https://");
  const [postUrl, setPostUrl] = useState("https://");
  const [engageBrief, setEngageBrief] = useState("");
  const [actions, setActions] = useState<Array<"like" | "comment" | "repost">>([
    "like",
    "comment",
    "repost",
  ]);
  const [rate, setRate] = useState(LAUNCH_OPTIONS[0].defaultRate);
  const [budget, setBudget] = useState(LAUNCH_OPTIONS[0].defaultBudget);
  const [nicheId, setNicheId] = useState<number | null>(null);
  const [trialWithoutIp, setTrialWithoutIp] = useState(false);
  const [autoMeta, setAutoMeta] = useState(true);
  const [autoLinkedIn, setAutoLinkedIn] = useState(true);
  const [canGoLive, setCanGoLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const selected = launchOptionById(launchId);
  const isPostPromote = selected.id === "post_promote";

  useEffect(() => {
    fetchNiches()
      .then((n) => setNicheId(n[0]?.id ?? null))
      .catch(() => null);
    fetchEmployerBilling()
      .then((d) => setCanGoLive(Boolean(d.can_go_live)))
      .catch(() => setCanGoLive(false));
  }, []);

  const chooseOption = (id: LaunchOptionId) => {
    const option = launchOptionById(id);
    setLaunchId(id);
    if (!trialWithoutIp) {
      setRate(option.defaultRate);
      setBudget(option.defaultBudget);
    }
    setStep("form");
  };

  useEffect(() => {
    const launch = searchParams.get("launch");
    if (!isLaunchOptionId(launch)) return;
    const option = launchOptionById(launch);
    setLaunchId(launch);
    setRate(option.defaultRate);
    setBudget(option.defaultBudget);
    setStep("form");
  }, [searchParams]);

  const toggleAction = (id: "like" | "comment" | "repost") => {
    setActions((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMsg(null);
    if (isPostPromote && actions.length === 0) {
      setError("Select at least one engagement action.");
      return;
    }
    try {
      const platforms: Array<"meta" | "linkedin"> = [];
      if (!isPostPromote) {
        if (autoMeta) platforms.push("meta");
        if (autoLinkedIn) platforms.push("linkedin");
      }
      const destination = isPostPromote ? postUrl : url;
      const result = await createEmployerProgram({
        title,
        destination_url: destination,
        pricing_model: selected.pricing_model,
        promotion_type: selected.promotion_type,
        rate_usd: Number(rate),
        budget_total_usd: Number(budget),
        trial_without_ip: trialWithoutIp,
        target_niche_ids: nicheId ? [nicheId] : [],
        target_countries: ["IN"],
        auto_ads_platforms: platforms,
        ...(isPostPromote
          ? {
              post_url: postUrl,
              engagement_actions: actions,
              engage_brief: engageBrief.trim() || undefined,
            }
          : {}),
      });
      if (result.went_live) {
        router.push("/employer/programs");
        return;
      }
      setMsg(
        result.message ??
          "Campaign saved as pending. Complete company GST and payment to go live.",
      );
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not create program.",
      );
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Launch campaign</h1>
      <p className="mt-2 text-sm text-slate-500">
        Choose how you want to run the campaign, then add the offer details.
      </p>

      {!canGoLive && !trialWithoutIp ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Billing is incomplete for live campaigns.{" "}
          <Link href="/employer/billing" className="font-semibold underline">
            Add company, GST, and Razorpay funds
          </Link>
          .
        </p>
      ) : (
        <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          After launch, top up PPC budget anytime with Razorpay on the campaign
          page or{" "}
          <Link href="/employer/billing" className="font-semibold underline">
            Billing
          </Link>
          .
        </p>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Campaign options
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {LAUNCH_OPTIONS.map((option) => {
            const active = launchId === option.id && step === "form";
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => chooseOption(option.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  active
                    ? "border-purple-500 bg-purple-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-purple-300"
                }`}
              >
                <p className="font-bold text-[#172b63]">{option.label}</p>
                <p className="mt-1 text-sm text-slate-500">{option.description}</p>
                <p className="mt-2 text-xs font-semibold uppercase text-purple-600">
                  {option.pricing_model} · {option.promotion_type}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {step === "form" ? (
        <form
          onSubmit={submit}
          className="mt-8 max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-purple-700">
              Selected: {selected.label}
            </p>
            <button
              type="button"
              onClick={() => setStep("pick")}
              className="text-xs font-semibold text-slate-500 underline"
            >
              Change option
            </button>
          </div>

          <label className="block text-sm font-semibold">
            Title
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={selected.label}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
            />
          </label>

          {isPostPromote ? (
            <>
              <label className="block text-sm font-semibold">
                Post URL to promote
                <input
                  required
                  type="url"
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  placeholder="https://linkedin.com/posts/…"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>
              <fieldset>
                <legend className="text-sm font-semibold">
                  Required creator actions
                </legend>
                <div className="mt-2 flex flex-wrap gap-3">
                  {ENGAGE_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium"
                    >
                      <input
                        type="checkbox"
                        checked={actions.includes(opt.id)}
                        onChange={() => toggleAction(opt.id)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="block text-sm font-semibold">
                Brief for creators (optional)
                <textarea
                  value={engageBrief}
                  onChange={(e) => setEngageBrief(e.target.value)}
                  rows={3}
                  placeholder="Suggested comment tone, hashtags, or talking points…"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>
            </>
          ) : (
            <label className="block text-sm font-semibold">
              Destination URL
              <input
                required
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </label>
          )}

          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-semibold">
              {isPostPromote ? "PPE rate (USD)" : "Rate (USD)"}
              <input
                required
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                disabled={trialWithoutIp}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 disabled:bg-slate-50"
              />
            </label>
            <label className="block text-sm font-semibold">
              Budget (USD)
              <input
                required
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                disabled={trialWithoutIp}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 disabled:bg-slate-50"
              />
            </label>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input
              type="checkbox"
              checked={trialWithoutIp}
              onChange={(e) => {
                const on = e.target.checked;
                setTrialWithoutIp(on);
                if (on) {
                  setRate("0");
                  setBudget("0");
                } else {
                  setRate(selected.defaultRate);
                  setBudget(selected.defaultBudget);
                }
              }}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-800">
                Trial post (no IP tracking)
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                Test only. No IP stored and no paid earnings.
              </span>
            </span>
          </label>

          {!isPostPromote ? (
            <fieldset className="rounded-xl border border-indigo-100 bg-indigo-50/40 px-4 py-3">
              <legend className="px-1 text-sm font-semibold text-[#172b63]">
                Auto-setup ads on other platforms
              </legend>
              <p className="text-xs text-slate-500">
                When this campaign goes live, JobOrio creates matching Meta and LinkedIn
                campaigns (paused until you review spend in Ads Manager).
              </p>
              <div className="mt-3 space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={autoMeta}
                    onChange={(e) => setAutoMeta(e.target.checked)}
                  />
                  Meta (Facebook / Instagram) Ads
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={autoLinkedIn}
                    onChange={(e) => setAutoLinkedIn(e.target.checked)}
                  />
                  LinkedIn Ads
                </label>
              </div>
            </fieldset>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {msg ? (
            <p className="text-sm text-amber-800">
              {msg}{" "}
              <Link href="/employer/billing" className="font-semibold underline">
                Complete billing
              </Link>{" "}
              or{" "}
              <Link href="/employer/programs" className="font-semibold underline">
                view programs
              </Link>
              .
            </p>
          ) : null}
          <button
            type="submit"
            className="rounded-full bg-[#172b63] px-6 py-3 font-bold text-white"
          >
            {trialWithoutIp
              ? "Launch trial post"
              : canGoLive
                ? isPostPromote
                  ? "Launch post promote"
                  : "Launch campaign"
                : "Save campaign (pending live)"}
          </button>
        </form>
      ) : (
        <p className="mt-6 text-sm text-slate-500">
          Select one option above to continue to Launch campaign.
        </p>
      )}
    </>
  );
}

export default function NewEmployerProgramPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
      <NewEmployerProgramForm />
    </Suspense>
  );
}
