import Link from "next/link";

/** Brand gradient kept inline so the band never depends on a generated class. */
const BAND_BG =
  "linear-gradient(135deg, #0B1D4F 0%, #14296B 42%, #3F2AA8 100%)";

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/** Decorative product preview: one link, tracked clicks, verified earnings. */
function LinkPreview() {
  const stats = [
    { label: "Clicks", value: "2.4k" },
    { label: "Sign-ups", value: "86" },
    { label: "Earned", value: "$145" },
  ];
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-[400px] lg:mx-0 lg:justify-self-end">
      {/* soft halo behind the card */}
      <div className="absolute -inset-6 rounded-[40px] bg-violet-400/20 blur-3xl" />

      <div className="relative rounded-3xl border border-white/15 bg-white/10 p-4 shadow-[0_30px_60px_-30px_rgba(5,10,40,0.8)] backdrop-blur-md transition duration-300 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-5 lg:-rotate-2 lg:hover:rotate-0">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200">Your link</p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[#0B1D4F]">
              <CheckIcon />
            </span>
            Verified
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-slate-900 shadow-sm">
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <LinkIcon />
            </span>
            <span className="truncate text-sm font-semibold">joborio.link/you</span>
          </span>
          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Copy</span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/10 px-3 py-3 text-center ring-1 ring-white/10">
              <p className="text-lg font-semibold leading-none text-white">{s.value}</p>
              <p className="mt-1.5 text-[11px] text-indigo-200">{s.label}</p>
            </div>
          ))}
        </div>

        <p className="mt-3 text-center text-[11px] text-indigo-200/80">Example numbers</p>
      </div>
    </div>
  );
}

/** Closing call-to-action band shared by marketing pages. */
export default function CtaBand({
  title,
  text,
  label,
  href,
}: {
  title: string;
  text: string;
  label: string;
  href: string;
}) {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-4 pb-16 sm:px-8 md:pb-24 lg:px-10">
      <div
        className="relative isolate overflow-hidden rounded-[28px] px-6 py-12 text-white sm:rounded-[44px] sm:px-12 sm:py-16 lg:px-16 lg:py-20"
        style={{ backgroundImage: BAND_BG, backgroundColor: "#14296B" }}
      >
        {/* Background depth */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-[#2563EB]/30 blur-[100px]" />
          <div className="absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-violet-500/35 blur-[110px]" />
          <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:radial-gradient(ellipse_at_30%_50%,black,transparent_75%)]" />
          <div className="absolute -right-24 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full border border-white/10" />
          <div className="absolute -right-4 top-1/2 h-[260px] w-[260px] -translate-y-1/2 rounded-full border border-white/10" />
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div className="min-w-0">
            <h2 className="max-w-2xl text-balance text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
              {title}
            </h2>
            <p className="mt-4 max-w-xl text-pretty text-base leading-7 text-indigo-100/90 sm:text-lg sm:leading-8">
              {text}
            </p>

            <Link
              href={href}
              className="btn-tap group mt-8 inline-flex h-14 w-full items-center justify-between gap-4 rounded-full bg-white py-2 pl-7 pr-2 text-[15px] font-semibold text-slate-900 shadow-[0_18px_40px_-18px_rgba(255,255,255,0.45)] transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:w-auto sm:min-w-[220px]"
            >
              {label}
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
                style={{ backgroundImage: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
              >
                <svg
                  className="h-4 w-4"
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
              </span>
            </Link>
          </div>

          <LinkPreview />
        </div>
      </div>
    </section>
  );
}