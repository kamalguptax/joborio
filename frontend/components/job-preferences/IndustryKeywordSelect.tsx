"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchJobMasterFilters } from "@/lib/api/jobMasters";
import { fetchSyndicatedJobs } from "@/lib/api/syndication";
import MultiSelect, { type MultiSelectOption } from "@/components/ui/MultiSelect";

const KEYWORD_SUGGESTIONS = [
  "React",
  "Node.js",
  "Python",
  "Java",
  "Product Manager",
  "UI/UX",
  "Digital Marketing",
  "Sales",
  "Customer Support",
  "Data Analyst",
  "DevOps",
  "QA",
  "Content Writing",
  "HR",
  "Finance",
  "Accounting",
  "Business Development",
  "Graphic Design",
  "Project Manager",
  "Full Stack",
];

const INDUSTRY_FALLBACK = [
  "Technology",
  "Fintech",
  "EdTech",
  "Healthcare",
  "E-commerce",
  "Retail",
  "Manufacturing",
  "Media",
  "Telecom",
  "Consulting",
  "Logistics",
  "Real Estate",
  "Travel",
  "Hospitality",
  "BFSI",
  "SaaS",
];

function mergeOptions(base: string[], selected: string[]): MultiSelectOption[] {
  const seen = new Set<string>();
  const out: MultiSelectOption[] = [];
  for (const raw of [...base, ...selected]) {
    const label = String(raw ?? "").trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ value: label, label });
  }
  return out.sort((a, b) => a.label.localeCompare(b.label));
}

function formatCount(n: number | undefined, loading: boolean): string {
  if (loading) return "Checking jobs…";
  if (n == null) return "Job count unavailable";
  if (n === 1) return "1 job available";
  return `${n.toLocaleString()} jobs available`;
}

async function countJobs(query: {
  category?: string;
  search?: string;
}): Promise<number> {
  const res = await fetchSyndicatedJobs({
    ...query,
    page: 1,
    per_page: 1,
  });
  return Number(res.meta?.total ?? 0);
}

type Props = {
  industry: string[];
  keywords: string[];
  onIndustryChange: (next: string[]) => void;
  onKeywordsChange: (next: string[]) => void;
};

export default function IndustryKeywordSelect({
  industry,
  keywords,
  onIndustryChange,
  onKeywordsChange,
}: Props) {
  const [industryBase, setIndustryBase] = useState<string[]>(INDUSTRY_FALLBACK);
  const [industryCounts, setIndustryCounts] = useState<Record<string, number>>(
    {},
  );
  const [keywordCounts, setKeywordCounts] = useState<Record<string, number>>(
    {},
  );
  const [loadingIndustry, setLoadingIndustry] = useState(false);
  const [loadingKeywords, setLoadingKeywords] = useState(false);

  useEffect(() => {
    fetchJobMasterFilters()
      .then((masters) => {
        const cats = (masters.category ?? [])
          .map((row) => row.name.trim())
          .filter(Boolean);
        if (cats.length > 0) setIndustryBase(cats);
      })
      .catch(() => setIndustryBase(INDUSTRY_FALLBACK));
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (industry.length === 0) {
      setIndustryCounts({});
      setLoadingIndustry(false);
      return;
    }
    setLoadingIndustry(true);
    Promise.all(
      industry.map(async (name) => {
        try {
          const total = await countJobs({ category: name });
          return [name, total] as const;
        } catch {
          return [name, -1] as const;
        }
      }),
    ).then((rows) => {
      if (cancelled) return;
      const next: Record<string, number> = {};
      for (const [name, total] of rows) {
        if (total >= 0) next[name] = total;
      }
      setIndustryCounts(next);
      setLoadingIndustry(false);
    });
    return () => {
      cancelled = true;
    };
  }, [industry]);

  useEffect(() => {
    let cancelled = false;
    if (keywords.length === 0) {
      setKeywordCounts({});
      setLoadingKeywords(false);
      return;
    }
    setLoadingKeywords(true);
    Promise.all(
      keywords.map(async (name) => {
        try {
          const total = await countJobs({ search: name });
          return [name, total] as const;
        } catch {
          return [name, -1] as const;
        }
      }),
    ).then((rows) => {
      if (cancelled) return;
      const next: Record<string, number> = {};
      for (const [name, total] of rows) {
        if (total >= 0) next[name] = total;
      }
      setKeywordCounts(next);
      setLoadingKeywords(false);
    });
    return () => {
      cancelled = true;
    };
  }, [keywords]);

  const industryOptions = useMemo(
    () => mergeOptions(industryBase, industry),
    [industryBase, industry],
  );
  const keywordOptions = useMemo(
    () => mergeOptions(KEYWORD_SUGGESTIONS, keywords),
    [keywords],
  );

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-[#0A2150]">
          Industry
        </label>
        <p className="mt-0.5 text-xs text-slate-500">
          Pick industries you promote. Job counts update when you select.
        </p>
        <MultiSelect
          options={industryOptions}
          value={industry}
          onChange={onIndustryChange}
          placeholder="Select industry…"
          searchPlaceholder="Search industries…"
          className="mt-2"
        />
        {industry.length > 0 ? (
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {industry.map((name) => (
              <li key={name}>
                <span className="font-semibold text-[#0A2150]">{name}</span>
                {" — "}
                {formatCount(industryCounts[name], loadingIndustry)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#0A2150]">
          Keywords
        </label>
        <p className="mt-0.5 text-xs text-slate-500">
          Keywords used to match jobs. Each shows how many jobs match.
        </p>
        <MultiSelect
          options={keywordOptions}
          value={keywords}
          onChange={onKeywordsChange}
          placeholder="Select keywords…"
          searchPlaceholder="Search keywords…"
          className="mt-2"
        />
        {keywords.length > 0 ? (
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {keywords.map((name) => (
              <li key={name}>
                <span className="font-semibold text-[#0A2150]">{name}</span>
                {" — "}
                {formatCount(keywordCounts[name], loadingKeywords)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
