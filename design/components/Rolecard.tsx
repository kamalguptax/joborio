// components/RoleCard.jsx
// Next.js + Tailwind CSS | npm i lucide-react
// Handwritten font (optional) in app/layout.jsx:
//   import { Caveat } from "next/font/google";
//   const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });
//   <body className={caveat.variable}>

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

// Full class names (Tailwind purge-safe)
const themes = {
  violet: {
    card: "border-violet-100 from-violet-100 via-violet-50 to-white shadow-[0_10px_30px_rgba(124,58,237,0.12)]",
    glow: "bg-violet-300/40",
    badge: "from-violet-600 to-indigo-600",
    button: "from-violet-700 to-indigo-700 hover:from-violet-600 hover:to-indigo-600 shadow-indigo-600/25 focus-visible:ring-violet-300",
    note: "text-indigo-800",
  },
  sky: {
    card: "border-sky-100 from-sky-100 via-sky-50 to-white shadow-[0_10px_30px_rgba(14,165,233,0.12)]",
    glow: "bg-sky-300/40",
    badge: "from-sky-600 to-blue-600",
    button: "from-sky-700 to-blue-700 hover:from-sky-600 hover:to-blue-600 shadow-blue-600/25 focus-visible:ring-sky-300",
    note: "text-blue-800",
  },
  emerald: {
    card: "border-emerald-100 from-emerald-100 via-emerald-50 to-white shadow-[0_10px_30px_rgba(16,185,129,0.12)]",
    glow: "bg-emerald-300/40",
    badge: "from-emerald-600 to-teal-600",
    button: "from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 shadow-teal-600/25 focus-visible:ring-emerald-300",
    note: "text-teal-800",
  },
};

export default function RoleCard({
  badge,
  title,
  description,
  cta,
  href,
  image,
  imageAlt = "",
  note,
  theme = "violet",
}) {
  const t = themes[theme] ?? themes.violet;

  return (
    <article className={`relative isolate h-full overflow-hidden rounded-3xl border bg-gradient-to-br pt-5 px-5 ${t.card}`}>
      <div aria-hidden="true" className={`absolute -bottom-14 -right-10 -z-10 h-56 w-56 rounded-full blur-3xl ${t.glow}`}/>
      <div className="grid h-full grid-cols-[1.15fr_1fr] items-end gap-2">
        <div className="relative z-10 pb-5 flex h-full flex-col items-start">
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-3 py-1 text-[10px] font-semibold text-white shadow-sm ${t.badge}`}>
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            {badge}
          </span>

          <h3 className="mt-3 text-xl font-extrabold leading-tight tracking-tight text-indigo-950 sm:text-2xl">
            {title}
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {description}
          </p>

          <Link href={href} className={`group mt-auto inline-flex items-center gap-2 rounded-xl bg-gradient-to-r px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition focus:outline-none focus-visible:ring-4 ${t.button}`} style={{ marginTop: "1.25rem" }}>
            {cta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true"/>
          </Link>
        </div>

        {/* Image */}
        <div className="relative h-56 w-full">
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes="(min-width: 1024px) 160px, 40vw"
            className="object-contain object-bottom"
          />
          {note && (
            <p
              className={`absolute right-0 top-0 max-w-[6.5rem] -rotate-6 text-center text-base leading-tight sm:text-lg ${t.note}`}
              style={{ fontFamily: "var(--font-caveat), cursive" }}
            >
            </p>
          )}
        </div>
      </div>
    </article>
  );
}