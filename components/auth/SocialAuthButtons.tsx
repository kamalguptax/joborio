"use client";

import { FcGoogle } from "react-icons/fc";
import { FaLinkedinIn } from "react-icons/fa";
import { getApiBaseUrl } from "@/lib/config";

export default function SocialAuthButtons() {
  const startOAuth = (provider: "google" | "linkedin") => {
    window.location.href = `${getApiBaseUrl()}/api/v1/auth/${provider}/redirect`;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => startOAuth("google")}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
      >
        <FcGoogle className="text-xl" />
        <span>Continue with Google</span>
      </button>

      <button
        type="button"
        onClick={() => startOAuth("linkedin")}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-[#0A66C2]">
          <FaLinkedinIn className="text-[12px] text-white" />
        </span>
        <span>Continue with LinkedIn</span>
      </button>
    </>
  );
}
