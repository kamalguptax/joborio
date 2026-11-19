"use client";

import { useMemo, useState } from "react";
import MultiSelect from "@/components/ui/MultiSelect";

export type NicheOption = { id: number; name: string; group_name?: string | null };

export default function NicheSearch({
  niches,
  selectedIds,
  onToggle,
  onChange,
  heading = "Select your skills",
}: {
  niches: NicheOption[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  /** Optional bulk setter (Select2-style). Falls back to onToggle per id. */
  onChange?: (ids: number[]) => void;
  heading?: string;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const options = useMemo(
    () =>
      niches.map((n) => ({
        value: String(n.id),
        label: n.group_name?.trim()
          ? `${n.name} · ${n.group_name.trim()}`
          : n.name,
      })),
    [niches],
  );

  const selectedValues = useMemo(
    () => selectedIds.map(String),
    [selectedIds],
  );

  const setFromSelect = (next: string[]) => {
    const ids = next.map((v) => Number(v)).filter((n) => Number.isFinite(n));
    if (onChange) {
      onChange(ids);
      return;
    }
    const prev = new Set(selectedIds);
    const nextSet = new Set(ids);
    for (const id of prev) {
      if (!nextSet.has(id)) onToggle(id);
    }
    for (const id of nextSet) {
      if (!prev.has(id)) onToggle(id);
    }
  };

  const visible = useMemo(
    () => niches.filter((niche) => !q || niche.name.toLowerCase().includes(q)),
    [niches, q],
  );
  const groups = useMemo(() => {
    const map = new Map<string, NicheOption[]>();
    for (const niche of visible) {
      const key = niche.group_name?.trim() || "More skills";
      const list = map.get(key) ?? [];
      list.push(niche);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [visible]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-700">{heading}</p>
        <p className="text-xs text-slate-400">
          {selectedIds.length} selected · {niches.length} skills
        </p>
      </div>

      <MultiSelect
        options={options}
        value={selectedValues}
        onChange={setFromSelect}
        placeholder="Search and select skills…"
        searchPlaceholder="Type to search skills…"
        emptyLabel="No skills match that search."
        className="mt-2"
      />

      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Or browse by category
      </p>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filter categories below"
        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
      />
      <div className="mt-4 space-y-6">
        {groups.length === 0 ? (
          <p className="text-sm text-slate-500">No skills match that search.</p>
        ) : (
          groups.map(([group, items]) => (
            <div key={group}>
              <p className="text-sm font-semibold text-slate-800">{group}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {items.map((niche) => {
                  const on = selectedIds.includes(niche.id);
                  return (
                    <button
                      key={niche.id}
                      type="button"
                      onClick={() => onToggle(niche.id)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium ${
                        on
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-400"
                      }`}
                    >
                      {niche.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
