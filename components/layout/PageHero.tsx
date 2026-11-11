import Link from "next/link";
import SectionHeading from "./SectionHeading";

type Action = { label: string; href: string };

type Props = {
  eyebrow: string;
  title: string;
  highlight?: string;
  description: string;
  primary?: Action;
  secondary?: Action;
};

const Arrow = () => (
  <svg
    className="h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-1"
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

/**
 * Dark gradient hero used at the top of every inner page.
 * The site header is transparent (white text) until you scroll, so every page
 * must start with a dark section like this one.
 */
export default function PageHero({ eyebrow, title, highlight, description, primary, secondary }: Props) {
  return (
    <section className="relative overflow-x-clip rounded-b-[32px] bg-[linear-gradient(135deg,#0B1D4F_0%,#14296B_45%,#3F2AA8_100%)] pb-12 pt-[clamp(6.5rem,16vw,10.625rem)] text-white sm:rounded-b-[48px] sm:pb-24">
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-1/4 hidden h-[min(480px,60vw)] w-[min(480px,60vw)] rounded-full bg-violet-600/30 blur-3xl sm:block" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 bottom-0 hidden h-[min(320px,50vw)] w-[min(320px,50vw)] rounded-full bg-sky-500/20 blur-3xl sm:block" />

      <div className="relative mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-10">
        <div className="mb-3 inline-flex max-w-full items-center gap-3 rounded-full border border-white/20 bg-white/5 px-4 py-2.5 sm:px-5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />
          <span className="text-eyebrow text-slate-200">{eyebrow}</span>
        </div>

        <SectionHeading
          as="h1"
          variant="hero"
          tone="onDark"
          title={
            <>
              {title}
              {highlight ? (
                <span className="mt-1 block bg-gradient-to-r from-[#D8B4FE] via-[#A78BFA] to-[#D8B4FE] bg-clip-text text-transparent">
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
                className="btn-tap group inline-flex h-12 min-h-11 w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB] px-8 text-base font-semibold shadow-lg shadow-indigo-900/40 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-[52px] sm:w-auto sm:px-10"
              >
                {primary.label} <Arrow />
              </Link>
            )}
            {secondary && (
              <Link
                href={secondary.href}
                className="btn-tap group inline-flex h-12 min-h-11 w-full items-center justify-center gap-3 rounded-full bg-white px-8 text-base font-semibold text-slate-900 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-[52px] sm:w-auto sm:px-10"
              >
                {secondary.label} <Arrow />
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
