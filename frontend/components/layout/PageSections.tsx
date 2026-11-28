import SectionHeading from "./SectionHeading";

import {
  BadgeDollarSign,
  ChartColumn,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";

/** Icon keys a benefit card can use. Cards with an icon render as rich cards. */
export type BenefitIcon = "sliders" | "reward" | "share" | "chart" | "shield" | "users";

export type InfoItem = { title: string; text: string; icon?: BenefitIcon };

const BENEFIT_ICONS = {
  sliders: SlidersHorizontal,
  reward: BadgeDollarSign,
  share: Share2,
  chart: ChartColumn,
  shield: ShieldCheck,
  users: Users,
} as const;

/** One colour family per card position (literal classes so Tailwind keeps them). */
const BENEFIT_TONES = [
  { chip: "bg-violet-100 text-violet-600", glow: "from-violet-100/70", hover: "hover:border-violet-200" },
  { chip: "bg-emerald-100 text-emerald-600", glow: "from-emerald-100/70", hover: "hover:border-emerald-200" },
  { chip: "bg-sky-100 text-sky-600", glow: "from-sky-100/70", hover: "hover:border-sky-200" },
  { chip: "bg-amber-100 text-amber-600", glow: "from-amber-100/70", hover: "hover:border-amber-200" },
  { chip: "bg-rose-100 text-rose-600", glow: "from-rose-100/70", hover: "hover:border-rose-200" },
  { chip: "bg-fuchsia-100 text-fuchsia-600", glow: "from-fuchsia-100/70", hover: "hover:border-fuchsia-200" },
] as const;

const wrap = "mx-auto w-full max-w-[1600px] px-4 sm:px-8 lg:px-10";

/** Row of headline numbers / facts, shown just under the hero. */
export function StatsStrip({ items }: { items: { value: string; label: string }[] }) {
  return (
    <section className={`${wrap} relative z-10 pt-10 sm:pt-14`}>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 shadow-[0_24px_50px_-34px_rgba(10,33,80,0.35)] lg:grid-cols-4">
        {items.map((s) => (
          <div key={s.label} className="flex flex-col-reverse gap-1.5 bg-white px-5 py-6 text-center sm:px-6 sm:py-8">
            <dt className="text-sm leading-snug text-slate-500">{s.label}</dt>
            <dd className="bg-gradient-to-r from-[#0A5FCF] to-[#2563EB] bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
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
              <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0A5FCF] to-[#2563EB] text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(10,95,207,0.8)] ring-4 ring-slate-50">
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
  // Items that carry an icon get the richer card layout; others keep the check-mark list.
  if (items.length > 0 && items.every((b) => b.icon)) {
    return (
      <section className={`${wrap} py-16 md:py-24`}>
        <SectionHeading className="max-w-3xl min-w-0" eyebrow={eyebrow} title={title} description={intro} />
        <ul className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {items.map((b, i) => {
            const Icon = BENEFIT_ICONS[b.icon!];
            const tone = BENEFIT_TONES[i % BENEFIT_TONES.length];
            return (
              <li
                key={b.title}
                className={`group relative min-w-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(10,33,80,0.04),0_18px_40px_-28px_rgba(10,33,80,0.25)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_50px_-30px_rgba(10,95,207,0.4)] sm:p-7 ${tone.hover}`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${tone.glow} to-transparent opacity-70 transition duration-300 group-hover:scale-125`}
                />
                <span
                  className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ${tone.chip} transition duration-300 group-hover:scale-105`}
                >
                  <Icon size={22} strokeWidth={2} aria-hidden="true" />
                </span>
                <h3 className="relative mt-5 text-lg font-bold text-[#0A2150]">{b.title}</h3>
                <p className="text-body relative mt-2 leading-7 text-slate-500">{b.text}</p>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

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
              <h3 className="text-base font-semibold text-[#0A2150]">{b.title}</h3>
              <p className="text-body mt-1.5 text-slate-500">{b.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
