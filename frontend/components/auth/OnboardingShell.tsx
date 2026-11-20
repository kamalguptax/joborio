import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { Check, Info } from "lucide-react";
import Logo from "@/components/layout/Logo";
import { authPrimaryButton } from "@/components/auth/authStyles";

export type OnboardingStep = {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string; size?: number }>;
};

type Props = {
  steps: OnboardingStep[];
  /** Zero-based index of the active step. */
  current: number;
  /** Intro line at the top of the left panel. */
  intro?: string;
  children: ReactNode;
  error?: string | null;
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  /** Right-side link in the top bar. */
  exitHref?: string;
  exitLabel?: string;
  /** Runs when the exit link is clicked (e.g. to mark onboarding as skipped). */
  onExit?: () => void;
};

/**
 * Two-column onboarding layout: step list on the left, current step on the right.
 * Steps are display-only; navigation stays in the page that owns the state.
 */
export default function OnboardingShell({
  steps,
  current,
  intro = "Get started by setting up your profile in a few quick steps.",
  children,
  error,
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  exitHref = "/",
  exitLabel = "Save & Exit",
  onExit,
}: Props) {
  const step = steps[current];
  return (
    <div className="flex min-h-svh flex-col bg-[#F8F8FB] text-slate-900">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200/70 bg-white px-5 py-3.5 sm:px-8">
        <Logo tone="dark" compact />
        <Link
          href={exitHref}
          onClick={onExit}
          className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          {exitLabel}
        </Link>
      </header>

      <div className="grid flex-1 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,30rem)_minmax(0,1fr)]">
        <aside
          aria-label="Setup progress"
          className="hidden border-r border-white/70 bg-[linear-gradient(165deg,#EAEEFF_0%,#F1ECFF_55%,#FBEAF6_100%)] p-8 lg:block xl:p-10"
        >
          <p className="flex items-start gap-2.5 text-[13px] text-[#26385D]">
            <Info size={16} className="mt-0.5 shrink-0 text-slate-500" aria-hidden="true" />
            {intro}
          </p>

          <ol className="mt-7">
            {steps.map((s, i) => {
              const done = i < current;
              const active = i === current;
              const Icon = s.icon;
              return (
                <li key={s.title} className="relative flex gap-4 pb-7 last:pb-0" aria-current={active ? "step" : undefined}>
                  {i < steps.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="absolute left-[19px] top-11 h-[calc(100%-2.75rem)] border-l border-dashed border-violet-300/70"
                    />
                  ) : null}
                  <span
                    className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm ring-1 ${
                      done
                        ? "bg-violet-600 text-white ring-violet-600"
                        : active
                          ? "bg-white text-violet-600 ring-violet-300"
                          : "bg-white text-slate-400 ring-slate-200"
                    }`}
                  >
                    {done ? <Check size={18} aria-hidden="true" /> : <Icon size={18} aria-hidden="true" />}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className={`text-[15px] font-bold ${active || done ? "text-[#0F1B3D]" : "text-slate-500"}`}>
                      {s.title}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{s.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </aside>

        <main className="flex min-w-0 flex-col px-5 py-7 sm:px-8 lg:px-14 lg:py-10 xl:px-20">
          <div className="w-full max-w-3xl">
            <p className="text-xs font-bold text-violet-600">
              Step {current + 1} of {steps.length}
            </p>
            <h1 className="mt-2 text-[1.75rem] font-bold leading-tight tracking-tight text-[#0F1B3D] sm:text-[2rem]">
              {step.title}
            </h1>
            <p className="mt-2.5 max-w-xl text-[15px] leading-relaxed text-slate-600">{step.description}</p>

            <div className="mt-7">{children}</div>
          </div>

          <div className="mt-auto w-full max-w-3xl pt-10">
            {error ? (
              <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onNext}
                disabled={nextDisabled}
                className={`${authPrimaryButton} !w-auto px-6`}
              >
                {nextLabel}
              </button>
              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="h-11 rounded-lg px-4 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900"
                >
                  Back
                </button>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
