"use client";

import { useParams, usePathname } from "next/navigation";
import { resolveDynamicParam } from "@/lib/staticExport";

export function useResolvedParam(key: string, regex: RegExp): string {
  const params = useParams();
  const pathname = usePathname() ?? "";
  const raw = params[key];
  const s =
    typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;
  return resolveDynamicParam(s, pathname, regex);
}
