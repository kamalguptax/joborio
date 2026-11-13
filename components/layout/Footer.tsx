"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Logo from "./Logo";
import NewsletterForm from "./NewsletterForm";

const columns = [
  {
    heading: "Platform",
    links: [
      { label: "Creators", href: "/creators" },
      { label: "Opportunities", href: "/opportunities" },
      { label: "Campaigns", href: "/campaigns" },
      { label: "Courses", href: "/courses" },
      { label: "Marketplace", href: "/marketplace" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
      { label: "Resources", href: "/resources" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    heading: "Get involved",
    links: [
      { label: "Start Earning", href: "/signup" },
      { label: "Refer & Earn", href: "/refer-and-earn" },
      { label: "Live Campaigns", href: "/hiring" },
      { label: "Become a Partner", href: "/partners" },
    ],
  },
];

/** TODO: replace "#" with your real profile URLs. */
const SOCIALS = [
  { label: "LinkedIn", href: "#", path: "M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9.75h4V21H3zM9.5 9.75h3.83v1.54h.05c.53-1 1.84-2.07 3.78-2.07 4.04 0 4.79 2.66 4.79 6.12V21h-4v-5.1c0-1.22-.02-2.78-1.7-2.78-1.7 0-1.96 1.33-1.96 2.69V21h-4z" },
  { label: "Instagram", href: "#", path: "M7.5 2h9A5.5 5.5 0 0122 7.5v9a5.5 5.5 0 01-5.5 5.5h-9A5.5 5.5 0 012 16.5v-9A5.5 5.5 0 017.5 2zm0 2A3.5 3.5 0 004 7.5v9A3.5 3.5 0 007.5 20h9a3.5 3.5 0 003.5-3.5v-9A3.5 3.5 0 0016.5 4zM12 7a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6zm5.25-3.25a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5z" },
  { label: "YouTube", href: "#", path: "M21.6 7.2a2.5 2.5 0 00-1.76-1.77C18.3 5 12 5 12 5s-6.3 0-7.84.43A2.5 2.5 0 002.4 7.2C2 8.76 2 12 2 12s0 3.24.4 4.8a2.5 2.5 0 001.76 1.77C5.7 19 12 19 12 19s6.3 0 7.84-.43a2.5 2.5 0 001.76-1.77C22 15.24 22 12 22 12s0-3.24-.4-4.8zM10 15V9l5.2 3z" },
];

/** Two light-trails reaching toward each other (creators ↔ companies). */
function ReachingArt() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 300"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <defs>
        <linearGradient id="reachA" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7C3AED" stopOpacity="0" />
          <stop offset="0.55" stopColor="#7C3AED" stopOpacity="0.55" />
          <stop offset="1" stopColor="#60A5FA" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="reachB" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2563EB" stopOpacity="0" />
          <stop offset="0.6" stopColor="#2563EB" stopOpacity="0.35" />
          <stop offset="1" stopColor="#F0ABFC" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id="reachSpark">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.35" stopColor="#C4B5FD" stopOpacity="0.55" />
          <stop offset="1" stopColor="#7C3AED" stopOpacity="0" />
        </radialGradient>
        <filter id="reachSoft" x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      <g filter="url(#reachSoft)" transform="translate(0 -50)">
        <path d="M-20 150 C160 96 330 86 520 150 C340 168 180 196 -20 232 Z" fill="url(#reachA)" />
        <path d="M-20 196 C150 168 320 170 470 186 C330 206 180 236 -20 262 Z" fill="url(#reachB)" />
      </g>
      <g filter="url(#reachSoft)" transform="translate(1200 -50) scale(-1 1)">
        <path d="M-20 178 C150 132 330 124 520 168 C340 196 190 226 -20 258 Z" fill="url(#reachA)" />
        <path d="M-20 122 C150 98 300 96 450 128 C320 146 170 160 -20 176 Z" fill="url(#reachB)" />
      </g>

      <circle cx="600" cy="112" r="46" fill="url(#reachSpark)" />
      <circle cx="600" cy="112" r="3.5" fill="#fff" />
    </svg>
  );
}

export default function Footer() {
  const pathname = usePathname() ?? "";
  const columnsForPage = pathname.startsWith("/creator")
    ? columns.map((col) => ({
        ...col,
        links: col.links.filter((l) => l.href !== "/opportunities"),
      }))
    : columns;

  return (
    <footer className="relative mt-8 overflow-hidden bg-[#0B1D4F] text-slate-300">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/70 to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-600/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-1/2 h-80 w-80 rounded-full bg-blue-500/15 blur-[110px]" />

      {/* ---------- Top: brand · links · newsletter ---------- */}
      <div className="relative mx-auto grid max-w-[1600px] gap-10 px-4 pt-12 sm:gap-12 sm:px-8 sm:pt-14 lg:px-10 lg:pt-16 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,2.4fr)_minmax(0,1.3fr)] xl:gap-14">
        <div className="min-w-0">
          <Logo />
          <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400 sm:text-base">
            The marketplace built for modern creators. Share trusted jobs, courses and campaigns, track real results and get paid.
          </p>
          <div className="mt-6 flex items-center gap-2">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.07] text-white/70 ring-1 ring-white/10 transition hover:bg-white/15 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3">
          {columnsForPage.map((col) => (
            <div key={col.heading} className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white">{col.heading}</p>
              <ul className="mt-4 space-y-1 sm:mt-5 sm:space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="inline-flex min-h-11 items-center text-[15px] text-slate-400 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="min-w-0 max-w-md xl:max-w-[360px]">
          <NewsletterForm />
        </div>
      </div>


      {/* ---------- Legal ---------- */}
      <div className="border-t border-white/10">
        <div className="relative z-10 mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <p>All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </div>

      {/* ---------- Giant faded wordmark ---------- */}
      <div aria-hidden="true" className="pointer-events-none relative -mt-2 select-none overflow-hidden text-center sm:-mt-4">
        <span className="font-logo block translate-y-[18%] bg-gradient-to-b from-white/[0.14] to-transparent bg-clip-text text-[clamp(5rem,23vw,24rem)] font-bold leading-[0.85] tracking-tight text-transparent">
          JobOrio
        </span>
      </div>
    </footer>
  );
}
