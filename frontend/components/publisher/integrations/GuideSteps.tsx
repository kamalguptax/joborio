type Step = {
  title: string;
  body: string;
};

export default function GuideSteps({
  title,
  intro,
  steps,
}: {
  title: string;
  intro: string;
  steps: Step[];
}) {
  return (
    <section className="mb-6 rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
        Integration guide
      </p>
      <h2 className="mt-1 text-xl font-bold text-[#172b63]">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{intro}</p>
      <ol className="mt-5 space-y-3">
        {steps.map((step, i) => (
          <li
            key={step.title}
            className="flex gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-bold text-[#172b63]">{step.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
