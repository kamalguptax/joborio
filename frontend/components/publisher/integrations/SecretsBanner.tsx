"use client";

import { Check, Copy } from "lucide-react";

type Props = {
  secrets: { api_key: string; webhook_secret: string };
  copied: string | null;
  onCopy: (label: string, value: string) => void;
};

export default function SecretsBanner({ secrets, copied, onCopy }: Props) {
  return (
    <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4">
      <p className="font-bold text-amber-950">Copy secrets now</p>
      <p className="mt-1 text-sm text-amber-900">
        These values are shown once and are never returned again.
      </p>
      <div className="mt-3 space-y-2 text-sm">
        {[
          ["API key", secrets.api_key],
          ["Webhook secret", secrets.webhook_secret],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-white px-3 py-2"
          >
            <span className="w-28 text-xs font-semibold uppercase text-slate-400">
              {label}
            </span>
            <code className="min-w-0 flex-1 break-all text-xs text-[#172b63]">
              {value}
            </code>
            <button
              type="button"
              onClick={() => onCopy(label, value)}
              className="inline-flex items-center gap-1 rounded-full bg-[#172b63] px-3 py-1 text-xs font-bold text-white"
            >
              {copied === label ? <Check size={14} /> : <Copy size={14} />}
              {copied === label ? "Copied" : "Copy"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
