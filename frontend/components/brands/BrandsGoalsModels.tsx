import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { BRAND_MODELS } from "@/components/brands/brandModels";

const goals = [
  "Traffic Acquisition",
  "User Acquisition",
  "Lead Generation",
  "Job Applications",
  "Course Enrolments",
  "Product Adoption",
  "Engagement",
];

function GrowthChart() {
  return (
    <svg viewBox="0 0 160 130" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="goalBar" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#0A4AA8" />
          <stop offset="1" stopColor="#1F73E6" />
        </linearGradient>
      </defs>
      <rect x="14" y="88" width="26" height="34" rx="5" fill="url(#goalBar)" />
      <rect x="50" y="68" width="26" height="54" rx="5" fill="url(#goalBar)" />
      <rect x="86" y="48" width="26" height="74" rx="5" fill="url(#goalBar)" />
      <rect x="122" y="30" width="26" height="92" rx="5" fill="url(#goalBar)" />
      <path d="M12 74 C46 62 70 50 104 30 L138 8" stroke="#1F73E6" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M122 7 L140 7 L140 25" stroke="#1F73E6" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export default function BrandsGoalsModels() {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 pb-14 sm:px-8 md:pb-20">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* What can you achieve */}
        <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50/90 to-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight text-[#0A2150] sm:text-3xl">What Can You Achieve?</h2>
          <p className="mt-2 text-slate-600">Choose your campaign objective based on your goals.</p>
          <div className="mt-6 grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_9rem]">
            <ul className="grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
              {goals.map((g) => (
                <li key={g} className="flex items-center gap-2.5 text-[15px] font-medium text-[#1F2A55]">
                  <CheckCircle2 size={20} className="shrink-0 fill-violet-600 text-white" aria-hidden="true" />
                  {g}
                </li>
              ))}
            </ul>
            <div className="mx-auto hidden h-32 w-36 sm:block">
              <GrowthChart />
            </div>
          </div>
        </div>

        {/* Flexible campaign models */}
        <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50/90 to-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight text-[#0A2150] sm:text-3xl">Flexible Campaign Models</h2>
          <p className="mt-2 text-slate-600">Select the payment model that fits your objective.</p>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {BRAND_MODELS.map(({ code, label, icon: Icon, tile, iconTone }) => (
              <li key={code}>
                <Link
                  href={`#campaign-planner`}
                  className={`flex h-full flex-col items-center rounded-2xl border px-2 py-4 text-center transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_30px_-20px_rgba(10,95,207,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 ${tile}`}
                >
                  <Icon size={26} className={iconTone} aria-hidden="true" />
                  <span className="mt-2 text-base font-bold text-[#0A2150]">{code}</span>
                  <span className="mt-0.5 text-[11px] leading-tight text-slate-500">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500">Tap a model to see which one fits your goal.</p>
        </div>
      </div>
    </section>
  );
}
