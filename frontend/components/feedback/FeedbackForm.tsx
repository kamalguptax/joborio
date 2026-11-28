"use client";

import { useState } from "react";
import { Bug, CheckCircle2, Heart, Lightbulb, MessageSquare, Star } from "lucide-react";
import { submitFeedback, type FeedbackType } from "@/lib/api/public";

const TYPES: { id: FeedbackType; label: string; icon: typeof Lightbulb }[] = [
  { id: "suggestion", label: "Suggestion", icon: Lightbulb },
  { id: "bug", label: "Problem", icon: Bug },
  { id: "compliment", label: "Compliment", icon: Heart },
  { id: "other", label: "Other", icon: MessageSquare },
];

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-[#0A2150] placeholder:text-slate-400 transition focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100";

export default function FeedbackForm() {
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (message.trim().length < 10) {
      setError("Please write at least 10 characters so we can understand your feedback.");
      return;
    }

    setBusy(true);
    try {
      await submitFeedback({
        type,
        rating,
        message: message.trim(),
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        page_url: document.referrer || undefined,
        website,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send feedback. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-emerald-100 bg-white p-10 text-center shadow-[0_18px_40px_-30px_rgba(10,33,80,0.25)]">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={28} />
        </span>
        <h2 className="mt-5 text-xl font-bold text-[#0A2150]">Thank you!</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
          Your feedback has reached the Upclift team. It helps us make the platform better for everyone.
        </p>
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setMessage("");
            setRating(null);
          }}
          className="mt-6 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
        >
          Send more feedback
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(10,33,80,0.04),0_18px_40px_-30px_rgba(10,33,80,0.25)] sm:p-8"
    >
      <fieldset>
        <legend className="text-sm font-semibold text-[#0A2150]">What kind of feedback is it?</legend>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {TYPES.map(({ id, label, icon: Icon }) => {
            const active = type === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => setType(id)}
                className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 ${
                  active
                    ? "border-violet-500 bg-violet-50 text-violet-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-violet-200"
                }`}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-[#0A2150]">
          How is your experience so far? <span className="font-normal text-slate-400">(optional)</span>
        </legend>
        <div className="mt-3 flex gap-1.5" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => {
            const on = rating !== null && n <= rating;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                onClick={() => setRating(rating === n ? null : n)}
                className="rounded-lg p-1 transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"
              >
                <Star
                  size={30}
                  className={on ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="fb-message" className="text-sm font-semibold text-[#0A2150]">
          Your feedback
        </label>
        <textarea
          id="fb-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          maxLength={3000}
          placeholder="Tell us what worked, what did not, or what you would like to see…"
          className={`${inputClass} mt-2 resize-y`}
        />
        <p className="mt-1 text-right text-xs text-slate-400">{message.length}/3000</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fb-name" className="text-sm font-semibold text-[#0A2150]">
            Name <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="fb-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            autoComplete="name"
            className={`${inputClass} mt-2`}
          />
        </div>
        <div>
          <label htmlFor="fb-email" className="text-sm font-semibold text-[#0A2150]">
            Email <span className="font-normal text-slate-400">(if you want a reply)</span>
          </label>
          <input
            id="fb-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={190}
            autoComplete="email"
            className={`${inputClass} mt-2`}
          />
        </div>
      </div>

      {/* Honeypot: hidden from people, bots tend to fill it. */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="fb-website">Website</label>
        <input
          id="fb-website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-violet-600 px-6 py-3.5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
      >
        {busy ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}
