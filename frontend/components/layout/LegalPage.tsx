import type { ReactNode } from "react";
import PageHero from "./PageHero";

/** Shared layout for Terms / Privacy: compact banner + readable article card. */
export default function LegalPage({
  eyebrow,
  title,
  description,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageHero compact eyebrow={eyebrow} title={title} description={description} />
      <div className="bg-[#F7F8FC] px-4 pb-20 pt-10 sm:px-8 sm:pb-28 sm:pt-14">
        <article className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,27,61,0.04),0_24px_50px_-34px_rgba(15,27,61,0.3)] sm:p-10 [&_h2]:mt-9 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-[#0F1B3D] [&_h2:first-child]:mt-0 [&_li]:mt-2 [&_p]:mt-3 [&_p]:leading-7 [&_p]:text-slate-600 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-slate-600 [&_a]:font-semibold [&_a]:text-violet-600 [&_a:hover]:underline">
          {updated ? <p className="!mt-0 mb-6 text-xs font-medium text-slate-400">{updated}</p> : null}
          {children}
        </article>
      </div>
    </>
  );
}
