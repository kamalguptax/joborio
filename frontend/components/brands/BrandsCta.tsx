import Link from "next/link";
import { Rocket } from "lucide-react";

export default function BrandsCta() {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 pb-14 sm:px-8 md:pb-20">
      <div
        className="relative overflow-hidden rounded-3xl px-6 py-8 text-white shadow-[0_30px_60px_-34px_rgba(27,16,85,0.9)] sm:px-10 sm:py-10"
        style={{ backgroundImage: "linear-gradient(135deg, #1B1055 0%, #241476 60%, #2E1A8C 100%)" }}
      >
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-orange-300 ring-1 ring-white/15">
              <Rocket size={28} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Your audience is waiting. Let&apos;s reach them.</h2>
              <p className="mt-1.5 text-[15px] text-indigo-100/85">
                Launch measurable campaigns and connect with relevant audiences through JobOrio.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/brand/register"
              className="inline-flex min-h-12 items-center rounded-full bg-white px-7 py-3 text-base font-semibold text-[#2E1A8C] transition hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Create Brand Account
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center rounded-full border-2 border-white/70 px-7 py-3 text-base font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Talk to Our Team
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
