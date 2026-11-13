"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Gift, X } from "lucide-react";

const STORAGE_KEY = "joborio_refer_earn_popup_dismissed_at";
/** Show again after 3 days if dismissed. */
const RESHOW_MS = 3 * 24 * 60 * 60 * 1000;

function shouldShowPopup(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return true;
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return true;
    return Date.now() - dismissedAt >= RESHOW_MS;
  } catch {
    return true;
  }
}

function markDismissed() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export default function ReferAndEarnPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!shouldShowPopup()) return;
    const timer = window.setTimeout(() => setOpen(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => {
    markDismissed();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="refer-earn-title"
      onClick={close}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl shadow-indigo-900/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-[#7C3AED] via-[#5B21B6] to-[#2563EB] px-6 pb-8 pt-6 text-white">
          <button
            type="button"
            onClick={close}
            className="absolute right-3 top-3 rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <Gift size={24} />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-violet-200">
            Refer & Earn
          </p>
          <h2 id="refer-earn-title" className="mt-1 text-2xl font-bold tracking-tight">
            Invite creators. Earn from their success.
          </h2>
          <p className="mt-2 text-sm text-violet-100">
            Share your invite link. They keep about 75% of revenue — you earn 2–5%
            from JobOrio’s platform fee when they start earning.
          </p>
        </div>

        <div className="space-y-3 px-6 py-5">
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex gap-2">
              <span className="font-bold text-purple-600">1.</span>
              Copy your personal referral link from Referrals.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-purple-600">2.</span>
              Send it to friends and creators you trust.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-purple-600">3.</span>
              Get a bonus when they hit the earnings threshold, plus override
              rewards.
            </li>
          </ul>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <Link
              href="/creator/referrals"
              onClick={close}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25"
            >
              Open Referrals
            </Link>
            <button
              type="button"
              onClick={close}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Maybe later
            </button>
          </div>
          <p className="text-center text-xs text-slate-400">
            We’ll remind you again in a few days.
          </p>
        </div>
      </div>
    </div>
  );
}
