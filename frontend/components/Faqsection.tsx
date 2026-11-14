"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Plus } from "lucide-react";

const faqs = [
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

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  const toggle = (i: number) => {
    setOpenIndex((prev) => (prev === i ? null : i));
  };

  return (
    <section id="faq" className="section-pad w-full overflow-x-clip bg-white">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)] lg:gap-12 xl:gap-20">
        {/* ---------- Left: label + heading ---------- */}
        <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <span className="inline-flex items-center gap-2.5 rounded-full bg-slate-100 py-1.5 pl-1.5 pr-4 text-sm font-semibold text-slate-600">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-[#633BFF] shadow-sm">
              ?
            </span>
            FAQ
          </span>

          <h2 className="mt-5 max-w-[16ch] text-balance text-[clamp(1.75rem,1.2rem+2.2vw,2.75rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-[#0F1B3D]">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-slate-500">
            Earnings, referrals, and how JobOrio pays creators.
          </p>

          <div className="mt-8 hidden max-w-sm rounded-3xl bg-[#F3F3F5] p-6 lg:block">
            <p className="text-base font-semibold text-[#1F2A44]">
              Want the full referral breakdown?
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              See how Refer &amp; Earn works, step by step.
            </p>
            <Link
              href="/refer-and-earn"
              className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[#633BFF] px-6 text-sm font-semibold text-white transition hover:bg-[#4f2ee0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#633BFF]"
            >
              Refer &amp; Earn
            </Link>
          </div>
        </div>

        {/* ---------- Right: accordion ---------- */}
        <div className="min-w-0">
          <div className="flex flex-col gap-3">
            {faqs.map((faq, i) => {
              const isOpen = openIndex === i;
              const panelId = `${baseId}-panel-${i}`;
              const buttonId = `${baseId}-button-${i}`;

              return (
                <div
                  key={faq.question}
                  className={`rounded-3xl transition-colors duration-300 ${
                    isOpen ? "bg-[#EEEEF2]" : "bg-[#F3F3F5] hover:bg-[#EDEDF1]"
                  }`}
                >
                  <h3>
                    <button
                      id={buttonId}
                      type="button"
                      onClick={() => toggle(i)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className="flex w-full items-center justify-between gap-4 rounded-3xl px-5 py-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#633BFF] sm:px-8 sm:py-6"
                    >
                      <span className="text-base font-medium leading-snug text-[#1F2A44] sm:text-lg">
                        {faq.question}
                      </span>
                      <Plus
                        size={22}
                        strokeWidth={1.6}
                        aria-hidden="true"
                        className={`shrink-0 transition-transform duration-300 motion-reduce:transition-none ${
                          isOpen ? "rotate-45 text-[#1F2A44]" : "text-slate-400"
                        }`}
                      />
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

          {/* Mobile / tablet CTA (left column is hidden CTA on lg+) */}
          <div className="mt-6 flex flex-col items-center gap-3 rounded-3xl bg-[#F3F3F5] px-6 py-6 text-center lg:hidden">
            <p className="text-base font-semibold text-[#1F2A44]">
              Want the full referral breakdown?
            </p>
            <Link
              href="/refer-and-earn"
              className="inline-flex min-h-11 items-center rounded-full bg-[#633BFF] px-6 text-sm font-semibold text-white transition hover:bg-[#4f2ee0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#633BFF]"
            >
              Refer &amp; Earn
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
