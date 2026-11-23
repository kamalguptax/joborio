"use client";

import Link from "next/link";
import { useId, useMemo, useState, type ReactNode } from "react";
import { ArrowRight, MousePointerClick, UserPlus, Handshake, Zap, Heart, type LucideIcon } from "lucide-react";
import { modelByCode, type BrandModel } from "@/components/brands/brandModels";

const GOALS: { id: string; label: string; hint: string; model: BrandModel["code"]; icon: LucideIcon }[] = [
  { id: "traffic", label: "Reach and traffic", hint: "Get people to your page", model: "PPC", icon: MousePointerClick },
  { id: "signups", label: "Sign-ups and enrolments", hint: "Courses, events, accounts", model: "PPR", icon: UserPlus },
  { id: "leads", label: "Qualified leads", hint: "Demos, enquiries, quotes", model: "PPL", icon: Handshake },
  { id: "actions", label: "Applications or actions", hint: "Jobs, installs, purchases", model: "PPA", icon: Zap },
  { id: "engagement", label: "Post engagement", hint: "Likes, comments, reposts", model: "PPE", icon: Heart },
];

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-violet-600">{label}</dt>
      <dd className="text-[15px] leading-relaxed text-slate-700">{children}</dd>
    </div>
  );
}

/** Interactive helper: pick a goal, see the matching pricing model and a rough result estimate. */
export default function BrandsPlanner() {
  const [goalId, setGoalId] = useState(GOALS[1].id);
  const [budget, setBudget] = useState("500");
  const [rate, setRate] = useState("2");
  const baseId = useId();

  const goal = GOALS.find((g) => g.id === goalId) ?? GOALS[0];
  const model = modelByCode(goal.model);
  const ModelIcon = model.icon;

  const estimate = useMemo(() => {
    const b = Number(budget);
    const r = Number(rate);
    if (!Number.isFinite(b) || !Number.isFinite(r) || b <= 0 || r <= 0) return null;
    return Math.floor(b / r);
  }, [budget, rate]);

  const budgetInvalid = budget !== "" && !(Number(budget) > 0);
  const rateInvalid = rate !== "" && !(Number(rate) > 0);

  return (
    <section id="campaign-planner" className="relative scroll-mt-24 bg-gradient-to-b from-white via-violet-50/60 to-white py-14 md:py-20">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-semibold text-violet-700">
            Campaign planner
          </span>
          <h2 className="mt-4 text-[clamp(1.6rem,1.1rem+1.8vw,2.4rem)] font-bold tracking-tight text-[#0F1B3D]">
            Find the model that fits your goal
          </h2>
          <p className="mt-3 text-base text-slate-600 sm:text-lg">
            Tell us what you want to achieve. We will show how you would pay, how results are verified and what a
            budget could deliver.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
          {/* Goal picker */}
          <div role="radiogroup" aria-label="Campaign goal" className="grid gap-3">
            {GOALS.map((g) => {
              const active = g.id === goalId;
              const Icon = g.icon;
              return (
                <button
                  key={g.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setGoalId(g.id)}
                  className={`flex items-center gap-4 rounded-2xl border px-4 py-4 text-left transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 ${
                    active
                      ? "border-violet-300 bg-gradient-to-r from-violet-50 to-indigo-50 shadow-[0_16px_34px_-24px_rgba(91,53,213,0.6)]"
                      : "border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/40"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                      active ? "bg-gradient-to-br from-[#7C3AED] to-[#2563EB] text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold text-[#0F1B3D]">{g.label}</span>
                    <span className="block text-sm text-slate-500">{g.hint}</span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                      active ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {g.model}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Recommendation + estimate */}
          <div className="min-w-0 space-y-5" aria-live="polite">
            <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-[0_24px_50px_-34px_rgba(46,34,151,0.45)] sm:p-8">
              <div className="flex items-center gap-4">
                <span className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${model.tile} ${model.iconTone}`}>
                  <ModelIcon size={28} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recommended model</p>
                  <h3 className="text-xl font-bold text-[#0F1B3D]">
                    {model.code} <span className="font-semibold text-slate-500">· {model.label}</span>
                  </h3>
                </div>
              </div>

              <dl className="mt-6 space-y-4">
                <Row label="Best for">{model.bestFor}</Row>
                <Row label="You pay">{model.youPay}</Row>
                <Row label="Verified by">{model.verified}</Row>
                <Row label="Example">{model.example}</Row>
              </dl>
            </div>

            <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 p-6 sm:p-8">
              <h3 className="text-lg font-bold text-[#0F1B3D]">What could your budget deliver?</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={`${baseId}-budget`} className="text-sm font-semibold text-slate-700">
                    Campaign budget (USD)
                  </label>
                  <input
                    id={`${baseId}-budget`}
                    inputMode="decimal"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value.replace(/[^0-9.]/g, ""))}
                    aria-invalid={budgetInvalid}
                    className={`mt-1.5 w-full rounded-xl border bg-white px-4 py-3 text-base text-[#0F1B3D] outline-none transition focus:ring-2 ${
                      budgetInvalid
                        ? "border-red-400 focus:ring-red-200"
                        : "border-slate-200 focus:border-violet-400 focus:ring-violet-200"
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor={`${baseId}-rate`} className="text-sm font-semibold text-slate-700">
                    Reward per {model.code === "PPC" ? "click" : "result"} (USD)
                  </label>
                  <input
                    id={`${baseId}-rate`}
                    inputMode="decimal"
                    value={rate}
                    onChange={(e) => setRate(e.target.value.replace(/[^0-9.]/g, ""))}
                    aria-invalid={rateInvalid}
                    className={`mt-1.5 w-full rounded-xl border bg-white px-4 py-3 text-base text-[#0F1B3D] outline-none transition focus:ring-2 ${
                      rateInvalid
                        ? "border-red-400 focus:ring-red-200"
                        : "border-slate-200 focus:border-violet-400 focus:ring-violet-200"
                    }`}
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white px-5 py-4 ring-1 ring-violet-100">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Estimated results</p>
                  <p className="text-3xl font-bold tracking-tight text-[#0F1B3D]">
                    {estimate === null ? "—" : `≈ ${whole.format(estimate)}`}
                    <span className="ml-2 text-base font-semibold text-slate-500">
                      {model.short.toLowerCase()}
                      {estimate === 1 ? "" : "s"}
                    </span>
                  </p>
                </div>
                {estimate !== null ? (
                  <p className="text-sm text-slate-500">
                    {money.format(Number(budget))} ÷ {money.format(Number(rate))}
                  </p>
                ) : (
                  <p className="text-sm text-red-600">Enter a budget and a reward above zero.</p>
                )}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                A simple estimate (budget ÷ reward) to help you plan. You set the reward and budget for each campaign,
                and your real results depend on your offer, audience and creators.
              </p>

              <Link
                href="/brand/register"
                className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#4C2BD6] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#3F22B8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4C2BD6]"
              >
                Start a {model.code} campaign
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
