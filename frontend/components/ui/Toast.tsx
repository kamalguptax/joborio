"use client";

import { useSyncExternalStore } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export type ToastKind = "success" | "error" | "info";

type ToastItem = {
  id: number;
  kind: ToastKind;
  message: string;
};

/* ---------- tiny global store (callable from anywhere, no provider needed) ---------- */

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();
const EMPTY: ToastItem[] = [];

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function dismiss(id: number) {
  const t = timers.get(id);
  if (t) clearTimeout(t);
  timers.delete(id);
  items = items.filter((i) => i.id !== id);
  emit();
}

function push(kind: ToastKind, message: string, duration?: number) {
  if (typeof window === "undefined" || !message) return;
  // Don't stack identical messages — refresh the existing one instead.
  const dup = items.find((i) => i.kind === kind && i.message === message);
  if (dup) dismiss(dup.id);

  const id = nextId++;
  items = [...items, { id, kind, message }].slice(-4);
  emit();
  timers.set(
    id,
    setTimeout(() => dismiss(id), duration ?? (kind === "error" ? 6000 : 4000)),
  );
}

export const toast = {
  success: (message: string, duration?: number) => push("success", message, duration),
  error: (message: string, duration?: number) => push("error", message, duration),
  info: (message: string, duration?: number) => push("info", message, duration),
  dismiss,
};

/* ---------- UI ---------- */

const styles: Record<ToastKind, { ring: string; icon: string; Icon: typeof Info }> = {
  success: { ring: "border-emerald-200", icon: "text-emerald-600", Icon: CheckCircle2 },
  error: { ring: "border-red-200", icon: "text-red-600", Icon: AlertCircle },
  info: { ring: "border-violet-200", icon: "text-violet-600", Icon: Info },
};

/** Render once per app shell. Shows toasts in the top-right corner. */
export function Toaster() {
  const list = useSyncExternalStore(
    subscribe,
    () => items,
    () => EMPTY,
  );

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 sm:right-6 sm:top-6"
    >
      {list.map((t) => {
        const s = styles[t.kind];
        const Icon = s.Icon;
        return (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={`toast-in pointer-events-auto flex items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg shadow-slate-900/10 ${s.ring}`}
          >
            <Icon size={18} aria-hidden="true" className={`mt-0.5 shrink-0 ${s.icon}`} />
            <p className="min-w-0 flex-1 text-sm font-medium text-[#0A2150]">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="shrink-0 rounded p-0.5 text-slate-400 transition hover:text-slate-700"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default Toaster;
