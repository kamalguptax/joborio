import { BarChart3, ChevronRight, Megaphone, Settings2, UserPlus, Users, type LucideIcon } from "lucide-react";

const steps: { title: string; note: string; icon: LucideIcon }[] = [
  { title: "Create Your Brand Account", note: "Register and verify your work email.", icon: UserPlus },
  { title: "Share Your Campaign Needs", note: "Pick your goal, pricing model and reward.", icon: Settings2 },
  { title: "Get Matched with Creators & Publishers", note: "Relevant audiences share your tracked link.", icon: Users },
  { title: "Track Performance", note: "Clicks, sign-ups and spend by creator.", icon: Megaphone },
  { title: "Optimise & Grow", note: "Pause, scale or top up whenever you like.", icon: BarChart3 },
];

export default function BrandsHowItWorks() {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 pb-14 sm:px-8 md:pb-20">
      <div className="rounded-3xl border border-violet-100 bg-gradient-to-b from-violet-50/80 to-white px-5 py-8 shadow-sm sm:px-8 sm:py-10">
        <h2 className="text-center text-2xl font-bold tracking-tight text-[#0A2150] sm:text-3xl">How Upclift Works</h2>

        <ol className="mt-8 grid gap-6 md:grid-cols-5 md:gap-0">
          {steps.map(({ title, note, icon: Icon }, i) => (
            <li key={title} className="relative flex items-start gap-4 md:flex-col md:items-center md:px-3 md:text-center">
              <span className="relative shrink-0">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm ring-1 ring-violet-100">
                  <Icon size={26} aria-hidden="true" />
                </span>
                <span className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#0A4AA8] text-xs font-bold text-white ring-2 ring-white">
                  {i + 1}
                </span>
              </span>
              <span className="min-w-0 md:mt-4">
                <span className="block text-[15px] font-semibold leading-snug text-[#0A2150]">{title}</span>
                <span className="mt-1 block text-[13px] leading-snug text-slate-500">{note}</span>
              </span>
              {i < steps.length - 1 ? (
                <ChevronRight
                  aria-hidden="true"
                  size={22}
                  className="absolute -right-3 top-4 hidden text-violet-400 md:block"
                />
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
