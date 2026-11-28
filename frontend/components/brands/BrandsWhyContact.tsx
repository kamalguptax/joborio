import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const why = [
  "Relevant Creator & Publisher Networks",
  "Performance-Based Campaigns",
  "Audience-Based Targeting",
  "Creator-Level Tracking",
  "Campaign Budget Control",
  "Conversion Verification",
  "Centralised Reporting",
  "Scalable Distribution",
];

function Target() {
  return (
    <svg viewBox="0 0 140 140" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="tgt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1F73E6" />
          <stop offset="1" stopColor="#0A4AA8" />
        </linearGradient>
      </defs>
      <circle cx="68" cy="76" r="54" fill="url(#tgt)" />
      <circle cx="68" cy="76" r="40" fill="#fff" />
      <circle cx="68" cy="76" r="28" fill="url(#tgt)" />
      <circle cx="68" cy="76" r="15" fill="#fff" />
      <circle cx="68" cy="76" r="7" fill="#0A4AA8" />
      <path d="M68 76 L116 28" stroke="#0a2150" strokeWidth="5" strokeLinecap="round" />
      <path d="M104 14 L128 12 L126 36 L116 28 Z" fill="#1F73E6" />
      <path d="M112 38 L128 12" stroke="#0A4AA8" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function BrandsWhyContact() {
  return (
    <section id="get-in-touch" className="mx-auto w-full max-w-[1400px] scroll-mt-24 px-4 pb-14 sm:px-8 md:pb-20">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="relative overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-100/80 to-violet-50/60 p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight text-[#0A2150] sm:text-3xl">Why Choose Upclift?</h2>
          <div className="mt-6 grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_9rem]">
            <ul className="grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
              {why.map((w) => (
                <li key={w} className="flex items-start gap-2.5 text-[15px] font-medium text-[#1F2A55]">
                  <CheckCircle2 size={20} className="mt-0.5 shrink-0 fill-violet-600 text-white" aria-hidden="true" />
                  {w}
                </li>
              ))}
            </ul>
            <div className="mx-auto hidden h-36 w-36 sm:block">
              <Target />
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#0A2150] sm:text-3xl">Get in Touch</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Tell us about your campaign requirements. Our team will help you plan the perfect campaign.
            </p>
          </div>
          <Link
            href="/contact"
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0A4AA8] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#0B3B85] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A4AA8]"
          >
            Request a Campaign Proposal
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
