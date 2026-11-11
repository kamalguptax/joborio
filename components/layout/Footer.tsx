"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

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
      { label: "I'm Hiring", href: "/hiring" },
      { label: "Become a Partner", href: "/partners" },
    ],
  },
];

export default function Footer() {
  const pathname = usePathname() ?? "";
  const columnsForPage = pathname.startsWith("/creator")
    ? columns.map((col) => ({
        ...col,
        links: col.links.filter((l) => l.href !== "/opportunities"),
      }))
    : columns;

  return (
    <footer className="mt-8 overflow-x-clip rounded-t-[32px] bg-[#0B1D4F] text-slate-300 sm:rounded-t-[48px]">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-12 sm:gap-12 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)] lg:px-10 lg:py-16">
        <div className="min-w-0">
          <Logo />
          <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400 sm:text-base">
            The marketplace built for modern creators. Share trusted jobs, courses and campaigns, track real results and get paid.
          </p>
        </div>

        <nav
          aria-label="Footer"
          className="grid grid-cols-1 gap-8 min-[420px]:grid-cols-2 md:grid-cols-3"
        >
          {columnsForPage.map((col) => (
            <div key={col.heading} className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white">
                {col.heading}
              </p>
              <ul className="mt-4 space-y-1 sm:mt-5 sm:space-y-3">
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
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-[1600px] px-4 py-6 text-sm text-slate-500 sm:px-8 lg:px-10">
          © Joborio. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
