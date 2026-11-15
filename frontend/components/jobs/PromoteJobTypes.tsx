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
      <legend className="text-[13px] font-semibold text-[#26385D]">{legend}</legend>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {PROMOTE_JOB_TYPES.map((type) => {
          const on = selected.includes(type.id);
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onToggle(type.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                on
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-violet-300"
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
