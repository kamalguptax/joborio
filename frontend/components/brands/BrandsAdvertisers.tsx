import { Briefcase, Cpu, GraduationCap, LayoutGrid, Trophy, Users, type LucideIcon } from "lucide-react";

const audiences: { label: string; icon: LucideIcon; goal: string; model: string; tone: string }[] = [
  { label: "Recruitment & Job Platforms", icon: Briefcase, goal: "Applications", model: "PPA", tone: "bg-indigo-50 text-indigo-600" },
  { label: "Online Courses & Certifications", icon: GraduationCap, goal: "Enrolments", model: "PPR", tone: "bg-sky-50 text-sky-600" },
  { label: "Bootcamps & Training", icon: Users, goal: "Sign-ups", model: "PPR", tone: "bg-violet-50 text-violet-600" },
  { label: "Hackathons & Competitions", icon: Trophy, goal: "Registrations", model: "PPR", tone: "bg-amber-50 text-amber-600" },
  { label: "AI Tools & SaaS Companies", icon: Cpu, goal: "Leads", model: "PPL", tone: "bg-blue-50 text-blue-600" },
  { label: "Other Businesses", icon: LayoutGrid, goal: "Clicks or actions", model: "Any", tone: "bg-rose-50 text-rose-500" },
];

export default function BrandsAdvertisers() {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 py-14 sm:px-8 md:py-20">
      <div className="text-center">
        <h2 className="text-[clamp(1.6rem,1.1rem+1.8vw,2.4rem)] font-bold tracking-tight text-[#0F1B3D]">
          Who Can Advertise on JobOrio?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 sm:text-lg">
          Whether you are looking for job applicants, students or customers, JobOrio helps you reach the right audience.
        </p>
      </div>

      <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
        {audiences.map(({ label, icon: Icon, goal, model, tone }) => (
          <li
            key={label}
            className="group flex flex-col items-center rounded-3xl border border-violet-100 bg-gradient-to-b from-white to-violet-50/50 px-3 py-6 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:border-violet-300 hover:shadow-[0_22px_40px_-26px_rgba(91,53,213,0.5)] sm:px-4"
          >
            <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tone}`}>
              <Icon size={26} aria-hidden="true" />
            </span>
            <p className="mt-4 text-[15px] font-semibold leading-snug text-[#0F1B3D]">{label}</p>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
              {goal}
              <span className="text-violet-600">· {model}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
