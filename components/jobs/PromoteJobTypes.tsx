"use client";

import { PROMOTE_JOB_TYPES } from "@/lib/jobs/promoteTypes";

export default function PromoteJobTypes({
  selected,
  onToggle,
  legend = "Which type of job do you promote?",
}: {
  selected: string[];
  onToggle: (id: string) => void;
  legend?: string;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-[#0F1B3D]">{legend}</legend>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {PROMOTE_JOB_TYPES.map((type) => {
          const on = selected.includes(type.id);
          return (
            <button
              key={type.id}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(type.id)}
              className={`rounded-full border px-4 py-2 text-[13px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 ${
                on
                  ? "border-violet-600 bg-violet-600 text-white shadow-sm shadow-violet-600/30"
                  : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700"
              }`}
            >
              {type.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
