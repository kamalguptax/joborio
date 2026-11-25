"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { shareJobUrl } from "@/lib/tracking/subid";
import { syndicatedJobPath } from "@/lib/staticExport";

function LinkedInIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

type Props = {
  referenceId: string;
  title: string;
  company?: string | null;
  publicCode?: string | null;
};

export default function ShareSyndicatedJob({
  referenceId,
  title,
  company,
  publicCode,
}: Props) {
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    const code = (publicCode || "").trim();
    if (code) return shareJobUrl(code, referenceId);
    if (typeof window !== "undefined") {
      return `${window.location.origin}${syndicatedJobPath(referenceId)}`;
    }
    return syndicatedJobPath(referenceId);
  }, [publicCode, referenceId]);

  const shareText = useMemo(() => {
    const who = company ? ` at ${company}` : "";
    return `Hiring: ${title}${who} — apply via JobOrio: ${shareUrl}`;
  }, [company, title, shareUrl]);

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  const telegramHref = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Hiring: ${title}`)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Share link copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  }

  async function nativeShare() {
    if (typeof navigator === "undefined" || !navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({
        title: title,
        text: `Hiring: ${title}${company ? ` at ${company}` : ""}`,
        url: shareUrl,
      });
    } catch {
      /* user cancelled */
    }
  }

  const btn =
    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
            Share & earn
          </p>
          <p className="mt-0.5 text-sm font-semibold text-[#172b63]">
            Share this job with your tracked link
          </p>
        </div>
        <button
          type="button"
          onClick={() => void nativeShare()}
          className={`${btn} border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100`}
        >
          <Share2 size={14} />
          Share
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyLink()}
          className={`${btn} border-slate-200 bg-slate-50 text-slate-700 hover:border-violet-300 hover:text-violet-700`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy link"}
        </button>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn} border-emerald-200 bg-[#25D366] text-white hover:brightness-95`}
        >
          WhatsApp
        </a>
        <a
          href={telegramHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn} border-sky-200 bg-[#229ED9] text-white hover:brightness-95`}
        >
          Telegram
        </a>
        <a
          href={linkedinHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn} border-blue-200 bg-[#0A66C2] text-white hover:brightness-95`}
        >
          <LinkedInIcon size={14} />
          LinkedIn
        </a>
        <a
          href={xHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn} border-slate-800 bg-slate-900 text-white hover:bg-slate-800`}
        >
          X
        </a>
      </div>

      <p className="mt-3 break-all text-[11px] text-slate-400">{shareUrl}</p>
    </div>
  );
}
