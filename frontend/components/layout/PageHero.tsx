import Link from "next/link";
import SectionHeading from "./SectionHeading";
import AuthOrbit from "@/components/auth/AuthOrbit";

type Action = { label: string; href: string };

type Props = {
  eyebrow: string;
  title: string;
  highlight?: string;
  description: string;
  primary?: Action;
  secondary?: Action;
  points?: string[];
  compact?: boolean;
};

const Arrow = () => (
  <svg
    className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const Check = () => (
  <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-emerald-300" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="10" cy="10" r="8" className="opacity-40" />
    <path d="M6.5 10.2l2.4 2.4 4.6-5" />
  </svg>
);

/**
 * Banner at the top of every inner page.
 * The site header is solid on inner pages and already reserves its own height,
 * so the hero only needs normal top padding.
 */
export default function PageHero({
  eyebrow,
  title,
  highlight,
  description,
  primary,
  secondary,
  points,
  compact = false,
}: Props) {
  return (
    <section
      className={`relative isolate overflow-hidden border-white/10 text-white ${
        compact ? "pb-12 pt-10 sm:pb-16 sm:pt-14" : "pb-16 pt-42 sm:pb-24 sm:pt-16 lg:pt-40"
      } bg-[radial-gradient(60%_90%_at_88%_0%,rgba(139,92,246,0.5),transparent_62%),radial-gradient(45%_70%_at_0%_100%,rgba(56,189,248,0.2),transparent_60%),linear-gradient(135deg,#0B1D4F_0%,#14296B_48%,#2E2297_100%)]`}
    >
      {/* Soft dot grid that fades out toward the bottom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background-image:radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]"
      />

      <div className="relative mx-auto w-full max-w-[1600px] px-4 sm:px-8 lg:px-10">
        <div
          className={
            compact
              ? "max-w-3xl"
              : "grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
          }
        >
          <div className="min-w-0">
            <div className="inline-flex max-w-full items-center gap-2.5 rounded-full bg-white/[0.07] px-4 py-2 ring-1 ring-white/15 backdrop-blur">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.2)]" />
              <span className="text-eyebrow text-slate-200">{eyebrow}</span>
            </div>

            <SectionHeading
              as="h1"
              variant="hero"
              tone="onDark"
              className="mt-5"
              title={
                <>
                  {title}
                  {highlight ? (
                    <span className="mt-1 block bg-gradient-to-r from-[#E9D5FF] via-[#C4B5FD] to-[#93C5FD] bg-clip-text pb-1 text-transparent">
                      {highlight}
                    </span>
                  ) : null}
                </>
              }
              description={description}
              titleClassName="max-w-4xl"
              descriptionClassName="text-slate-300"
            />

            {(primary || secondary) && (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                {primary && (
                  <Link
                    href={primary.href}
                    className="btn-tap group inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB] px-8 text-[15px] font-semibold shadow-[0_14px_30px_-12px_rgba(99,102,241,0.8)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
                  >
                    {primary.label} <Arrow />
                  </Link>
                )}
                {secondary && (
                  <Link
                    href={secondary.href}
                    className="btn-tap group inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-white/[0.08] px-8 text-[15px] font-semibold text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
                  >
                    {secondary.label} <Arrow />
                  </Link>
                )}
              </div>
            )}

            {points && points.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
                {points.map((p) => (
                  <li key={p} className="inline-flex items-center gap-2">
                    <Check />
                    {p}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {!compact ? (
            <div className="hidden justify-center lg:flex" aria-hidden="true">
              <AuthOrbit />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
