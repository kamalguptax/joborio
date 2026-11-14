"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

/**
 * TODO: connect to your newsletter backend / provider.
 * Right now this only simulates a successful request so the UI can be reviewed.
 */
async function subscribeToNewsletter(email: string): Promise<void> {
  void email;
  await new Promise((resolve) => setTimeout(resolve, 400));
}

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      await subscribeToNewsletter(value);
      setStatus("done");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <label htmlFor="footer-newsletter" className="text-sm font-semibold text-white sm:text-base">
        Subscribe to our newsletter
      </label>

      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/[0.06] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-white/10 transition focus-within:ring-2 focus-within:ring-violet-400/70">
        <input
          id="footer-newsletter"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          placeholder="you@example.com"
          aria-invalid={status === "error"}
          aria-describedby="footer-newsletter-msg"
          className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          aria-label="Subscribe"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB] text-white shadow-lg shadow-violet-900/40 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60"
        >
          {status === "done" ? <Check size={18} /> : <ArrowRight size={18} />}
        </button>
      </div>

      <p
        id="footer-newsletter-msg"
        role="status"
        className={`mt-2.5 text-xs ${
          status === "error" ? "text-rose-300" : status === "done" ? "text-emerald-300" : "text-white/40"
        }`}
      >
        {status === "error"
          ? "Please enter a valid email address."
          : status === "done"
            ? "Thanks! You’re on the list."
            : "Unsubscribe anytime."}
      </p>
    </form>
  );
}
