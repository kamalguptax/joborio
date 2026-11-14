"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

const nav = [
  { href: "/creator/dashboard", label: "Creators" },
  { href: "/jobs", label: "Opportunities" },
  { href: "/creator/campaigns", label: "Campaigns" },
  { href: "/jobs", label: "Courses" },
  { href: "/jobs", label: "Marketplace" },
  { href: "/faq", label: "Resources" },
];

export default function Header({ authPage = false }: { authPage?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const { ready, loggedIn, handle, isAdmin } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const barClass = authPage
    ? "border-slate-200 bg-white shadow-sm"
    : scrolled
      ? "border-slate-200/80 bg-white/95 shadow-md backdrop-blur-md"
      : "border-transparent bg-white/90 backdrop-blur-sm";

  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b transition-all duration-300">
      <div className={`${barClass}`}>
        <div className="mx-auto flex max-w-[1460px] items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
          <Link
            href="/"
            className="font-logo flex shrink-0 items-center gap-2 text-xl text-[#7030A0] lg:text-2xl"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7030A0] text-sm font-extrabold text-white">
              J
            </span>
            Job<span className="text-slate-900">Orio</span>
          </Link>

          <nav className="hidden items-center gap-6 xl:flex">
            {nav.map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className="text-sm font-medium text-slate-600 transition hover:text-[#7030A0]"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {ready && isAdmin ? (
              <Link
                href="/admin/listings"
                className="hidden text-sm font-medium text-slate-500 hover:text-[#7030A0] md:block"
              >
                Admin
              </Link>
            ) : null}
            <Link
              href="/jobs"
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#7030A0]"
              aria-label="Search opportunities"
            >
              <Search size={20} />
            </Link>
            {ready && loggedIn ? (
              <Link
                href="/creator/dashboard"
                className="hidden rounded-full border border-[#7030A0]/30 px-4 py-2 text-sm font-semibold text-[#7030A0] sm:inline-flex"
              >
                {handle ? `@${handle}` : "Dashboard"}
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden rounded-full border-2 border-[#7030A0] px-4 py-2 text-sm font-semibold text-[#7030A0] transition hover:bg-[#7030A0]/5 sm:inline-flex"
              >
                Login
              </Link>
            )}
            <Link
              href={loggedIn ? "/creator/opportunities" : "/signup"}
              className="font-ui inline-flex items-center gap-1.5 rounded-full bg-[#7030A0] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#7030A0]/25 transition hover:bg-[#5c2890] sm:px-5"
            >
              Get Started
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
