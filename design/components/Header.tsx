"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {ArrowRight,} from "lucide-react";

export default function Header({ authPage = false }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header className="fixed left-0 top-[20px] z-50 w-full">
      <div className="mx-auto max-w-[1460px]">
        <div
          className={`flex items-center justify-between rounded-full border px-6 py-4 transition-all duration-300 lg:px-8 ${
            authPage
              ? "border-slate-200 bg-slate-950 shadow-md"
              : scrolled
                ? "border-white/10 bg-slate-950 shadow-xl"
                : "border-white/10 bg-slate-950 backdrop-blur-xl"
          }`}
        >
          {/* Logo */}
          <Link href="/"className="outline-none focus:outline-none focus:ring-0 text-2xl font-bold tracking-tight text-white">Creator<span className="text-indigo-400">Hub</span></Link>

          {/* Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="/" className="text-sm text-slate-300 transition hover:text-white">Home</Link>
            <Link href="/about" className="text-sm text-slate-300 transition hover:text-white">About</Link>
            <Link href="/jobs" className="text-sm text-slate-300 transition hover:text-white">Jobs</Link>
            <Link href="/creator" className="text-sm text-slate-300 transition hover:text-white">Creator</Link>
            <Link href="/terms" className="text-sm text-slate-300 transition hover:text-white">Terms & Conditions</Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden rounded-full px-[40px] py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 ease-out hover:scale-105 hover:bg-white/10 hover:text-white sm:block">Login</Link>
            <Link href="/signup" className="inline-flex items-center gap-2 hidden rounded-full px-[20px] py-2.5 text-sm font-medium text-white transition-all duration-300 ease-out hover:scale-105 hover:bg-white/10 hover:text-white bg-gradient-to-r from-blue-600 to-purple-600">Get Started <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" /></Link>
          </div>
        </div>
      </div>
    </header>
  );
}
