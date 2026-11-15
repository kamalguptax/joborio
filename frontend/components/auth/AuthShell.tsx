import Link from "next/link";
import type { ReactNode } from "react";
import Logo from "@/components/layout/Logo";
import AuthOrbit from "@/components/auth/AuthOrbit";

type Props = {
  children: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Small prompt in the top-right corner, e.g. "New here?" + link. */
  topPrompt?: string;
  topLinkLabel?: string;
  topLinkHref?: string;
  /** Wider form column for long registration forms. */
  wide?: boolean;
  /** Copy on the brand panel (right side, desktop only). */
  panelHeading?: ReactNode;
  panelBody?: ReactNode;
};

/**
 * Split-screen auth layout: brand panel on the left, form on the right (form stays first in the DOM for mobile).
 * Use for every login / signup / register / reset screen.
 */
export default function AuthShell({
  children,
  title,
  subtitle,
  topPrompt,
  topLinkLabel,
  topLinkHref,
  wide = false,
  panelHeading = "Your audience has value. Start earning today.",
  panelBody = "Share trusted opportunities and earn USD on verified clicks and registrations.",
}: Props) {
  return (
    <div className="grid min-h-svh bg-white text-slate-900 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
      <div className="flex min-w-0 flex-col lg:order-2">
        <header className="flex items-center justify-between gap-4 px-5 py-5 sm:px-10 sm:py-6">
          <Logo tone="dark" compact />
          {topLinkHref && topLinkLabel ? (
            <p className="text-right text-[13px] text-slate-500">
              {topPrompt ? <span className="mr-1.5">{topPrompt}</span> : null}
              <Link
                href={topLinkHref}
                className="font-semibold text-violet-600 underline decoration-violet-300 underline-offset-2 transition hover:text-blue-600"
              >
                {topLinkLabel}
              </Link>
            </p>
          ) : null}
        </header>

        <main className="flex flex-1 flex-col justify-center px-5 pb-12 pt-4 sm:px-10">
          <div className={`mx-auto w-full ${wide ? "max-w-[520px]" : "max-w-[420px]"}`}>
            <div className="text-center">
              <h1 className="text-[1.65rem] font-bold leading-tight tracking-tight text-[#0F1B3D] sm:text-[1.9rem]">
                {title}
              </h1>
              {subtitle ? (
                <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">{subtitle}</p>
              ) : null}
            </div>
            <div className="mt-7">{children}</div>
          </div>
        </main>
      </div>

      <aside
        aria-label="About JobOrio"
        className="relative hidden overflow-hidden lg:order-1 bg-[linear-gradient(135deg,#0B1D4F_0%,#14296B_45%,#3F2AA8_100%)] text-white lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:items-center lg:justify-center lg:gap-14 lg:px-12"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 top-1/4 h-[28rem] w-[28rem] rounded-full bg-violet-600/30 blur-3xl"
        />
        <AuthOrbit />
        <div className="relative max-w-md text-center">
          <h2 className="text-balance text-[2rem] font-bold leading-[1.15] tracking-tight xl:text-4xl">
            {panelHeading}
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-pretty text-[15px] leading-relaxed text-slate-300">
            {panelBody}
          </p>
        </div>
      </aside>
    </div>
  );
}
