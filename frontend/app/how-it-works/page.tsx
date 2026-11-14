import Link from "next/link";

export default function HowItWorksPage() {
  const steps = [
    {
      n: "01",
      title: "Claim your handle",
      text: "Sign up with email or Google, pick @yourname, and select your niche and audience countries.",
    },
    {
      n: "02",
      title: "Share tracked links",
      text: "Copy JobOrio tracking URLs for jobs and courses — not raw employer links — so clicks count.",
    },
    {
      n: "03",
      title: "Earn in USD",
      text: "PPC on verified clicks, PPR on verified signups. Earnings move pending → approved → payout.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#081638] pb-24 pt-32 text-white">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <p className="text-sm font-bold uppercase tracking-widest text-purple-300">
          How it works
        </p>
        <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
          One link. Verified performance. USD payouts.
        </h1>
        <div className="mt-14 space-y-8">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur"
            >
              <span className="text-sm font-bold text-purple-300">{s.n}</span>
              <h2 className="mt-2 text-2xl font-bold">{s.title}</h2>
              <p className="mt-3 text-white/70">{s.text}</p>
            </div>
          ))}
        </div>
        <Link
          href="/signup"
          className="mt-12 inline-block rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 font-bold"
        >
          Start as a creator
        </Link>
      </div>
    </main>
  );
}
