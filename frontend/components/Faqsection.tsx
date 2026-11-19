"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Plus } from "lucide-react";

export type FaqItem = { question: string; answer: string };

const defaultFaqs: FaqItem[] = [
  {
    question: "How does JobOrio work for creators?",
    answer:
      "You share tracked job, course and campaign links with your audience. When someone clicks, signs up or applies through your link, you earn for those qualified actions. The more relevant shares you make, the more you can earn.",
  },
  {
    question: "How much of my earnings do I keep?",
    answer:
      "Creators typically keep about 75% of qualified revenue. JobOrio’s platform fee is usually around 25%. Exact rates can be adjusted in platform settings, but the model is designed so you keep the majority of what you earn.",
  },
  {
    question: "What is Refer & Earn?",
    answer:
      "Share your referral link or code so other creators can join JobOrio. When someone signs up with your code and starts earning, you receive a share of JobOrio’s platform fee on their earnings (typically 2–5%) for a limited override period — paid from the platform’s cut, not from theirs.",
  },
  {
    question: "Example: Aman refers Pankaj — who gets what?",
    answer:
      "If Pankaj generates $100 in qualified revenue, Pankaj receives about $75. JobOrio’s fee is about $25. Aman (the referrer) earns 2–5% of that platform fee for the override window. Pankaj’s 75% is not reduced by Aman’s share.",
  },
  {
    question: "Where do I enter a referral code?",
    answer:
      "On signup you can enter a referral code in the optional field, or open a creator’s invite link (it includes ?ref=CODE). The code is saved and applied when you finish creator onboarding.",
  },
  {
    question: "When and how do I get paid?",
    answer:
      "Earnings move through a short hold window, then become payable. Once you reach the minimum payout threshold, you can withdraw to your linked payout method. Timing depends on earning type and verification.",
  },
  {
    question: "Is JobOrio free for creators?",
    answer:
      "Yes. Creating a profile, browsing opportunities and sharing links does not require an upfront fee. JobOrio earns through the platform fee on qualified revenue — not by charging you to join.",
  },
  {
    question: "How do I contact support?",
    answer:
      "Use the contact options on the site or email support. Include your account email and public creator code so we can help faster.",
  },
];

type Cta = { title: string; text?: string; label: string; href: string };

const defaultCta: Cta = {
  title: "Want the full referral breakdown?",
  text: "See how Refer & Earn works, step by step.",
  label: "Refer & Earn",
  href: "/refer-and-earn",
};

/** Each row gets its own accent colour so the list is easy to scan. */
const tones = [
  {
    chip: "bg-violet-100 text-violet-600",
    open: "from-violet-50 to-indigo-50 border-violet-200",
    bar: "from-[#7C3AED] to-[#2563EB]",
  },
  {
    chip: "bg-sky-100 text-sky-600",
    open: "from-sky-50 to-blue-50 border-sky-200",
    bar: "from-sky-400 to-blue-500",
  },
  {
    chip: "bg-orange-100 text-orange-600",
    open: "from-orange-50 to-amber-50 border-orange-200",
    bar: "from-orange-400 to-amber-500",
  },
  {
    chip: "bg-emerald-100 text-emerald-600",
    open: "from-emerald-50 to-teal-50 border-emerald-200",
    bar: "from-emerald-400 to-teal-500",
  },
] as const;

const ctaBg = { backgroundImage: "linear-gradient(135deg, #0B1D4F 0%, #14296B 48%, #2E2297 100%)" };

type Props = {
  /** Questions to show. Defaults to the main JobOrio FAQ. */
  items?: FaqItem[];
  title?: string;
  description?: string;
  /** Help card next to the heading. Pass `null` to hide it. */
  cta?: Cta | null;
  id?: string;
};

/**
 * The one FAQ design used across the site (home, /faq and every content page).
 * Pass `items` to show page-specific questions; everything else stays the same.
 */
