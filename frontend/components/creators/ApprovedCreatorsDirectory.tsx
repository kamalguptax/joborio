"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Wallet } from "lucide-react";
import { getApiBaseUrl } from "@/lib/config";
import { creatorProfilePath } from "@/lib/staticExport";
import { formatMoney } from "@/lib/money";
import type { PublicCreator } from "@/components/public/PublicCreatorView";

export default function ApprovedCreatorsDirectory() {
  const [creators, setCreators] = useState<PublicCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(`${getApiBaseUrl()}/api/v1/public/creators?per_page=24`, {
      headers: { Accept: "application/json" },
    })
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        if (!json?.success) {
          setCreators([]);
          setTotal(0);
          return;
        }
        setCreators((json.data as PublicCreator[]) ?? []);
        setTotal(Number(json.meta?.total ?? json.data?.length ?? 0));
      })
      .catch(() => {
        if (!cancelled) {
          setCreators([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-[1600px] px-4 py-16 sm:px-8 md:py-20 lg:px-10">
        <p className="text-sm text-slate-500">Loading creator profiles…</p>
      </section>
    );
  }

  if (creators.length === 0) {
    return (
      <section className="mx-auto w-full max-w-[1600px] px-4 py-16 sm:px-8 md:py-20 lg:px-10">
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <h2 className="text-xl font-bold text-[#0F1B3D]">Real creator profiles</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Approved creators appear here with their public profile and payout status.
            Pending accounts stay private until JobOrio approves them.
          </p>
          <Link
            href="/creator/register"
            className="mt-6 inline-flex rounded-full bg-[#172b63] px-5 py-2.5 text-sm font-bold text-white"
          >
            Become the first creator
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[1600px] px-4 py-16 sm:px-8 md:py-20 lg:px-10">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
          Live on JobOrio
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#0F1B3D]">
          Real creator profiles
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {total} approved creator{total === 1 ? "" : "s"} with public pages. Open a profile to see
          opportunities and payout readiness.
        </p>
      </div>

      <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {creators.map((creator) => {
          const paid = Number(creator.payout?.paid_usd ?? creator.stats?.paid_usd ?? 0);
          const ready = Boolean(creator.payout?.ready);
          return (
            <li key={creator.handle}>
              <Link
                href={creatorProfilePath(creator.handle)}
                className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-sm font-bold text-white">
                    {(creator.name || creator.handle).slice(0, 2).toUpperCase()}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase text-emerald-700">
                    <BadgeCheck size={12} />
                    Approved
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-[#172b63]">
                  {creator.name || `@${creator.handle}`}
                </h3>
                <p className="text-sm font-semibold text-slate-500">@{creator.handle}</p>
                {creator.bio ? (
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{creator.bio}</p>
                ) : null}
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-5 text-xs font-semibold text-slate-600">
                  <span>
                    {formatMoney(paid, creator.payout?.currency || "USD")} paid
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Wallet size={12} />
                    {ready
                      ? `Payout ready · ${creator.payout?.method_label ?? "Saved"}`
                      : "Payout setup pending"}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
