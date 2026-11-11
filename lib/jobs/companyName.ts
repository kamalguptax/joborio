/** WhatJobs nests the logo URL inside company, so the name can arrive glued to a link. */
export function companyName(value: string | null | undefined, fallback = ""): string {
  const cleaned = (value || "")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || fallback;
}
