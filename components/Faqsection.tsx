"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import SectionHeading from "@/components/layout/SectionHeading";

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

  const toggle = (i: number) => {
    setOpenIndex((prev) => (prev === i ? null : i));
  };

  return (
    <section id="faq" className="section-pad w-full overflow-x-clip bg-white">
      <div className="mx-auto max-w-[820px] px-4 sm:px-8">
        <div className="mb-8 flex items-start gap-3 sm:mb-10">
          <HelpCircle
            size={26}
            strokeWidth={1.8}
            className="mt-1 shrink-0 text-[#633BFF]"
          />

          <SectionHeading
            className="min-w-0"
            eyebrow="Support"
            title="Frequently Asked Questions"
            description="Earnings, referrals, and how JobOrio pays creators."
          />
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;

            return (
              <div
                key={faq.question}
                className={`overflow-hidden rounded-2xl border transition-colors ${
                  isOpen
                    ? "border-violet-200 bg-[#F8F6FF]"
                    : "border-slate-200 bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5 sm:py-5"
                >
                  <span className="text-body font-semibold text-[#24375C]">
                    {faq.question}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`shrink-0 text-[#633BFF] transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-body px-4 pb-4 text-slate-500 sm:px-5 sm:pb-5">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-[#E9EEF6] bg-[#FAFBFD] px-6 py-6 text-center sm:mt-10">
          <p className="text-body font-medium text-slate-500">
            Want the full referral breakdown?
          </p>
          <Link
            href="/refer-and-earn"
            className="rounded-full bg-[#633BFF] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4f2ee0]"
          >
            Refer & Earn
          </Link>
        </div>
      </div>
    </section>
  );
}
