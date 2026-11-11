// components/StatsBar.jsx
// Next.js (App/Pages Router) + Tailwind CSS
// Install icons: npm i lucide-react

import {
  Users,
  Megaphone,
  Briefcase,
  BadgeCheck,
  IndianRupee,
} from "lucide-react";

const stats = [
  { icon: Users, value: "12,500+", label: "Active Creators" },
  { icon: Megaphone, value: "3.8M+", label: "Monthly Reach" },
  { icon: Briefcase, value: "250+", label: "Job & Campaign Partners" },
  { icon: BadgeCheck, value: "98%", label: "Verified Opportunities" },
  { icon: IndianRupee, value: "₹1.8L+", label: "Total Creator Payouts" },
];

export default function StatsBar() {
  return (
    <section aria-label="Platform statistics" className="w-full py-8 bg-white">
      <div className="mx-auto max-w-[1460px] rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/80 py-5 px-4 shadow-[0_8px_30px_rgba(79,70,229,0.08)] sm:px-6">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 lg:gap-0">
          {stats.map(({ icon: Icon, value, label }, i) => (
            <div
              key={label}
              className={`flex items-center gap-3 lg:justify-center lg:px-4 ${
                i !== 0 ? "lg:border-l lg:border-indigo-100" : ""
              } ${i === stats.length - 1 ? "col-span-2 justify-center sm:col-span-1" : ""}`}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100/70 text-indigo-700 ring-1 ring-indigo-200/60">
                <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
              </span>

              <div className="min-w-0">
                <dd className="text-xl font-bold tracking-tight text-indigo-700 sm:text-2xl">
                  {value}
                </dd>
                <dt className="text-xs font-medium text-slate-600 sm:text-sm">
                  {label}
                </dt>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

// Usage (app/page.jsx):
//   import StatsBar from "@/components/StatsBar";
//   export default function Home() { return <StatsBar />; }