"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, RefreshCw, Wallet } from "lucide-react";
import SectionHeading from "@/components/layout/SectionHeading";
import { getApiBaseUrl } from "@/lib/config";
import { creatorProfilePath } from "@/lib/staticExport";
import { currencySymbol } from "@/lib/money";
import { initialsOf, nameRepeatsHandle } from "@/lib/creatorIdentity";
import { photoOf } from "@/lib/topEarners";
import type { PublicCreator } from "@/components/public/PublicCreatorView";

const SECTION = "mx-auto w-full max-w-[1600px] px-4 py-16 sm:px-8 md:py-24 lg:px-10";
const GRID = "mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

/** "$102", "$1,250", "$12.50", "$0.00": whole amounts without cents, otherwise two decimals. */
function formatPaid(amount: number, code?: string | null): string {
  if (!(amount > 0)) return `${currencySymbol(code)}0.00`;
  const whole = Math.abs(amount - Math.round(amount)) < 0.005;
  const num = amount.toLocaleString("en-US", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  });
  return `${currencySymbol(code)}${num}`;
}


type Loaded = { list: PublicCreator[]; total: number };

/** Accepts `{data: []}`, `{data: {data: []}}` (paginated) or `{creators: []}`. */
function extractList(json: unknown): { list: PublicCreator[]; total: number } | null {
  const j = json as Record<string, unknown> | null;
  if (!j || j.success === false) return null;
  const d = j.data as unknown;
  const arr = Array.isArray(d)
    ? d
    : Array.isArray((d as { data?: unknown } | undefined)?.data)
      ? ((d as { data: unknown[] }).data)
      : Array.isArray(j.creators)
        ? (j.creators as unknown[])
        : null;
  if (!arr) return null;
  const list = (arr as PublicCreator[]).filter((c) => c && typeof c.handle === "string" && c.handle);
  const meta = (j.meta ?? (d as { meta?: unknown } | undefined)?.meta) as { total?: unknown } | undefined;
  const total = Number(meta?.total ?? (d as { total?: unknown } | undefined)?.total ?? list.length) || list.length;
  return { list, total };
}

/**
 * Tries the largest page first and falls back to smaller / default pages, because some API
 * versions reject a big `per_page` (422) which used to leave this section empty.
 * Throws only when every attempt failed, so "no creators yet" and "request failed" differ.
 */
