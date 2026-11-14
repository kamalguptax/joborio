import Link from "next/link";
import PageHero from "./PageHero";
import SectionHeading from "./SectionHeading";

export type PageContent = {
  eyebrow: string;
  title: string;
  highlight?: string;
  description: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  sectionLabel: string;
  sectionTitle: string;
  sectionIntro: string;
  features: { title: string; text: string }[];
  ctaTitle: string;
  ctaText: string;
  ctaLabel: string;
  ctaHref: string;
};

const tints = [
  "bg-[#F0E8FE] text-violet-700",
  "bg-[#E3F1FE] text-sky-700",
  "bg-[#DDF6EC] text-emerald-700",
  "bg-[#FFE9DD] text-orange-700",
  "bg-[#FDE7F3] text-pink-700",
  "bg-[#EDEBFF] text-indigo-700",
];

/** One layout shared by all the simple marketing pages: hero, feature cards, call-to-action. */
export default function PageTemplate({ c }: { c: PageContent }) {
  return (
    <>
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title}
        highlight={c.highlight}
        description={c.description}
        primary={c.primary}
        secondary={c.secondary}
      />

      <section className="section-pad mx-auto w-full max-w-[1600px] px-4 sm:px-8 lg:px-10">
        <SectionHeading
          className="max-w-3xl min-w-0"
          eyebrow={c.sectionLabel}
          title={c.sectionTitle}
          description={c.sectionIntro}
        />

        <ul className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:gap-6 xl:grid-cols-4">
          {c.features.map((f, i) => (
            <li
              key={f.title}
              className="min-w-0 rounded-[24px] border border-indigo-100 bg-white p-5 shadow-[0_12px_40px_rgba(30,27,75,0.08)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(76,29,149,0.14)] sm:rounded-[28px] sm:p-8"
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-2xl text-base font-bold sm:h-12 sm:w-12 ${tints[i % tints.length]}`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-card-heading mt-5 sm:mt-6">{f.title}</h3>
              <p className="text-body mt-3 text-slate-500">{f.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto w-full max-w-[1600px] px-4 pb-16 sm:px-8 md:pb-24 lg:px-10">
        <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#0B1D4F_0%,#14296B_45%,#3F2AA8_100%)] px-5 py-10 text-white sm:rounded-[48px] sm:px-12 sm:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl"
          />
          <div className="relative flex flex-col gap-6 sm:gap-8 lg:flex-row lg:items-center lg:justify-between">
            <SectionHeading
              className="min-w-0 max-w-2xl"
              tone="onDark"
              title={c.ctaTitle}
              description={c.ctaText}
              descriptionClassName="text-slate-300"
            />
            <Link
              href={c.ctaHref}
              className="btn-tap group inline-flex h-12 min-h-11 w-full shrink-0 items-center justify-center gap-3 rounded-full bg-white px-8 text-base font-semibold text-slate-900 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-[52px] sm:w-auto sm:px-10"
            >
              {c.ctaLabel}
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
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
