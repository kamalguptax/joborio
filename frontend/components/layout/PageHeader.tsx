"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft } from "lucide-react";

/** Id of the slot DashboardShell renders on the same line as the top-right icons. */
export const HEADER_SLOT_ID = "dash-header-slot";

type Props = {
  title: string;
  /** When set, an icon-only back button is shown to the left of the heading. */
  backHref?: string;
  backLabel?: string;
};

/**
 * Page heading for dashboard pages. On desktop it is placed in the top bar, on the
 * left of the settings / notification icons, with the back icon just before it.
 * On small screens (no top-bar row) it renders inline at the top of the page.
 */
export default function PageHeader({ title, backHref, backLabel }: Props) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setSlot(document.getElementById(HEADER_SLOT_ID));
  }, []);

  const content = (
    <>
      {backHref ? (
        <Link
          href={backHref}
          aria-label={backLabel ? `Back to ${backLabel}` : "Go back"}
          title={backLabel ? `Back to ${backLabel}` : "Go back"}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-purple-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
      ) : null}
      <h1 className="min-w-0 truncate text-2xl font-bold text-[#0F1B3D]">{title}</h1>
    </>
  );

  return (
    <>
      <div className="mb-2 flex items-center gap-3 lg:hidden">{content}</div>
      {slot ? createPortal(content, slot) : null}
    </>
  );
}
