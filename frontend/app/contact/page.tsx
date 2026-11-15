import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Handshake, LayoutDashboard, Mail } from "lucide-react";
import PageHero from "@/components/layout/PageHero";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about creators, payouts or partnerships? Reach the JobOrio team.",
};

const cards = [
  {
    icon: Mail,
    title: "Email us",
    text: "Questions about creators, payouts or partnerships.",
    cta: "hello@joborio.com",
    href: "mailto:hello@joborio.com",
    tint: "from-violet-50 to-violet-100/60 text-violet-600",
  },
  {
    icon: LayoutDashboard,
    title: "Creators",
    text: "Use your in-app dashboard first. Most answers are one click away.",
    cta: "Open dashboard",
    href: "/creator/dashboard",
    tint: "from-blue-50 to-blue-100/60 text-blue-600",
  },
  {
    icon: Handshake,
    title: "Partners & brands",
    text: "Want to run campaigns or work with us? Start with the partner page.",
    cta: "See partners",
    href: "/partners",
    tint: "from-emerald-50 to-emerald-100/60 text-emerald-600",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        compact
        eyebrow="Contact"
        title="We're here to help."
        highlight="Say hello."
        description="Questions about creators, payouts or partnerships? Reach out and we'll point you to the right place."
      />
      <section className="bg-[#F7F8FC] px-4 pb-20 pt-10 sm:px-8 sm:pb-28 sm:pt-14 lg:px-10">
        <div className="mx-auto grid w-full max-w-[1600px] gap-5 md:grid-cols-3">
          {cards.map(({ icon: Icon, title, text, cta, href, tint }) => (
            <Link
              key={title}
              href={href}
              className="group flex flex-col rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_1px_2px_rgba(15,27,61,0.04),0_18px_40px_-30px_rgba(15,27,61,0.25)] transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_28px_50px_-30px_rgba(91,53,213,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tint}`}>
                <Icon size={22} />
              </span>
              <h2 className="text-card-heading mt-6">{title}</h2>
              <p className="text-body mt-2 flex-1 text-slate-500">{text}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600">
                {cta}
                <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
