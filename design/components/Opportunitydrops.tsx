// components/OpportunityDrops.tsx
// Next.js + Tailwind CSS | npm i lucide-react
// Logos: apne logo public/logos/ me rakho (e.g. /logos/flipkart.png). Na ho to initials dikhte hain.

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Flame, MapPin } from "lucide-react";

/* ---------- Types ---------- */
type OpportunityType = "Job" | "Course" | "Campaign";
type Status = "High Demand" | "Trending" | "Popular" | "New";

export interface Opportunity {
  id: string;
  type: OpportunityType;
  status: Status;
  company: string;
  logo?: string;
  title: string;
  location: string;
  tags: string[];
  payout: number;
  unit: string; // "qualified click" | "lead" ...
  match: number; // percent
  endsInDays: number;
  href: string;
}

/* ---------- Data (API se aaye to `items` prop me pass karo) ---------- */
const OPPORTUNITIES: Opportunity[] = [
  {
    id: "tata-production-engineer",
    type: "Job",
    status: "High Demand",
    company: "Tata Electronics",
    logo: "/images/companies/tcs.png",
    title: "Production Engineer",
    location: "Noida / Bengaluru",
    tags: ["Engineering", "Manufacturing"],
    payout: 2.25,
    unit: "qualified click",
    match: 99,
    endsInDays: 2,
    href: "/opportunities/tata-production-engineer",
  },
  {
    id: "google-analytics-certificate",
    type: "Course",
    status: "Trending",
    company: "Google Career Certificates",
    logo: "/images/companies/google.webp",
    title: "Analytics",
    location: "Online (Self-paced)",
    tags: ["Data", "Analytics"],
    payout: 1.5,
    unit: "qualified click",
    match: 98,
    endsInDays: 5,
    href: "/opportunities/google-analytics-certificate",
  },
  {
    id: "flipkart",
    type: "Campaign",
    status: "Popular",
    company: "AI Tools Platform",
    logo: "/images/companies/flipkart.png",
    title: "Sign Up Campaign",
    location: "Pan India",
    tags: ["Tech", "AI", "Tools"],
    payout: 1.2,
    unit: "lead",
    match: 89,
    endsInDays: 5,
    href: "/opportunities/ai-tools-signup",
  },
];

/* ---------- Helpers ---------- */
// Poori class names (Tailwind purge-safe)
const statusStyles: Record<Status, string> = {
  "High Demand": "bg-rose-100 text-rose-600",
  Trending: "bg-orange-100 text-orange-600",
  Popular: "bg-amber-100 text-amber-700",
  New: "bg-sky-100 text-sky-600",
};

const endsLabel = (days: number): string =>
  days <= 0 ? "Ends today" : `Ends in ${days} ${days === 1 ? "day" : "days"}`;

/* ---------- Card ---------- */
function CompanyLogo({ name, logo }: { name: string; logo?: string }) {
  if (logo) {
    return (
      <Image
        src={logo}
        alt=""
        width={24}
        height={24}
        className="h-6 w-6 shrink-0 rounded object-contain"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-indigo-100 text-xs font-bold text-indigo-700"
    >
      {name.charAt(0)}
    </span>
  );
}

function OpportunityCard({ item }: { item: Opportunity }) {
  return (
    <article className="relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-lg hover:shadow-indigo-900/10 focus-within:ring-4 focus-within:ring-indigo-200">
      {/* type + status */}
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {item.type}
        </span>
        <span
          className={`rounded-md px-2.5 py-1 text-xs font-semibold ${statusStyles[item.status]}`}
        >
          {item.status}
        </span>
      </div>

      {/* company */}
      <div className="mt-4 flex items-center gap-2">
        <CompanyLogo name={item.company} logo={item.logo} />
        <p className="text-sm font-bold leading-snug text-indigo-950">{item.company}</p>
      </div>

      {/* title — poore card ko clickable banata hai */}
      <h3 className="mt-2 text-[12px] text-slate-500">
        <Link href={item.href} className="focus:outline-none">
          {item.title}
        </Link>
      </h3>

      {/* location */}
      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
        {item.location}
      </p>

      {/* tags */}
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {item.tags.map((tag) => (
          <li
            key={tag}
            className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-slate-600"
          >
            {tag}
          </li>
        ))}
      </ul>

      {/* payout + match (hamesha card ke neeche align) */}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
        <p className="text-[16] font-extrabold text-emerald-600">
          ₹{item.payout.toFixed(2)}
          <span className="ml-1 text-xs font-normal italic text-slate-400">
            /{item.unit}
          </span>
        </p>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
          {item.match}% match
        </span>
      </div>

      {/* deadline */}
      <p className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs font-medium text-rose-500">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        {endsLabel(item.endsInDays)}
      </p>
    </article>
  );
}

/* ---------- Section ---------- */
export default function OpportunityDrops({
  items = OPPORTUNITIES,
}: {
  items?: Opportunity[];
}) {
  return (
    <section aria-labelledby="drops-heading" className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="drops-heading"
            className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-indigo-950"
          >
            <Flame className="h-6 w-6 fill-orange-400 text-orange-500" aria-hidden="true" />
            Opportunity Drops
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            High-paying campaigns. Limited time. Great for your audience.
          </p>
        </div>

        <Link
          href="/opportunities"
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
        >
          View All Opportunities
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </div>

      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.id} className="h-full">
            <OpportunityCard item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}