async function loadCreators(): Promise<Loaded> {
  const base = `${getApiBaseUrl()}/api/v1/public/creators`;
  const urls = [`${base}?per_page=24`, `${base}?per_page=12`, base];
  let lastError: unknown = new Error("Creators API did not respond");
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const parsed = extractList(await res.json());
      if (parsed) return parsed;
      lastError = new Error(`Creators API returned an unexpected response (${res.status})`);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

/** Accent colour of the creator, only if it is a plain #hex value. */
function accentOf(creator: PublicCreator): string {
  const c = creator.accent_color?.trim();
  return c && /^#[0-9a-fA-F]{6}$/.test(c) ? c : "#0A5FCF";
}

function CreatorCard({ creator }: { creator: PublicCreator }) {
  const accent = accentOf(creator);
  const displayName = creator.name?.trim() || `@${creator.handle}`;
  const initials = initialsOf(creator.name, creator.handle);
  const photo = photoOf(creator as unknown as Record<string, unknown>);
  // Don't print the same name twice ("Jonathan Mark" + "@jonathanmark").
  const showHandle = !nameRepeatsHandle(creator.name, creator.handle);

  // Paid last month, calculated by the API per creator. Always shown ($0.00 when nothing was paid).
  const paidLastMonth = Number(
    creator.payout?.paid_last_month_usd ?? creator.stats?.paid_last_month_usd ?? 0,
  );
  const niches = creator.niches ?? [];
  const shownNiches = niches.slice(0, 3);
  const extraNiches = niches.length - shownNiches.length;

  return (
    <li className="min-w-0">
      <Link
        href={creatorProfilePath(creator.handle)}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(10,33,80,0.04),0_16px_32px_-26px_rgba(10,33,80,0.25)] transition duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_24px_44px_-28px_rgba(10,95,207,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
      >
        <div
          aria-hidden="true"
          className="h-14 w-full"
          style={{
            background: `linear-gradient(120deg, ${accent}2E, ${accent}12 60%, #38bdf81A)`,
          }}
        />

        <div className="flex flex-1 flex-col px-4 pb-4">
          <div className="-mt-7 flex items-end justify-between gap-2">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-base font-bold text-white shadow-md ring-4 ring-white"
              style={{ background: `linear-gradient(135deg, ${accent}, #2563EB)` }}
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <span className="mb-0.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
              <BadgeCheck size={11} aria-hidden="true" />
              Verified
            </span>
          </div>

          <h3 className="mt-3 truncate text-[15px] font-bold leading-tight text-[#0A2150]">
            {displayName}
          </h3>
          {showHandle ? (
            <p className="mt-0.5 truncate text-xs font-medium text-slate-500">@{creator.handle}</p>
          ) : null}

          {creator.bio ? (
            <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-slate-600">{creator.bio}</p>
          ) : null}

          {shownNiches.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-1" aria-label="Niches">
              {shownNiches.map((n) => (
                <li
                  key={n.name}
                  className="max-w-full truncate rounded-full bg-violet-50 px-2 py-0.5 text-[10.5px] font-semibold text-violet-700"
                >
                  {n.name}
                </li>
              ))}
              {extraNiches > 0 ? (
                <li className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-500">
                  +{extraNiches}
                </li>
              ) : null}
            </ul>
          ) : null}

          <div className="mt-auto pt-4">
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
                <Wallet size={14} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Paid last month
                </p>
                <p className="text-[15px] font-bold leading-tight text-emerald-700">
                  {formatPaid(paidLastMonth, creator.payout?.currency || "USD")}
                </p>
              </div>
            </div>

            <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-violet-700">
              View profile
              <ArrowUpRight
                size={14}
                aria-hidden="true"
                className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

function CardSkeleton() {
  return (
    <li className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white" aria-hidden="true">
      <div className="h-14 animate-pulse bg-slate-100" />
      <div className="space-y-2.5 px-4 pb-4">
        <div className="-mt-7 h-14 w-14 animate-pulse rounded-2xl bg-slate-200 ring-4 ring-white" />
        <div className="h-3.5 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-9 w-full animate-pulse rounded-xl bg-slate-100" />
      </div>
    </li>
  );
}

export default function ApprovedCreatorsDirectory() {
  const [creators, setCreators] = useState<PublicCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [total, setTotal] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadCreators()
      .then(({ list, total: t }) => {
        if (cancelled) return;
        setCreators(list);
        setTotal(t);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error("[creators] could not load public profiles", e);
        setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (loading) {
    return (
      <section className={SECTION} aria-busy="true" aria-label="Loading creator profiles">
        <ul className={GRID.replace("mt-10", "mt-0")}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </ul>
      </section>
    );
  }

  if (failed) {
    return (
      <section className={SECTION}>
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
          <h2 className="text-xl font-bold text-[#0A2150]">Real creator profiles</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            We could not load the creator profiles right now. Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => {
              setFailed(false);
              setLoading(true);
              setAttempt((n) => n + 1);
            }}
            className="btn-tap mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-[#0A5FCF] to-[#2563EB] px-6 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <RefreshCw size={15} aria-hidden="true" />
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (creators.length === 0) {
    return (
      <section className={SECTION}>
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
          <h2 className="text-xl font-bold text-[#0A2150]">Real creator profiles</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Approved creators appear here with their public profile. Pending accounts stay private
            until JobOrio approves them.
          </p>
          <Link
            href="/creator/register"
            className="btn-tap mt-6 inline-flex h-11 items-center rounded-full bg-gradient-to-r from-[#0A5FCF] to-[#2563EB] px-6 text-sm font-semibold text-white shadow-[0_14px_30px_-14px_rgba(31,115,230,0.8)] transition hover:brightness-110"
          >
            Become the first creator
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={SECTION}>
      <SectionHeading
        className="max-w-3xl min-w-0"
        eyebrow="Live on JobOrio"
        title="Real creator profiles"
        description={`${total} approved creator${total === 1 ? "" : "s"} with public pages. Open a profile to see what they share and how they earn.`}
      />

      <ul className={GRID}>
        {creators.map((creator) => (
          <CreatorCard key={creator.handle} creator={creator} />
        ))}
      </ul>
    </section>
  );
}
