import Link from "next/link";
import {
  ArrowRight,
  Award,
  BarChart3,
  Briefcase,
  Building2,
  Check,
  Cpu,
  GraduationCap,
  Handshake,
  Heart,
  LayoutGrid,
  Megaphone,
  MousePointerClick,
  Rocket,
  Settings2,
  Target,
  Trophy,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";

const audiences = [
  { label: "Recruitment & Job Platforms", icon: Briefcase },
  { label: "Online Courses & Certifications", icon: GraduationCap },
  { label: "Bootcamps & Training", icon: Users },
  { label: "Hackathons & Competitions", icon: Trophy },
  { label: "AI Tools & SaaS Companies", icon: Cpu },
  { label: "Other Businesses", icon: LayoutGrid },
] as const;

const outcomes = [
  "Traffic Acquisition",
  "User Acquisition",
  "Lead Generation",
  "Job Applications",
  "Course Enrolments",
  "Product Adoption",
  "Engagement",
] as const;

const models = [
  { code: "PPC", label: "Pay Per Click", icon: MousePointerClick, tone: "bg-sky-50 text-sky-700" },
  { code: "PPR", label: "Pay Per Registration", icon: UserPlus, tone: "bg-blue-50 text-blue-700" },
  { code: "PPL", label: "Pay Per Lead", icon: Handshake, tone: "bg-violet-50 text-violet-700" },
  { code: "PPA", label: "Pay Per Action", icon: Zap, tone: "bg-amber-50 text-amber-700" },
  { code: "PPE", label: "Pay Per Engagement", icon: Heart, tone: "bg-rose-50 text-rose-700" },
] as const;

const steps = [
  { title: "Create Your Brand Account", icon: UserPlus },
  { title: "Share Your Campaign Needs", icon: Settings2 },
  { title: "Get Matched with Creators & Publishers", icon: Users },
  { title: "Track Performance", icon: Megaphone },
  { title: "Optimise & Grow", icon: BarChart3 },
] as const;

const why = [
  "Relevant Creator & Publisher Networks",
  "Performance-Based Campaigns",
  "Audience-Based Targeting",
  "Centralised Reporting",
  "Transparent Tracking Links",
  "Pay Only for Verified Outcomes",
  "Duplicate & Fraud Controls",
  "Pause or Scale Anytime",
] as const;

type Props = {
  /** Compact for dashboard / register side panel. */
  compact?: boolean;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
};

export default function EmployerAwareness({
  compact = false,
  primaryHref = "/brand/register",
  primaryLabel = "Create Brand Account",
  secondaryHref = "/contact",
  secondaryLabel = "Talk to Our Team",
  className = "",
}: Props) {
  return (
    <div className={`text-[#172b63] ${className}`}>
      <section className={compact ? "mb-8" : "mb-14"}>
        <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-violet-600">
          Who can advertise on Upclift?
        </p>
        <h2
          className={`mt-2 text-center font-bold tracking-tight ${
            compact ? "text-xl" : "text-2xl sm:text-3xl"
          }`}
        >
          Built for brands that need measurable reach
        </h2>
        <ul
          className={`mt-6 grid gap-3 ${
            compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {audiences.map(({ label, icon: Icon }) => (
            <li
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <Icon size={18} />
              </span>
              <span className="text-sm font-semibold leading-snug">{label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        className={`grid gap-4 ${compact ? "mb-8" : "mb-14 lg:grid-cols-2"}`}
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
                Outcomes
              </p>
              <h3 className="mt-1 text-lg font-bold">What can you achieve?</h3>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <BarChart3 size={20} />
            </span>
          </div>
          <ul className="mt-5 space-y-2.5">
            {outcomes.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700">
                <Check size={16} className="shrink-0 text-violet-600" />
                <span className="font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
            Pricing models
          </p>
          <h3 className="mt-1 text-lg font-bold">Flexible campaign models</h3>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {models.map(({ code, label, icon: Icon, tone }) => (
              <li
                key={code}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}
                >
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-bold">{code}</span>
                  <span className="block text-xs text-slate-500">{label}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {!compact ? (
        <section className="mb-14">
          <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-violet-600">
            How Upclift works
          </p>
          <h2 className="mt-2 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            From brand account to measurable growth
          </h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map(({ title, icon: Icon }, index) => (
              <li
                key={title}
                className="relative rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm"
              >
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  <Icon size={20} />
                </span>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-violet-600">
                  Step {index + 1}
                </p>
                <p className="mt-1 text-sm font-semibold leading-snug">{title}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section
        className={`grid gap-4 ${compact ? "mb-8" : "mb-14 lg:grid-cols-2"}`}
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
                Why Upclift
              </p>
              <h3 className="mt-1 text-lg font-bold">Why choose Upclift?</h3>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <Target size={20} />
            </span>
          </div>
          <ul className="mt-5 space-y-2.5">
            {(compact ? why.slice(0, 5) : why).map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700">
                <Check size={16} className="shrink-0 text-violet-600" />
                <span className="font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col justify-between rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-white shadow-sm">
          <div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
              <Building2 size={20} />
            </span>
            <h3 className="mt-4 text-xl font-bold">Get in touch</h3>
            <p className="mt-2 text-sm leading-relaxed text-violet-100">
              Tell us your hiring, course, or product goal. We&apos;ll propose a
              performance campaign matched to creators and publishers.
            </p>
          </div>
          <Link
            href={secondaryHref}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-violet-700 transition hover:bg-violet-50"
          >
            Request a Campaign Proposal
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.75rem] bg-[linear-gradient(135deg,#1e1b4b_0%,#4c1d95_55%,#6d28d9_100%)] px-6 py-8 text-white sm:px-10 sm:py-10">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Rocket size={22} />
            </span>
            <div>
              <p className="text-xl font-bold tracking-tight sm:text-2xl">
                Your audience is waiting. Let&apos;s reach them.
              </p>
              <p className="mt-1 text-sm text-violet-100">
                Launch PPC, PPR, PPA or PPE campaigns with tracked creator reach.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={primaryHref}
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-bold text-violet-800"
            >
              {primaryLabel}
            </Link>
            <Link
              href={secondaryHref}
              className="inline-flex items-center justify-center rounded-full border border-white/40 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10"
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </section>

      {!compact ? (
        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
          <Award size={14} className="text-violet-600" />
          Performance marketing through creators & publishers — pay for outcomes,
          not vanity metrics.
        </p>
      ) : null}
    </div>
  );
}
