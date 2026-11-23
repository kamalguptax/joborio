"use client";

import { useCallback, useState } from "react";

/** Per-field error state for the auth forms. */
export function useFieldErrors<K extends string>() {
  const [errors, setErrors] = useState<Partial<Record<K, string>>>({});

  /** Remove one field's error (e.g. as soon as the user edits it). */
  const clear = useCallback((key: K) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  /** Set or remove one field's error (used for on-blur checks). */
  const setOne = useCallback((key: K, message: string | undefined) => {
    setErrors((prev) => {
      if (!message) {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return prev[key] === message ? prev : { ...prev, [key]: message };
    });
  }, []);

  return { errors, setErrors, clear, setOne };
}

/** After a failed submit, move focus to the first invalid field. */
export function focusFirstInvalid(form: HTMLFormElement | null) {
  requestAnimationFrame(() => {
    const el = form?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (!el) return;
    el.focus();
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}
