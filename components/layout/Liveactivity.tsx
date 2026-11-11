"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Activity = {
  name: string;
  action: string;
  time: string;
  tone: "violet" | "sky";
  img?: string; // optional photo, e.g. "/avatars/ananya.jpg"
};

const activities: Activity[] = [
  { name: "Priya", action: "applied for a Campaign", time: "2 min ago", tone: "violet" },
  { name: "Rahul", action: "completed a Course", time: "12 min ago", tone: "sky" },
  { name: "Ananya", action: "got hired", time: "28 min ago", tone: "violet" },
];

const marqueeCss = `
@keyframes la-marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.la-marquee-track {
  display: flex;
  width: max-content;
  will-change: transform;
  animation: la-marquee 50s linear infinite;
}
.la-marquee:hover .la-marquee-track {
  animation-play-state: paused;
}
`;

function Avatar({ a }: { a: Activity }) {
  const [failed, setFailed] = useState(false);

  if (a.img && !failed) {
    return (
      <Image
        src={a.img}
        alt={a.name}
        width={40}
        height={40}
        onError={() => setFailed(true)}
        className="h-10 w-10 shrink-0 rounded-full object-cover"
      />
    );
  }

  const tone = a.tone === "sky" ? "bg-sky-100 text-sky-500" : "bg-violet-100 text-violet-600";
  return (
    <span
      aria-hidden="true"
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${tone}`}
    >
      {a.name[0]}
    </span>
  );
}

function Item({ a }: { a: Activity }) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <Avatar a={a} />
      <div className="leading-tight">
        <p className="whitespace-nowrap text-[15px] font-medium text-slate-900">
          {a.name} {a.action}
        </p>
        <p className="mt-1 text-[13px] text-slate-400">{a.time}</p>
      </div>
    </div>
  );
}

// Ek full set (activities 2 baar repeat, taaki badi screen par bhi bhara rahe)
function Group({ hidden = false }: { hidden?: boolean }) {
  const list = [...activities, ...activities];
  return (
    <div className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={hidden || undefined}>
      {list.map((a, idx) => (
        <div key={`${a.name}-${idx}`} className="flex shrink-0 items-center gap-8">
          <Item a={a} />
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-200" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}

export default function LiveActivity() {
  return (
    <section aria-label="Live activity" className="mx-auto mt-4 w-full max-w-[1600px] px-4 sm:mt-5 sm:px-8 lg:px-10">
      <style dangerouslySetInnerHTML={{ __html: marqueeCss }} />

      <div className="flex flex-col gap-4 overflow-hidden rounded-3xl border border-indigo-100 bg-white p-4 shadow-[0_8px_30px_rgba(76,29,149,0.08)] md:flex-row md:items-center md:gap-6 md:px-6 lg:gap-8 lg:rounded-full lg:py-4 lg:pl-6 lg:pr-5">
        {/* Label */}
        <div className="flex shrink-0 items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
            <span className="absolute h-3 w-3 animate-ping rounded-full bg-emerald-400/60" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-card-heading text-slate-900">Live activity</span>
        </div>

        {/* Marquee */}
        <div
          className="la-marquee min-w-0 overflow-hidden md:flex-1"
          style={{
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
            maskImage:
              "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
          }}
        >
          <div className="la-marquee-track">
            <Group />
            <Group hidden />
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/opportunities"
          className="btn-tap group inline-flex h-12 min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-violet-100 px-6 text-sm font-semibold text-violet-600 transition hover:bg-violet-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 md:ml-auto md:w-auto"
        >
          Explore opportunities
          <svg
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </section>
  );
}