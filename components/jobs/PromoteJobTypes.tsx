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
      <div className="mt-2 flex flex-wrap gap-2">
        {PROMOTE_JOB_TYPES.map((type) => {
          const on = selected.includes(type.id);
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onToggle(type.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                on
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600"
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
