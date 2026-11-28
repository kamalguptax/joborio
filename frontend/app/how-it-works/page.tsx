import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import SectionHeading from "@/components/layout/SectionHeading";
import CtaBand from "@/components/layout/CtaBand";

export const metadata: Metadata = {
  title: "How it works",
  description: "One link. Verified performance. USD payouts.",
};

const steps = [
  {
    n: "01",
    title: "Claim your handle",
    text: "Sign up with email or Google, pick @yourname, and select your niche and audience countries.",
  },
  {
    n: "02",
    title: "Share tracked links",
    text: "Copy Upclift tracking URLs for jobs and courses, not raw employer links, so every click counts.",
  },
  {
    n: "03",
    title: "Earn in USD",
    text: "PPC on verified clicks, PPR on verified signups. Earnings move from pending to approved to payout.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title="One link."
        highlight="Verified performance. USD payouts."
        description="Three simple steps from signing up to getting paid for the audience you already have."
        primary={{ label: "Start as a creator", href: "/signup" }}
        secondary={{ label: "Contact us", href: "/contact" }}
        points={["Free to join", "Tracked links", "Paid in USD"]}
      />

      <section className="mx-auto w-full max-w-[1600px] px-4 py-16 sm:px-8 md:py-24 lg:px-10">
        <SectionHeading
          eyebrow="The process"
          title="From sign-up to payout"
          description="Here is exactly what happens at each stage."
        />
        <ol className="relative mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <li
              key={s.n}
              className="relative rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_1px_2px_rgba(10,33,80,0.04),0_18px_40px_-30px_rgba(10,33,80,0.25)] sm:p-8"
            >
              <span className="bg-gradient-to-br from-[#0A5FCF] to-[#2563EB] bg-clip-text text-5xl font-bold leading-none tracking-tight text-transparent">
                {s.n}
              </span>
              <h3 className="text-card-heading mt-6">{s.title}</h3>
              <p className="text-body mt-3 text-slate-500">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <CtaBand
        title="Ready to turn your audience into income?"
        text="Create your creator profile in a few minutes."
        label="Start as a creator"
        href="/signup"
      />
    </>
  );
}
