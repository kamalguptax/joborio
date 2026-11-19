import type { ReactNode } from "react";
import PageHero from "./PageHero";
import SectionHeading from "./SectionHeading";
import CtaBand from "./CtaBand";
import FAQSection from "@/components/Faqsection";
import { BenefitsSection, StatsStrip, StepsSection, type InfoItem } from "./PageSections";

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
  /** Optional richer sections. Pages that leave these out render exactly as before. */
  stats?: { value: string; label: string }[];
  steps?: { label: string; title: string; intro?: string; items: InfoItem[] };
  benefits?: { label: string; title: string; intro?: string; items: InfoItem[] };
  faqs?: { title?: string; items: { q: string; a: string }[] };
};

/** One layout shared by all the simple marketing pages: hero, feature cards, call-to-action. */
export default function PageTemplate({
  c,
  featuresSlot,
}: {
  c: PageContent;
  /** Replaces the default feature-card section (hero and CTA stay). */
  featuresSlot?: ReactNode;
}) {
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

      {c.stats && c.stats.length > 0 ? <StatsStrip items={c.stats} /> : null}

      {featuresSlot ?? (
        <section className="mx-auto w-full max-w-[1600px] px-4 py-16 sm:px-8 md:py-24 lg:px-10">
          <SectionHeading
            className="max-w-3xl min-w-0"
            eyebrow={c.sectionLabel}
            title={c.sectionTitle}
            description={c.sectionIntro}
          />

          <ul className="mt-10 grid grid-cols-1 gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-5 lg:gap-6 xl:grid-cols-4">
            {c.features.map((f, i) => (
              <li
                key={f.title}
                className="group relative min-w-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,27,61,0.04),0_18px_40px_-28px_rgba(15,27,61,0.25)] transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_28px_50px_-30px_rgba(91,53,213,0.45)] sm:p-8"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-[#7C3AED] to-[#2563EB] transition-transform duration-300 group-hover:scale-x-100"
                />
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-50 to-blue-50 text-sm font-bold text-violet-700 ring-1 ring-violet-100">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-card-heading mt-6">{f.title}</h3>
                <p className="text-body mt-3 text-slate-500">{f.text}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {c.steps ? (
        <StepsSection eyebrow={c.steps.label} title={c.steps.title} intro={c.steps.intro} steps={c.steps.items} />
      ) : null}

      {c.benefits ? (
        <BenefitsSection eyebrow={c.benefits.label} title={c.benefits.title} intro={c.benefits.intro} items={c.benefits.items} />
      ) : null}

      {c.faqs ? (
        <FAQSection
          id="page-faq"
          title={c.faqs.title ?? "Frequently asked questions"}
          description="Quick answers before you get started."
          items={c.faqs.items.map((f) => ({ question: f.q, answer: f.a }))}
          cta={{
            title: "Still have questions?",
            text: "Browse the full help center or get in touch.",
            label: "Visit help center",
            href: "/faq",
          }}
        />
      ) : null}

      <CtaBand title={c.ctaTitle} text={c.ctaText} label={c.ctaLabel} href={c.ctaHref} />
    </>
  );
}
