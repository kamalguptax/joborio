import {
  BadgeCheck,
  ClipboardCheck,
  Copy,
  Megaphone,
  Wallet,
  Shield,
  type LucideIcon,
} from "lucide-react";

const items: { title: string; text: string; icon: LucideIcon; tone: string }[] = [
  {
    title: "A tracked link for every creator",
    text: "Each creator and publisher gets a unique link, so every click, sign-up and action is traced to who drove it.",
    icon: Megaphone,
    tone: "bg-violet-50 text-violet-600",
  },
  {
    title: "Duplicate clicks filtered",
    text: "Repeat clicks are filtered out and suspicious traffic goes to a review queue before it counts.",
    icon: Copy,
    tone: "bg-sky-50 text-sky-600",
  },
  {
    title: "Verified before payout",
    text: "Registrations and actions are verified first. Rewards only become payable after verification.",
    icon: BadgeCheck,
    tone: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Review and dispute",
    text: "Confirm or dispute leads and actions from your dashboard, and approve engagement proof before you pay.",
    icon: ClipboardCheck,
    tone: "bg-amber-50 text-amber-600",
  },
  {
    title: "Budget in your control",
    text: "Fund your account, set the budget and reward, and pause or resume a campaign whenever you want.",
    icon: Wallet,
    tone: "bg-indigo-50 text-indigo-600",
  },
  {
    title: "Real creators, reviewed accounts",
    text: "Creator accounts are reviewed, and every brand account is verified with a work email.",
    icon: Shield,
    tone: "bg-rose-50 text-rose-500",
  },
];

export default function BrandsTrust() {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 py-14 sm:px-8 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex rounded-full bg-violet-100 px-4 py-1.5 text-sm font-semibold text-violet-700">
          Quality &amp; trust
        </span>
        <h2 className="mt-4 text-[clamp(1.6rem,1.1rem+1.8vw,2.4rem)] font-bold tracking-tight text-[#0F1B3D]">
          How we keep your results real
        </h2>
        <p className="mt-3 text-base text-slate-600 sm:text-lg">
          Performance marketing only works when you can trust the numbers. These controls are built into every
          campaign.
        </p>
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ title, text, icon: Icon, tone }) => (
          <li
            key={title}
            className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_22px_40px_-26px_rgba(91,53,213,0.45)]"
          >
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}>
              <Icon size={22} aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-[#0F1B3D]">{title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
