"use client";

import { FcGoogle } from "react-icons/fc";
import { FaLinkedinIn } from "react-icons/fa";
import { getApiBaseUrl } from "@/lib/config";

export default function SocialAuthButtons({
  intent = "continue",
}: {
  intent?: "login" | "continue";
}) {
  const verb = intent === "login" ? "Login" : "Continue";

  const startOAuth = (provider: "google" | "linkedin") => {
    window.location.href = `${getApiBaseUrl()}/api/v1/auth/${provider}/redirect`;
  };

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <button
        type="button"
        onClick={() => startOAuth("google")}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        <FcGoogle className="text-base" />
        <span className="truncate">{verb} Google</span>
      </button>

      <button
        type="button"
        onClick={() => startOAuth("linkedin")}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] bg-[#0A66C2]">
          <FaLinkedinIn className="text-[10px] text-white" />
        </span>
        <span className="truncate">{verb} LinkedIn</span>
      </button>
    </div>
  );
}
