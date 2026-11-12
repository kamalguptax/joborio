"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import SectionHeading from "@/components/layout/SectionHeading";

type Card = {
  tag: string;
  title: string;
  text: string;
  cta: string;
  href: string;
  bg: string;
  img: string;
  alt: string;
  note: string;
  rot: number;
};

const cards: Card[] = [
  {
    tag: "For Creators",
    title: "I have an audience",
    text: "Share relevant opportunities, courses and campaigns. Earn from every qualified action.",
    cta: "Start Earning",
    href: "/creators",
    bg: "bg-[#F0E8FE]",
    img: "/images/grow/creator.jpg",
    alt: "Young Indian content creator holding a smartphone and camera light",
    note: "Your\nAudience\n= Income",
    rot: -14,
  },
  {
    tag: "For Employers",
    title: "I'm hiring",
    text: "Reach the right communities and get qualified candidates through trusted creators.",
    cta: "Launch Campaign",
    href: "/hiring",
    bg: "bg-[#E3F1FE]",
    img: "/images/grow/hiring.jpg",
    alt: "Indian HR recruiter in a professional interview setting with a laptop",
    note: "Better\nCandidates\nFaster",
    rot: -10,
  },
  {
    tag: "For Partners",
    title: "I own a community",
    text: "Monetize your traffic with relevant opportunities and long-term partnerships.",
    cta: "Become a Partner",
    href: "/partners",
    bg: "bg-[#DDF6EC]",
    img: "/images/grow/community.jpg",
    alt: "Indian community manager running an online community on his phone",
    note: "Traffic\n= Revenue",
    rot: -9,
  },
];

const reveal = (hidden: boolean) =>
  `transition-all duration-700 ease-out motion-reduce:transition-none ${
    hidden ? "translate-y-7 opacity-0" : "translate-y-0 opacity-100"
  }`;

export default function ChooseGrow() {
  const ref = useRef<HTMLElement>(null);
  const [armed, setArmed] = useState(false);
  const [active, setActive] = useState(false);
  const hidden = armed && !active;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let r1 = 0;
    let r2 = 0;
    let io: IntersectionObserver | undefined;

    r1 = requestAnimationFrame(() => {
      setArmed(true);
      if (typeof IntersectionObserver === "undefined") {
        setActive(true);
        return;
      }
      io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            r2 = requestAnimationFrame(() => setActive(true));
            io?.disconnect();
          }
        },
        { threshold: 0.05 },
      );
      io.observe(el);
    });

    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
      io?.disconnect();
    };
  }, []);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty(
      "--px",
      (((e.clientX - r.left) / r.width - 0.5) * 2).toFixed(3),
    );
    e.currentTarget.style.setProperty(
      "--py",
      (((e.clientY - r.top) / r.height - 0.5) * 2).toFixed(3),
    );
  };
  const onLeave = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty("--px", "0");
    e.currentTarget.style.setProperty("--py", "0");
  };

  return (
    <section
      ref={ref}
      className="section-pad mx-auto w-full max-w-[1600px] px-4 sm:px-8 lg:px-10"
    >
      <SectionHeading
        className={`max-w-3xl min-w-0 ${reveal(hidden)}`}
        eyebrow="Built for everyone"
        title="Choose how you want to grow"
        description="Whether you have an audience, need talent, or own a community—we've got you covered."
      />

      <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-16 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {cards.map((c, idx) => (
          <div
            key={c.tag}
            className={`${idx === 2 ? "md:col-span-2 lg:col-span-1" : ""} ${reveal(hidden)}`}
            style={{ transitionDelay: `${250 + idx * 120}ms` }}
          >
            <div
              onPointerMove={onMove}
              onPointerLeave={onLeave}
              className={`group relative flex h-full flex-col overflow-hidden rounded-[32px] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_rgba(76,29,149,0.14)] sm:rounded-[28px] ${c.bg}`}
            >
              {/* Copy */}
              <div className="relative z-10 flex flex-1 flex-col p-6 sm:p-8 xl:p-10">
                <span className="text-caption w-fit rounded-xl bg-white/80 px-3 py-2 font-semibold uppercase tracking-wide text-violet-700">
                  {c.tag}
                </span>

                <h3 className="text-card-heading mt-6 text-2xl font-bold sm:mt-8 md:text-[1.625rem]">
                  {c.title}
                </h3>
                <p className="text-body mt-3 max-w-md text-slate-600 sm:mt-4">
                  {c.text}
                </p>

                <Link
                  href={c.href}
                  className="btn-tap group/btn mt-8 inline-flex h-12 min-h-11 w-fit items-center gap-3 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB] px-8 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
                >
                  {c.cta}
                  <svg
                    className="h-[18px] w-[18px] transition-transform duration-200 group-hover/btn:translate-x-1"
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

              {/* Photo band — shared 4:3 aspect across all cards */}
              <div className="relative z-0 mt-auto w-full overflow-hidden">
                <div
                  className="relative aspect-[4/3] w-full"
                  style={{
                    transform:
                      "translate3d(calc(var(--px, 0) * -6px), calc(var(--py, 0) * -4px), 0)",
                    transition: "transform .4s ease-out",
                  }}
                >
                  <Image
                    src={c.img}
                    alt={c.alt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    loading="lazy"
                    className="object-cover object-[center_20%] transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Soft gradient so note text stays readable */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0F1B3D]/35 to-transparent"
                  />
                </div>

                <p
                  className="font-hand pointer-events-none absolute bottom-5 left-5 z-10 whitespace-pre-line text-card-heading leading-snug text-white drop-shadow-md sm:bottom-6 sm:left-6 xl:bottom-8 xl:left-8"
                  style={
                    {
                      "--rot": `${c.rot}deg`,
                      transform:
                        "translate3d(calc(var(--px, 0) * 8px), calc(var(--py, 0) * 6px), 0) rotate(var(--rot))",
                      transition: "transform .4s ease-out",
                    } as CSSProperties
                  }
                >
                  {c.note}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
