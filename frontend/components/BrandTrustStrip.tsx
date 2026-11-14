const brands = [
  "whatjobs",
  "Jobrapido",
  "udemy",
  "coursera",
  "Google",
  "Microsoft",
];

export default function BrandTrustStrip() {
  return (
    <section className="border-t border-slate-100 bg-white py-10 sm:py-12">
      <div className="mx-auto max-w-[1460px] px-5 sm:px-8">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
          Trusted by
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:gap-x-10">
          {brands.map((name) => (
            <li
              key={name}
              className="text-lg font-bold tracking-tight text-slate-400/90 sm:text-xl"
            >
              {name}
            </li>
          ))}
        </ul>
        <p className="font-hand mt-6 text-right text-lg text-[#7030A0] sm:mt-8 sm:text-2xl">
          Real Opportunities. Real People. Real Impact. ↗
        </p>
      </div>
    </section>
  );
}
