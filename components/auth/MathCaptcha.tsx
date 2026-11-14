"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchCaptcha } from "@/lib/api/brandAuth";

type Props = {
  onChange: (value: { captcha_id: string; captcha_answer: string }) => void;
  className?: string;
};

export default function MathCaptcha({ onChange, className = "" }: Props) {
  const [question, setQuestion] = useState("Loading captcha…");
  const [captchaId, setCaptchaId] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setAnswer("");
    try {
      const data = await fetchCaptcha();
      setCaptchaId(data.captcha_id);
      setQuestion(data.question);
      onChange({ captcha_id: data.captcha_id, captcha_answer: "" });
    } catch {
      setError("Could not load captcha. Refresh and try again.");
      setQuestion("Captcha unavailable");
    }
  }, [onChange]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className={className}>
      <div className="flex items-end gap-3">
        <label className="min-w-0 flex-1 text-sm font-semibold text-[#0F1B3D]">
          Captcha
          <span className="mt-2 flex h-[52px] items-center rounded-xl border border-dashed border-violet-200 bg-violet-50/60 px-4 text-base font-medium text-slate-700">
            {question}
          </span>
        </label>
        <button
          type="button"
          onClick={() => void load()}
          className="flex h-[52px] items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>
      <input
        type="text"
        inputMode="numeric"
        required
        value={answer}
        onChange={(e) => {
          const v = e.target.value;
          setAnswer(v);
          onChange({ captcha_id: captchaId, captcha_answer: v });
        }}
        placeholder="Your answer"
        className="mt-2 h-[52px] w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-base text-[#0F1B3D] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-600 focus:bg-white focus:ring-4 focus:ring-violet-600/15"
      />
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
