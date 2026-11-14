import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import AuthLogo from "@/components/auth/AuthLogo";
import Link from "next/link";

export type OnboardingStep = {
  id: string | number;
  title: string;
  description: string;
  icon: LucideIcon;
};

type Props = {
  steps: OnboardingStep[];
  activeIndex: number;
  heading: string;
  lead: string;
  userEmail?: string | null;
  /** When set, "Save & exit" runs this (save, then go to the dashboard). */
  onSaveExit?: () => void;
  saveExitBusy?: boolean;
  children: ReactNode;
};

/**
 * Full-width onboarding layout: progress steps on the left, the current
 * step's form on the right. No outer box — everything sits on the page.
 */
export default function OnboardingShell({
  steps,
  activeIndex,
  heading,
  lead,
  userEmail,
  onSaveExit,
  saveExitBusy = false,
  children,
}: Props) {
  const progress = ((activeIndex + 1) / steps.length) * 100;

  return (
    <div className="flex min-h-svh flex-col bg-white">
      <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-slate-100 px-5 sm:px-8">
        <AuthLogo className="h-8 sm:h-9" />
        <div className="flex items-center gap-4 text-sm">
          {userEmail ? (
            <span className="hidden text-slate-500 sm:block">
              Signed in as <span className="font-medium text-slate-700">{userEmail}</span>
            </span>
          ) : null}
          {onSaveExit ? (
            <button
              type="button"
              onClick={onSaveExit}
              disabled={saveExitBusy}
              className="rounded-lg border border-slate-200 px-3.5 py-2 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 disabled:opacity-60"
            >
              {saveExitBusy ? "Saving…" : "Save & exit"}
            </button>
          ) : (
            <Link
              href="/"
              className="rounded-lg border border-slate-200 px-3.5 py-2 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600"
            >
              Save &amp; exit
            </Link>
          )}
        </div>
      </header>

      <div
        className="h-1 bg-slate-100 lg:hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label="Setup progress"
      >
        <div
          className="h-full bg-[linear-gradient(90deg,#3F2AA8,#7C3AED)] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid flex-1 gap-8 p-3 sm:p-4 lg:grid-cols-[minmax(340px,440px)_minmax(0,1fr)] lg:gap-12 lg:p-6">
        <aside className="relative hidden overflow-hidden rounded-[24px] bg-[linear-gradient(165deg,#EDF0FF_0%,#F3EEFF_55%,#FCEFF8_100%)] p-8 lg:block lg:sticky lg:top-6 lg:h-[calc(100svh-68px-3rem)] lg:min-h-[520px] xl:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-violet-300/30 blur-3xl"
          />
          <p className="relative text-[15px] font-medium text-slate-600">
            Set up your JobOrio account in a few quick steps.
          </p>

          <ol className="relative mt-9">
            {steps.map((step, i) => {
              const done = i < activeIndex;
              const active = i === activeIndex;
              const Icon = step.icon;
              return (
                <li
                  key={step.id}
                  aria-current={active ? "step" : undefined}
                  className="relative flex gap-4 pb-9 last:pb-0"
                >
                  {i < steps.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className={`absolute bottom-1 left-[21px] top-[52px] border-l-2 border-dashed ${
                        done ? "border-violet-400" : "border-slate-300/80"
                      }`}
                    />
                  ) : null}
                  <span
                    className={`z-10 flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full transition ${
                      active
                        ? "bg-[linear-gradient(135deg,#3F2AA8,#7C3AED)] text-white shadow-lg shadow-violet-500/35"
                        : done
                          ? "bg-violet-600 text-white"
                          : "bg-white text-slate-400 shadow-sm ring-1 ring-slate-200"
                    }`}
                  >
                    {done ? <Check size={19} strokeWidth={2.5} /> : <Icon size={19} />}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p
                      className={`text-[17px] font-semibold leading-6 ${
                        active || done ? "text-[#0F1B3D]" : "text-slate-500"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{step.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </aside>

        <main className="min-w-0 px-2 py-4 sm:px-6 lg:px-0 lg:py-10">
          <div className="mx-auto w-full max-w-[640px]">
            <p className="text-sm font-semibold text-violet-600">
              Step {activeIndex + 1} of {steps.length}
            </p>
            <h1 className="mt-3 text-[32px] font-bold leading-[1.15] tracking-[-0.035em] text-[#0F1B3D] sm:text-[36px]">
              {heading}
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-500">{lead}</p>

            <div className="mt-9">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
