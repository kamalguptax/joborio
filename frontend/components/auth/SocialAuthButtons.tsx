"use client";

import { FcGoogle } from "react-icons/fc";
import { FaLinkedinIn } from "react-icons/fa";
import { getApiBaseUrl } from "@/lib/config";
import { OAUTH_ROLE_KEY } from "@/lib/auth/loginRoleGate";
import type { LoginRole } from "@/lib/auth/redirect";

export default function SocialAuthButtons({
  // kept for call-site compatibility; both intents now read "Continue with …"
  intent: _intent = "continue",
  role,
}: {
  intent?: "login" | "continue";
  /** Login page used (creator / brand). Remembered so /auth/callback can enforce it. */
  role?: LoginRole;
}) {
  const verb = "Continue with";

  const startOAuth = (provider: "google" | "linkedin") => {
    try {
      if (role) sessionStorage.setItem(OAUTH_ROLE_KEY, role);
      else sessionStorage.removeItem(OAUTH_ROLE_KEY);
    } catch {
      /* storage blocked: the user simply lands on their own dashboard */
    }
    // The server also checks the account type (login_as) after Google / LinkedIn returns.
    const query = role && role !== "publisher" ? `?login_as=${role}` : "";
    window.location.href = `${getApiBaseUrl()}/api/v1/auth/${provider}/redirect${query}`;
  };

  return (
    <div className="grid grid-cols-1 gap-2.5 min-[400px]:grid-cols-2">
      <button
        type="button"
        onClick={() => startOAuth("google")}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-semibold text-[#26385D] transition hover:border-violet-300 hover:bg-violet-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
      >
        <FcGoogle className="text-base" />
        <span className="truncate">{verb} Google</span>
      </button>

      <button
        type="button"
        onClick={() => startOAuth("linkedin")}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-semibold text-[#26385D] transition hover:border-violet-300 hover:bg-violet-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
      >
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] bg-[#0A66C2]">
          <FaLinkedinIn className="text-[10px] text-white" />
        </span>
        <span className="truncate">{verb} LinkedIn</span>
      </button>
    </div>
  );
}
