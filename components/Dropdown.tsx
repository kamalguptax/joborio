"use client";
// components/Dropdown.tsx
// Reusable custom dropdown | Next.js + Tailwind CSS | npm i lucide-react
//
// <Dropdown
//   label="Main Niche"
//   value={niche}
//   onChange={setNiche}
//   options={[{ value: "tech", label: "Technology" }, ...]}
// />

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface DropdownOption<T extends string | number> {
  value: T;
  label: string;
}

interface DropdownProps<T extends string | number> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  className?: string;
}

export default function Dropdown<T extends string | number>({
  label,
  value,
  onChange,
  options,
  className = "",
}: DropdownProps<T>) {
  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = options[selectedIndex];

  // Bahar click karne par band
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Keyboard se chalte waqt active option dikhta rahe
  useEffect(() => {
    if (open) {
      (listRef.current?.children[active] as HTMLElement | undefined)?.scrollIntoView({
        block: "nearest",
      });
    }
  }, [open, active]);

  const openMenu = () => {
    setActive(Math.max(selectedIndex, 0));
    setOpen(true);
  };

  const choose = (i: number) => {
    onChange(options[i].value);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (open) setActive((i) => Math.min(i + 1, options.length - 1));
        else openMenu();
        break;
      case "ArrowUp":
        e.preventDefault();
        if (open) setActive((i) => Math.max(i - 1, 0));
        else openMenu();
        break;
      case "Home":
        if (open) {
          e.preventDefault();
          setActive(0);
        }
        break;
      case "End":
        if (open) {
          e.preventDefault();
          setActive(options.length - 1);
        }
        break;
      case "Enter":
      case " ":
        if (open) {
          e.preventDefault();
          choose(active);
        }
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={wrapRef} className={`relative ${open ? "z-30" : "z-0"} ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        aria-labelledby={`${id}-label ${id}-value`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center justify-between gap-2 rounded-xl bg-white px-4 pb-2 pt-2.5 text-left shadow-sm transition focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-400/50 ${
          open ? "ring-4 ring-violet-400/50" : "hover:bg-violet-50/60"
        }`}
      >
        <span className="min-w-0">
          <span id={`${id}-label`} className="block text-xs font-medium text-slate-500">
            {label}
          </span>
          <span
            id={`${id}-value`}
            className="block truncate text-base font-semibold text-indigo-950"
          >
            {selected?.label}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-indigo-950 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Panel */}
      <ul
        ref={listRef}
        id={`${id}-list`}
        role="listbox"
        aria-label={label}
        className={`absolute left-0 right-0 top-full mt-2 max-h-60 origin-top overflow-auto rounded-xl bg-white p-1.5 shadow-2xl shadow-indigo-950/30 ring-1 ring-slate-900/5 transition duration-150 ${
          open
            ? "visible scale-100 opacity-100"
            : "pointer-events-none invisible scale-95 opacity-0"
        }`}
      >
        {options.map((o, i) => {
          const isSelected = i === selectedIndex;
          return (
            <li
              key={o.value}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={isSelected}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(i)}
              className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
                isSelected ? "font-semibold text-violet-700" : "text-slate-700"
              } ${i === active ? "bg-violet-50" : ""}`}
            >
              <span className="truncate">{o.label}</span>
              {isSelected && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}