"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import {
  buildPostDraft,
  POST_PLATFORMS,
  type PostPlatform,
  type PostStudioPick,
} from "@/lib/postStudio/templates";

type TabFilter = "all" | "ppc" | "ppr" | "course" | "job" | "tools" | "ppa" | "ppe";

const FILTERS: Array<{ id: TabFilter; label: string }> = [
  { id: "all", label: "Recent" },
  { id: "ppc", label: "PPC" },
  { id: "ppr", label: "PPR" },
  { id: "course", label: "Courses" },
  { id: "job", label: "Jobs" },
  { id: "tools", label: "Tools" },
  { id: "ppa", label: "PPA" },
  { id: "ppe", label: "PPE" },
];

function matchesFilter(item: PostStudioPick, filter: TabFilter): boolean {
  if (filter === "all") return true;
  const b = item.badge.toLowerCase();
  if (filter === "course") return b === "course" || b === "courses";
  if (filter === "tools") return b === "tool" || b === "tools";
  if (filter === "job") return b === "job" || b === "hiring" || b === "xml";
  return b === filter;
}

function parseRate(rateText?: string): number {
  if (!rateText) return 0;
  const m = rateText.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : 0;
}

export default function PostStudioClient({
  items,
  loading,
  error,
  emptyHint,
  audienceLabel,
}: {
  items: PostStudioPick[];
  loading?: boolean;
  error?: string | null;
  emptyHint?: string;
  audienceLabel: string;
}) {
  const [filter, setFilter] = useState<TabFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [platform, setPlatform] = useState<PostPlatform>("linkedin");
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (!matchesFilter(item, filter)) return false;
      if (!q) return true;
      const hay = `${item.title} ${item.subtitle ?? ""} ${item.badge}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, filter, search]);

  const picks = useMemo(
    () => items.filter((item) => selected.has(item.id)),
    [items, selected],
  );

  const earnPotential = useMemo(
    () => picks.reduce((sum, p) => sum + parseRate(p.rateText), 0),
    [picks],
  );

  const draft = useMemo(
    () => buildPostDraft(platform, picks),
    [platform, picks],
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyDraft = async () => {
    if (picks.length === 0) {
      toast.error("Select at least one opportunity first.");
      return;
    }
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      toast.success("Post copied — paste it on social media.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Select the text and copy manually.");
    }
  };

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
          Post Studio
        </p>
        <h1 className="mt-1 text-3xl font-bold">Post Studio</h1>
        <p className="mt-2 max-w-2xl text-slate-500">
          Select PPC, PPR, courses, and jobs, then generate a ready-to-post draft
          with your tracked links. No AI — built from your JobOrio login and
          templates for {audienceLabel}.
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-700">
          Daily revenue opportunities. Select items below to see earning
          potential.
        </p>
        <p className="mt-1 text-2xl font-bold text-emerald-600">
          {picks.length === 0
            ? "Select opportunities to estimate"
            : `Earn up to $${earnPotential.toFixed(2)} per share`}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap gap-2">
            {FILTERS.map((item) => {
              const active = filter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    active
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search opportunities…"
            className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#172b63] outline-none placeholder:text-slate-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10"
          />

          {loading ? (
            <p className="text-sm text-slate-500">Loading opportunities…</p>
          ) : filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              {emptyHint ?? "No opportunities match these filters."}
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filtered.map((item) => {
                const on = selected.has(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggle(item.id)}
                      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                        on
                          ? "border-purple-300 bg-purple-50/60 shadow-sm"
                          : "border-slate-200 bg-white hover:border-purple-200"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          on
                            ? "bg-purple-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {(item.title[0] || "?").toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                            {item.badge}
                          </span>
                          {on ? (
                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                              Selected
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-1 block line-clamp-2 text-sm font-bold text-[#172b63]">
                          {item.title}
                        </span>
                        {item.subtitle ? (
                          <span className="mt-0.5 block line-clamp-1 text-xs text-slate-500">
                            {item.subtitle}
                          </span>
                        ) : null}
                        {item.rateText ? (
                          <span className="mt-2 block text-sm font-bold text-purple-700">
                            {item.rateText}
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={`mt-1 h-5 w-5 shrink-0 rounded-full border-2 ${
                          on
                            ? "border-purple-600 bg-purple-600"
                            : "border-slate-300 bg-white"
                        }`}
                        aria-hidden
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-purple-600" />
            <h2 className="text-base font-bold text-[#172b63]">
              Draft generator
            </h2>
          </div>
          <p className="mb-4 text-xs text-slate-500">
            Choose where you want to post. Drafts use templates and your tracked
            links — nothing is sent to an AI model.
          </p>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Platform
          </p>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {POST_PLATFORMS.map((p) => {
              const active = platform === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id)}
                  className={`rounded-xl border px-3 py-2 text-left transition ${
                    active
                      ? "border-purple-400 bg-purple-50"
                      : "border-slate-200 hover:border-purple-200"
                  }`}
                >
                  <span className="block text-xs font-bold text-[#172b63]">
                    {p.label}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-snug text-slate-500">
                    {p.hint}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Your draft ({picks.length} selected)
          </p>
          <textarea
            readOnly
            value={draft}
            rows={14}
            className="mb-3 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-[#172b63]"
          />

          <button
            type="button"
            onClick={() => void copyDraft()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#172b63] px-4 py-2.5 text-sm font-bold text-white"
          >
            {copied ? (
              <>
                <Check size={16} /> Copied
              </>
            ) : (
              <>
                <Copy size={16} /> Copy post
              </>
            )}
          </button>
        </aside>
      </div>
    </>
  );
}
