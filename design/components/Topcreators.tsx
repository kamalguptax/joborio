// components/TopCreators.tsx
// Next.js + Tailwind CSS | npm i lucide-react
// Avatars: public/avatars/ me rakho. Na ho to initials dikhte hain.

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Camera, Play, Send, type LucideIcon } from "lucide-react";

/* ---------- Types ---------- */
type Platform = "telegram" | "instagram" | "youtube";

export interface Creator {
  id: string;
  rank: number;
  name: string;
  niche: string;
  avatar?: string;
  platform: Platform;
  earnings: number; // INR
  clicks: number;
  href: string;
}

/* ---------- Data (API se aaye to `creators` prop me pass karo) ---------- */
const CREATORS: Creator[] = [
  {
    id: "anjali-sharma",
    rank: 1,
    name: "Anjali Sharma",
    niche: "Education & Courses",
    avatar: "/images/karan.png",
    platform: "telegram",
    earnings: 24680,
    clicks: 2184,
    href: "/creators/anjali-sharma",
  },
  {
    id: "karan-mehta",
    rank: 2,
    name: "Karan Mehta",
    niche: "Tech & AI",
    avatar: "/images/karan.png",
    platform: "instagram",
    earnings: 18420,
    clicks: 1582,
    href: "/creators/karan-mehta",
  },
  {
    id: "sneha-patil",
    rank: 3,
    name: "Sneha Patil",
    niche: "Govt Jobs",
    avatar: "/images/karan.png",
    platform: "youtube",
    earnings: 15230,
    clicks: 1421,
    href: "/creators/sneha-patil",
  },
];

/* ---------- Helpers ---------- */
// Naye lucide-react me brand icons (Instagram, Youtube...) hata diye gaye hain,
// isliye generic icons use kiye hain jo har version me chalte hain.
const PLATFORM: Record<Platform, { icon: LucideIcon; label: string }> = {
  telegram: { icon: Send, label: "Telegram" },
  instagram: { icon: Camera, label: "Instagram" },
  youtube: { icon: Play, label: "YouTube" },
};

// Poori class names (Tailwind purge-safe)
const RANK_STYLES: Record<number, string> = {
  1: "bg-amber-300 text-amber-900",
  2: "bg-indigo-100 text-indigo-700",
  3: "bg-orange-400 text-white",
};

const fmt = (n: number): string => new Intl.NumberFormat("en-IN").format(n);

const initials = (name: string): string =>
  name
    .split(" ")
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join("");

/* ---------- Card ---------- */
function CreatorCard({ creator }: { creator: Creator }) {
  const { icon: PlatformIcon, label } = PLATFORM[creator.platform];

  return (
    <article className="relative flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-lg hover:shadow-indigo-900/10 focus-within:ring-4 focus-within:ring-indigo-200">
      {/* avatar + rank + platform */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          {creator.avatar ? (
            <Image
              src={creator.avatar}
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-200 text-[14px] font-bold text-indigo-700"
            >
              {initials(creator.name)}
            </span>
          )}

          <span
            className={`absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ring-2 ring-white ${
              RANK_STYLES[creator.rank] ?? "bg-slate-100 text-slate-600"
            }`}
          >
            <span className="sr-only">Rank </span>
            {creator.rank}
          </span>
        </div>

        <span className="flex w-7 h-7 items-center rounded-full bg-slate-100 px-1 text-indigo-600">
          <PlatformIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">{label}</span>
        </span>
      </div>

      {/* name + niche (poore card ko clickable banata hai) */}
      <h3 className="mt-3 text-[13px] font-bold text-indigo-950">
        <Link href={creator.href} className="after:absolute after:inset-0 after:content-[''] focus:outline-none">
          {creator.name}
        </Link>
      </h3>
      <p className="text-[12px] text-slate-600">{creator.niche}</p>

      {/* stats */}
      <p className="mt-3 text-[14px] font-extrabold tracking-tight text-indigo-950">
        ₹ {fmt(creator.earnings)}
      </p>
      <p className="mt-0.5 text-xs font-medium text-emerald-600">
        {fmt(creator.clicks)} clicks
      </p>
    </article>
  );
}

/* ---------- Section ---------- */
interface TopCreatorsProps {
  creators?: Creator[];
  title?: string;
}

export default function TopCreators({
  creators = CREATORS,
  title = "Top Creators This Week",
}: TopCreatorsProps) {
  return (
    <section aria-labelledby="top-creators-heading" className="">
      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/70 p-5 shadow-[0_8px_30px_rgba(79,70,229,0.08)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="top-creators-heading"
            className="text-xl font-extrabold tracking-tight text-indigo-950 sm:text-2xl"
          >
            {title}
          </h2>

          <Link
            href="/leaderboard"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
          >
            View Leaderboard
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>

        <ol className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {creators.map((creator) => (
            <li key={creator.id} className="h-full">
              <CreatorCard creator={creator} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