export default function FAQSection({
  items = defaultFaqs,
  title = "Frequently Asked Questions",
  description = "Earnings, referrals, and how JobOrio pays creators.",
  cta = defaultCta,
  id = "faq",
}: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  const toggle = (i: number) => {
    setOpenIndex((prev) => (prev === i ? null : i));
  };

  // Last word of the heading gets the brand gradient.
  const words = title.trim().split(" ");
  const lastWord = words.length > 1 ? words.pop() : null;
  const firstPart = lastWord ? words.join(" ") : title;

  return (
    <section
      id={id}
      className="section-pad relative w-full overflow-x-clip bg-gradient-to-b from-white via-violet-50/60 to-white"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-[1400px] gap-8 px-4 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)] lg:gap-12 xl:gap-20">
        {/* ---------- Left: label + heading ---------- */}
        <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <span className="inline-flex items-center gap-2.5 rounded-full bg-violet-100 py-1.5 pl-1.5 pr-4 text-sm font-semibold text-violet-700">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#2563EB] text-xs font-bold text-white shadow-sm">
              ?
            </span>
            FAQ
          </span>

          <h2 className="mt-5 max-w-[18ch] text-balance text-[clamp(1.75rem,1.2rem+2.2vw,2.75rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-[#0F1B3D]">
            {firstPart}
            {lastWord ? (
              <>
                {" "}
                <span className="bg-gradient-to-r from-[#7C3AED] to-[#2563EB] bg-clip-text text-transparent">
                  {lastWord}
                </span>
              </>
            ) : null}
          </h2>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-slate-500">{description}</p>

          {cta ? (
            <div
              className="relative mt-8 hidden max-w-sm overflow-hidden rounded-3xl p-6 text-white shadow-[0_24px_50px_-30px_rgba(46,34,151,0.8)] lg:block"
              style={ctaBg}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-violet-500/40 blur-3xl"
              />
              <div className="relative">
                <p className="text-base font-semibold">{cta.title}</p>
                {cta.text ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-indigo-100/80">{cta.text}</p>
                ) : null}
                <Link
                  href={cta.href}
                  className="mt-5 inline-flex min-h-11 items-center rounded-full bg-white px-6 text-sm font-semibold text-[#2E2297] transition hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {cta.label}
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        {/* ---------- Right: accordion ---------- */}
        <div className="min-w-0">
          <div className="flex flex-col gap-3">
            {items.map((faq, i) => {
              const isOpen = openIndex === i;
              const tone = tones[i % tones.length];
              const panelId = `${baseId}-panel-${i}`;
              const buttonId = `${baseId}-button-${i}`;

              return (
                <div
                  key={faq.question}
                  className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${
                    isOpen
                      ? `bg-gradient-to-br ${tone.open} shadow-[0_18px_40px_-28px_rgba(76,29,149,0.45)]`
                      : "border-slate-200/80 bg-white shadow-sm hover:border-violet-200 hover:shadow-md"
                  }`}
                >
                  {isOpen ? (
                    <span
                      aria-hidden="true"
                      className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${tone.bar}`}
                    />
                  ) : null}
                  <h3>
                    <button
                      id={buttonId}
                      type="button"
                      onClick={() => toggle(i)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className="flex w-full items-center justify-between gap-4 rounded-3xl px-5 py-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#633BFF] sm:px-8 sm:py-6"
                    >
                      <span className="text-base font-semibold leading-snug text-[#0F1B3D] sm:text-lg">
                        {faq.question}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300 motion-reduce:transition-none ${
                          isOpen ? `rotate-45 bg-gradient-to-br ${tone.bar} text-white shadow-md` : tone.chip
                        }`}
                      >
                        <Plus size={18} strokeWidth={2.2} />
                      </span>
                    </button>
                  </h3>

                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-[62ch] px-5 pb-6 text-[15px] leading-7 text-slate-600 sm:px-8 sm:pb-7 sm:text-base">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile / tablet CTA (the left-column card is hidden below lg) */}
          {cta ? (
            <div
              className="relative mt-6 flex flex-col items-center gap-3 overflow-hidden rounded-3xl px-6 py-6 text-center text-white lg:hidden"
              style={ctaBg}
            >
              <p className="text-base font-semibold">{cta.title}</p>
              <Link
                href={cta.href}
                className="inline-flex min-h-11 items-center rounded-full bg-white px-6 text-sm font-semibold text-[#2E2297] transition hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {cta.label}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
