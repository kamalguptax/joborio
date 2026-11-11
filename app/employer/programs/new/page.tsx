"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createEmployerProgram, fetchEmployerBilling } from "@/lib/api/employer";
import { fetchNiches } from "@/lib/api/creator";
import { ApiClientError } from "@/lib/api/client";
import {
  LAUNCH_OPTIONS,
  launchOptionById,
  type LaunchOptionId,
} from "@/lib/campaigns/launchOptions";

export default function NewEmployerProgramPage() {
  const router = useRouter();
  const [step, setStep] = useState<"pick" | "form">("pick");
  const [launchId, setLaunchId] = useState<LaunchOptionId>("ppc");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("https://");
  const [rate, setRate] = useState(LAUNCH_OPTIONS[0].defaultRate);
  const [budget, setBudget] = useState(LAUNCH_OPTIONS[0].defaultBudget);
  const [nicheId, setNicheId] = useState<number | null>(null);
  const [trialWithoutIp, setTrialWithoutIp] = useState(false);
  const [canGoLive, setCanGoLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const selected = launchOptionById(launchId);

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMsg(null);
    try {
      const result = await createEmployerProgram({
        title,
        destination_url: url,
        pricing_model: selected.pricing_model,
        promotion_type: selected.promotion_type,
        rate_usd: Number(rate),
        budget_total_usd: Number(budget),
        trial_without_ip: trialWithoutIp,
        target_niche_ids: nicheId ? [nicheId] : [],
        target_countries: ["IN"],
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
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-semibold">
              Rate (USD)
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
                ? "Launch campaign"
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
