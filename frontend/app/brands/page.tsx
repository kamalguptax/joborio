import type { Metadata } from "next";
import Link from "next/link";
import FAQSection from "@/components/Faqsection";
import BrandsAdvertisers from "@/components/brands/BrandsAdvertisers";
import BrandsCta from "@/components/brands/BrandsCta";
import BrandsGoalsModels from "@/components/brands/BrandsGoalsModels";
import BrandsHero from "@/components/brands/BrandsHero";
import BrandsHowItWorks from "@/components/brands/BrandsHowItWorks";
import BrandsPlanner from "@/components/brands/BrandsPlanner";
import BrandsTrust from "@/components/brands/BrandsTrust";
import BrandsWhyContact from "@/components/brands/BrandsWhyContact";

export const metadata: Metadata = {
  title: "For Brands",
  description:
    "Acquire customers, applicants and learners with performance-based campaigns through creators and publishers. Pay for verified outcomes.",
};

const brandFaqs = [
  {
    question: "Which campaign model should I choose?",
    answer:
      "Use PPC for reach and traffic, PPR for registrations and enrolments, PPL for qualified leads, PPA for specific actions such as job applications, and PPE when you want engagement on a particular post. The campaign planner above recommends a model for your goal.",
  },
  {
    question: "How do I pay?",
    answer:
      "You fund your brand account, set a budget and a reward for each campaign, and rewards are paid out only for results that are verified under the model you chose.",
  },
  {
    question: "How do I know the results are genuine?",
    answer:
      "Every creator has a unique tracked link, duplicate clicks are filtered, suspicious traffic goes to review, and you can confirm or dispute leads and actions and approve engagement proof before you pay.",
  },
  {
    question: "What do I need before I can go live?",
    answer:
      "Register your brand, verify your work email, complete your company billing details and add funds. Your dashboard shows exactly what is still missing.",
  },
  {
    question: "Can I promote a specific social post?",
    answer:
      "Yes. Use a PPE campaign to get relevant creators to like, comment or repost a public LinkedIn, Instagram or X post. You review each proof before any payment.",
  },
  {
    question: "Can I run more than one campaign at the same time?",
    answer:
      "Yes. Create a separate campaign for each goal, for example PPC for awareness and PPR for enrolments, and pause or resume any of them whenever you like.",
  },
];

export default function Page() {
  return (
    <>
      <BrandsHero />
      <BrandsAdvertisers />
      <BrandsGoalsModels />
      <BrandsHowItWorks />
      <BrandsPlanner />
      <BrandsTrust />
      <BrandsWhyContact />
      <FAQSection
        id="brand-faq"
        title="Frequently asked questions"
        description="Quick answers before you launch your first campaign."
        items={brandFaqs}
        cta={{
          title: "Still have questions?",
          text: "Talk to our team and we will help you plan your campaign.",
          label: "Talk to our team",
          href: "/contact",
        }}
      />
      <BrandsCta />

      <section className="border-t border-slate-100 bg-slate-50/80 py-8">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 sm:px-8">
          <p className="text-sm font-semibold text-slate-600">Already have a brand account?</p>
          <Link href="/brand/login" className="text-sm font-bold text-violet-700 hover:underline">
            Sign in to your dashboard →
          </Link>
        </div>
      </section>
    </>
  );
}
