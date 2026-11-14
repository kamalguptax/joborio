"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchCaptcha } from "@/lib/api/brandAuth";

type Props = {
  onChange: (value: { captcha_id: string; captcha_answer: string }) => void;
  className?: string;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onJoborioTurnstileLoad?: () => void;
  }
}

const TURNSTILE_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function siteKeyFromEnv(): string {
  return (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").trim();
}

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src^="https://challenges.cloudflare.com/turnstile"]`,
  );
  if (existing) {
    return new Promise((resolve) => {
      if (window.turnstile) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Turnstile"));
    document.head.appendChild(script);
  });
}

export default function MathCaptcha({ onChange, className = "" }: Props) {
  const [provider, setProvider] = useState<"turnstile" | "math" | "loading">(
    "loading",
  );
  const [siteKey, setSiteKey] = useState("");
  const [question, setQuestion] = useState("Loading captcha…");
  const [captchaId, setCaptchaId] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const applyMathChallenge = useCallback(
    (data: { captcha_id: string; question: string }) => {
      setProvider("math");
      setSiteKey("");
      setCaptchaId(data.captcha_id);
      setQuestion(data.question);
      onChangeRef.current({ captcha_id: data.captcha_id, captcha_answer: "" });
    },
    [],
  );

  const fallbackToMath = useCallback(async (reason: string) => {
    try {
      const data = await fetchCaptcha({ math: true });
      applyMathChallenge(data);
      setError(reason);
    } catch {
      setProvider("math");
      setQuestion("Captcha unavailable");
      setError(reason);
    }
  }, [applyMathChallenge]);

  const renderTurnstile = useCallback(async (key: string) => {
    setError(null);
    try {
      await loadTurnstileScript();
      if (!widgetRef.current || !window.turnstile) {
        void fallbackToMath("Cloudflare captcha unavailable — using math check.");
        return;
      }
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
        widgetRef.current.innerHTML = "";
      }

      onChangeRef.current({ captcha_id: "turnstile", captcha_answer: "" });
      widgetIdRef.current = window.turnstile.render(widgetRef.current, {
        sitekey: key,
        theme: "light",
        callback: (token: string) => {
          onChangeRef.current({
            captcha_id: "turnstile",
            captcha_answer: token,
          });
        },
        "expired-callback": () => {
          onChangeRef.current({
            captcha_id: "turnstile",
            captcha_answer: "",
          });
        },
        "error-callback": () => {
          void fallbackToMath("Cloudflare captcha error — using math check.");
        },
      });
    } catch {
      void fallbackToMath("Could not load Cloudflare captcha — using math check.");
    }
  }, [fallbackToMath]);

  const loadChallenge = useCallback(async () => {
    setError(null);
    setAnswer("");
    setProvider("loading");
    try {
      const data = await fetchCaptcha();
      const providerName =
        (data as { provider?: string }).provider === "turnstile"
          ? "turnstile"
          : "math";
      if (providerName === "turnstile") {
        const key =
          (data as { site_key?: string }).site_key?.trim() || siteKeyFromEnv();
        if (!key) {
          await fallbackToMath("Turnstile site key missing — using math check.");
          return;
        }
        setProvider("turnstile");
        setSiteKey(key);
        setCaptchaId("turnstile");
        return;
      }
      applyMathChallenge(data);
    } catch {
      setError("Could not load captcha. Refresh and try again.");
      setProvider("math");
      setQuestion("Captcha unavailable");
    }
  }, [applyMathChallenge, fallbackToMath]);

  useEffect(() => {
    void loadChallenge();
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
    };
  }, [loadChallenge]);

  useEffect(() => {
    if (provider !== "turnstile" || !siteKey) return;
    void renderTurnstile(siteKey);
  }, [provider, siteKey, renderTurnstile]);

  if (provider === "loading") {
    return (
      <div className={className}>
        <p className="text-sm font-semibold text-[#0F1B3D]">Security check</p>
        <p className="mt-2 text-xs text-slate-400">Loading captcha…</p>
      </div>
    );
  }

  if (provider === "turnstile") {
    return (
      <div className={className}>
        <p className="mb-2 text-sm font-semibold text-[#0F1B3D]">
          Security check
        </p>
        <div ref={widgetRef} className="cf-turnstile" />
        {error ? (
          <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
        ) : (
          <p className="mt-2 text-xs text-slate-400">
            Protected by Cloudflare Turnstile
          </p>
        )}
        {!siteKey ? (
          <p className="mt-2 text-xs text-amber-700">
            Turnstile site key missing on server.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 text-sm font-semibold text-[#0F1B3D]">
          Captcha
          <span className="mt-2 block rounded-xl border border-indigo-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            {question}
          </span>
        </label>
        <button
          type="button"
          onClick={() => void loadChallenge()}
          className="mb-0.5 rounded-xl border border-slate-200 px-3 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
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
        className="mt-3 h-12 w-full rounded-xl border border-indigo-100 bg-white px-4 text-base text-[#0F1B3D] placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/15"
        placeholder="Answer"
      />
      {error ? (
        <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
