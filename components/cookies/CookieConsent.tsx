"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readCookieChoice, saveCookieChoice, type CookieChoice } from "@/lib/cookies/consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readCookieChoice() === null);
  }, []);

  const choose = (choice: CookieChoice) => {
    saveCookieChoice(choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] p-4 sm:p-6">
      <div
        role="dialog"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-body"
        className="pointer-events-auto mx-auto flex max-w-3xl flex-col gap-4 rounded-3xl border border-indigo-100 bg-white p-5 shadow-2xl shadow-indigo-900/15 sm:flex-row sm:items-center sm:p-6"
      >
        <div className="min-w-0 flex-1">
          <p id="cookie-consent-title" className="text-base font-bold text-[#172b63]">
            Cookies on JobOrio
          </p>
          <p id="cookie-consent-body" className="mt-1 text-sm leading-6 text-slate-500">
            We use cookies to keep you signed in and to remember this choice. Accept allows optional cookies. Reject keeps only what the site needs to work.{" "}
            <Link href="/privacy" className="font-semibold text-violet-700 hover:underline">
              Privacy policy
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose("rejected")}
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-[#172b63] transition hover:bg-slate-50"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
