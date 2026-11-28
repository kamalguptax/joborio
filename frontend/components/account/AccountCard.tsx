"use client";

import type { ReactNode } from "react";
import { Pencil, X } from "lucide-react";

/** White card with a title row and an optional pencil (edit) button. */
export function Card({
  title,
  badge,
  editing,
  onEdit,
  children,
}: {
  title: string;
  /** Small pill shown next to the title (e.g. "Saved"). */
  badge?: ReactNode;
  editing?: boolean;
  onEdit?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <h2 className="flex min-w-0 items-center gap-2 text-lg font-bold text-[#0A2150]">
          <span className="truncate">{title}</span>
          {badge}
        </h2>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            aria-label={editing ? `Cancel editing ${title}` : `Edit ${title}`}
            title={editing ? "Cancel" : "Edit"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-violet-50 hover:text-violet-700"
          >
            {editing ? <X size={16} aria-hidden="true" /> : <Pencil size={16} aria-hidden="true" />}
          </button>
        ) : null}
      </div>
      <div className="pt-4">{children}</div>
    </section>
  );
}

export function Field({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-line break-words text-[15px] font-semibold text-[#0A2150]">
        {value || <span className="font-normal text-slate-400">Not added</span>}
      </dd>
    </div>
  );
}
