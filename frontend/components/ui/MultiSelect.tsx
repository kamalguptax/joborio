"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

export type MultiSelectOption = {
  value: string;
  label: string;
};

type Props = {
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  emptyLabel?: string;
  className?: string;
  /** Allow typing a custom value (Select2 tagging). */
  allowCreate?: boolean;
  createLabel?: (query: string) => string;
  invalid?: boolean;
};

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  disabled = false,
  emptyLabel = "No options found",
  className = "",
  allowCreate = false,
  createLabel = (q) => `Add “${q}”`,
  invalid = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const mergedOptions = useMemo(() => {
    const map = new Map(options.map((o) => [o.value.toLowerCase(), o]));
    for (const v of value) {
      const key = v.toLowerCase();
      if (!map.has(key)) map.set(key, { value: v, label: v });
    }
    return [...map.values()];
  }, [options, value]);

  const selected = useMemo(() => {
    const map = new Map(mergedOptions.map((o) => [o.value.toLowerCase(), o]));
    return value
      .map((v) => map.get(v.toLowerCase()))
      .filter((o): o is MultiSelectOption => Boolean(o));
  }, [mergedOptions, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mergedOptions;
    return mergedOptions.filter((o) => o.label.toLowerCase().includes(q));
  }, [mergedOptions, query]);

  const canCreate = useMemo(() => {
    if (!allowCreate) return false;
    const q = query.trim();
    if (!q) return false;
    return !mergedOptions.some((o) => o.label.toLowerCase() === q.toLowerCase());
  }, [allowCreate, mergedOptions, query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  function toggle(val: string) {
    const exists = value.some((v) => v.toLowerCase() === val.toLowerCase());
    if (exists) {
      onChange(value.filter((v) => v.toLowerCase() !== val.toLowerCase()));
    } else {
      onChange([...value, val]);
    }
  }

  function remove(val: string) {
    onChange(value.filter((v) => v.toLowerCase() !== val.toLowerCase()));
  }

  function createFromQuery() {
    const q = query.trim();
    if (!q || !canCreate) return;
    onChange([...value, q]);
    setQuery("");
  }

  return (
    <div ref={rootRef} className={`relative mt-1.5 ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-invalid={invalid}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
        }}
        className={`flex min-h-11 w-full items-start gap-2 rounded-lg border bg-white px-3 py-2 text-left text-sm text-[#0F1B3D] transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
          invalid
            ? "border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-500/15"
            : "border-slate-200 focus:border-violet-500 focus:ring-violet-500/15"
        }`}
      >
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {selected.length === 0 ? (
            <span className="py-1 text-slate-400">{placeholder}</span>
          ) : (
            selected.map((item) => (
              <span
                key={item.value}
                className="inline-flex max-w-full items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700"
              >
                <span className="truncate">{item.label}</span>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${item.label}`}
                  className="rounded-full p-0.5 hover:bg-violet-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(item.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      remove(item.value);
                    }
                  }}
                >
                  <X size={12} />
                </span>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          size={18}
          className={`mt-1.5 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <Search size={16} className="shrink-0 text-slate-400" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (canCreate) createFromQuery();
                  else if (filtered[0]) toggle(filtered[0].value);
                }
              }}
              placeholder={searchPlaceholder}
              className="h-9 w-full bg-transparent text-sm text-[#0F1B3D] outline-none placeholder:text-slate-400"
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            aria-multiselectable="true"
            className="max-h-56 overflow-y-auto py-1"
          >
            {canCreate ? (
              <li>
                <button
                  type="button"
                  onClick={createFromQuery}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-violet-700 hover:bg-violet-50"
                >
                  {createLabel(query.trim())}
                </button>
              </li>
            ) : null}
            {filtered.length === 0 && !canCreate ? (
              <li className="px-3 py-3 text-sm text-slate-400">{emptyLabel}</li>
            ) : (
              filtered.map((opt) => {
                const active = value.some(
                  (v) => v.toLowerCase() === opt.value.toLowerCase(),
                );
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => toggle(opt.value)}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition ${
                        active
                          ? "bg-violet-50 font-semibold text-violet-800"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {active ? <Check size={16} className="shrink-0" /> : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          {selected.length > 0 ? (
            <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
              <span>{selected.length} selected</span>
              <button
                type="button"
                className="font-semibold text-violet-600 hover:text-violet-800"
                onClick={() => onChange([])}
              >
                Clear all
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
