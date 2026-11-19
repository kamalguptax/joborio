import SectionHeading from "./SectionHeading";

export type InfoItem = { title: string; text: string };

const wrap = "mx-auto w-full max-w-[1600px] px-4 sm:px-8 lg:px-10";

/** Row of headline numbers / facts, shown just under the hero. */
export function StatsStrip({ items }: { items: { value: string; label: string }[] }) {
  return (
    <section className={`${wrap} relative z-10 pt-10 sm:pt-14`}>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 shadow-[0_24px_50px_-34px_rgba(15,27,61,0.35)] lg:grid-cols-4">
        {items.map((s) => (
          <div key={s.label} className="flex flex-col-reverse gap-1.5 bg-white px-5 py-6 text-center sm:px-6 sm:py-8">
            <dt className="text-sm leading-snug text-slate-500">{s.label}</dt>
            <dd className="bg-gradient-to-r from-[#7C3AED] to-[#2563EB] bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Numbered vertical timeline with a sticky heading on large screens. */
export function StepsSection({
  eyebrow,
  title,
  intro,
  steps,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  steps: InfoItem[];
}) {
  return (
    <section className="bg-slate-50/80 py-16 md:py-24">
      <div className={`${wrap} grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16`}>
        <SectionHeading
          className="min-w-0 lg:sticky lg:top-28 lg:self-start"
          eyebrow={eyebrow}
          title={title}
          description={intro}
        />
        <ol className="relative min-w-0 space-y-5">
          <span
            aria-hidden="true"
            className="absolute bottom-6 left-[1.4rem] top-6 w-px bg-gradient-to-b from-violet-300 via-violet-200 to-transparent"
          />
          {steps.map((s, i) => (
            <li key={s.title} className="relative flex gap-4 sm:gap-5">
              <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#2563EB] text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(91,53,213,0.8)] ring-4 ring-slate-50">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <h3 className="text-card-heading">{s.title}</h3>
                <p className="text-body mt-2 text-slate-500">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const CheckIcon = () => (
  <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="10" cy="10" r="8.5" className="fill-violet-50 stroke-violet-200" />
    <path d="M6.5 10.3l2.4 2.4 4.6-5.1" className="stroke-violet-700" />
  </svg>
);

/** Two-column "why" section: heading on the left, check-marked reasons on the right. */
export function BenefitsSection({
  eyebrow,
  title,
  intro,
  items,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  items: InfoItem[];
}) {
  return (
    <section className={`${wrap} py-16 md:py-24`}>
      <SectionHeading className="max-w-3xl min-w-0" eyebrow={eyebrow} title={title} description={intro} />
      <ul className="mt-10 grid gap-4 sm:mt-12 md:grid-cols-2 lg:gap-5">
        {items.map((b) => (
          <li
            key={b.title}
            className="flex min-w-0 gap-4 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-violet-50/40 p-5 sm:p-6"
          >
            <CheckIcon />
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-[#0F1B3D]">{b.title}</h3>
              <p className="text-body mt-1.5 text-slate-500">{b.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
