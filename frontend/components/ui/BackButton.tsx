import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Small pill-style back link, meant to sit right beside a page heading. */
export default function BackButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-purple-600 transition hover:border-violet-200 hover:text-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"
    >
      <ArrowLeft size={14} aria-hidden="true" />
      {label}
    </Link>
  );
}
