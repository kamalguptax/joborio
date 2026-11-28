"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function GoBackButton() {
  const router = useRouter();

  function goBack() {
    // Opened in a new tab / pasted link: there is no history to go back to.
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-[15px] font-semibold text-slate-700 transition hover:border-violet-200 hover:text-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
    >
      <ArrowLeft size={16} aria-hidden="true" />
      Go back
    </button>
  );
}
