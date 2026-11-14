"use client";

import { FaLinkedinIn } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { getApiBaseUrl } from "@/lib/config";

const btn =
  "flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white text-[15px] font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500";

/** Compact Google / LinkedIn buttons, side by side. */
export default function AuthSocial({ dividerLabel }: { dividerLabel: string }) {
  const startOAuth = (provider: "google" | "linkedin") => {
    window.location.href = `${getApiBaseUrl()}/api/v1/auth/${provider}/redirect`;
  };

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-[13px] font-medium text-slate-400">{dividerLabel}</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button type="button" onClick={() => startOAuth("google")} className={btn}>
          <FcGoogle className="text-xl" aria-hidden="true" />
          Google
        </button>
        <button type="button" onClick={() => startOAuth("linkedin")} className={btn}>
          <span className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-[#0A66C2]">
            <FaLinkedinIn className="text-[12px] text-white" aria-hidden="true" />
          </span>
          LinkedIn
        </button>
      </div>
    </div>
  );
}
