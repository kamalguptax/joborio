// components/CreatedByCreatorsCard.tsx
// Next.js + Tailwind CSS | npm i lucide-react
// Handwritten font (optional) - RoleCard wale setup jaisa:
//   import { Caveat } from "next/font/google";
//   const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });
//   <body className={caveat.variable}>

import { Handshake, Briefcase, UserRound, Users, type LucideIcon } from "lucide-react";

interface Pillar {
  icon: LucideIcon;
  label: string;
}

const PILLARS: Pillar[] = [
  { icon: UserRound, label: "Creators" },
  { icon: Briefcase, label: "Employers" },
  { icon: Handshake, label: "Partners" },
  { icon: Users, label: "Communities" },
];

interface CreatedByCreatorsCardProps {
  headline?: string[];
  pillars?: Pillar[];
  tagline?: string;
  className?: string;
}

export default function CreatedByCreatorsCard({
  headline = ["Created by Creators.", "Built for Everyone."],
  pillars = PILLARS,
  tagline = "More Opportunities. Bigger Dreams.",
  className = "",
}: CreatedByCreatorsCardProps) {
  return (
    <div
      aria-labelledby="created-by-heading"
      className={`relative isolate overflow-hidden rounded-3xl bg-gradient-to-b from-[#12256b] to-[#0a1440] p-6 text-white shadow-2xl shadow-indigo-950/30 ${className}`}
    >
      {/* soft glow */}
      <div
        aria-hidden="true"
        className="absolute -right-12 -top-16 -z-10 h-52 w-52 rounded-full bg-indigo-400/20 blur-3xl"
      />

      <h3
        id="created-by-heading"
        className="text-2xl font-extrabold leading-tight tracking-tight"
      >
        {headline.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </h3>

      <ul className="mt-6 grid grid-cols-4 gap-2">
        {pillars.map(({ icon: Icon, label }) => (
          <li key={label} className="flex min-w-0 flex-col items-center gap-2 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-sky-200 ring-1 ring-white/25">
              <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="text-xs font-medium text-indigo-50">{label}</span>
          </li>
        ))}
      </ul>

      <p
        className="mt-6 -rotate-1 text-xl leading-snug text-white/95"
        style={{ fontFamily: "var(--font-caveat), cursive" }}
      >
        {tagline}
      </p>
    </div>
  );
}
