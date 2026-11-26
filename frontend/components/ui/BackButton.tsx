import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Small pill-style back link, meant to sit above a page heading. */
export default function BackButton({
  href,
  label,
  onClick,
}: {
  href?: string;
  label: string;
  onClick?: () => void;
}) {
  const className =
    "inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-violet-700 transition hover:border-violet-200 hover:bg-violet-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500";

  if (onClick && !href) {
    return (
      <button type="button" onClick={onClick} className={className}>
        <ArrowLeft size={14} aria-hidden="true" />
        {label}
      </button>
    );
  }

  return (
    <Link href={href || "/"} className={className} onClick={onClick}>
      <ArrowLeft size={14} aria-hidden="true" />
      {label}
    </Link>
  );
}
