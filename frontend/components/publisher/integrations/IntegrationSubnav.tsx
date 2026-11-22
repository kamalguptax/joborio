"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code2, FileCode2, Webhook } from "lucide-react";

const tabs = [
  {
    href: "/publisher/integrations/api",
    label: "API",
    icon: Code2,
  },
  {
    href: "/publisher/integrations/xml",
    label: "XML",
    icon: FileCode2,
  },
  {
    href: "/publisher/integrations/webhook",
    label: "Webhook",
    icon: Webhook,
  },
] as const;

export default function IntegrationSubnav() {
  const path = usePathname() ?? "";

  return (
    <nav className="mb-8 flex flex-wrap gap-2">
      <Link
        href="/publisher/integrations"
        className={`rounded-full px-4 py-2 text-sm font-bold ${
          path === "/publisher/integrations"
            ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white"
            : "border border-slate-200 bg-white text-slate-700 hover:border-violet-300"
        }`}
      >
        Overview
      </Link>
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = path === href || path.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ${
              active
                ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:border-violet-300"
            }`}
          >
            <Icon size={14} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
