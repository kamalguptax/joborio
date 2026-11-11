"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchCreatorClicks, type CreatorClickRow } from "@/lib/api/creator";

function formatClickTime(value?: string): string {
  if (!value) return "time unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CreatorClicksPage() {
  const [rows, setRows] = useState<CreatorClickRow[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [counted, setCounted] = useState(0);
  const [duplicates, setDuplicates] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCreatorClicks(page)
      .then(({ data, meta }) => {
        setRows(data);
        setLastPage(Number(meta.last_page ?? 1));
        setTotal(Number(meta.total ?? 0));
        setCounted(Number(meta.counted ?? 0));
        setDuplicates(Number(meta.duplicates ?? 0));
        setError(null);
      })
      .catch(() => setError("Could not load your clicks."));
  }, [page]);

  return (
    <>
      <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
        Your traffic
      </p>
      <h1 className="mt-1 text-2xl font-bold text-indigo-950">All clicks</h1>
      <p className="mt-1 text-sm text-slate-500">
        Every job click on your links, including duplicates that are logged and not paid.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">All clicks</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Counted</p>
          <p className="text-2xl font-bold text-emerald-700">{counted}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Duplicates</p>
          <p className="text-2xl font-bold text-amber-700">{duplicates}</p>
        </div>
      </div>

      {error ? <p className="mt-6 text-sm text-rose-600">{error}</p> : null}

      <ul className="mt-6 space-y-2 text-sm">
        {rows.length === 0 && !error ? (
          <li className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-slate-500">
            No clicks yet. Share a live job from{" "}
            <Link href="/creator/opportunities" className="font-semibold text-purple-700">
              Opportunities
            </Link>
            .
          </li>
        ) : (
          rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3"
            >
              <span>
                <span className="font-semibold text-indigo-950">
                  {row.listing?.title || row.meta?.title || "Job"}
                </span>
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  {row.ip_address || "IP unknown"}
                  {" · "}
                  {formatClickTime(row.meta?.clicked_at ?? row.created_at)}
                  {" · "}
                  {row.event_type}
                </span>
              </span>
              <span
                className={`text-xs font-semibold ${
                  row.fraud_status === "dedup"
                    ? "text-amber-700"
                    : row.is_counted
                      ? "text-emerald-700"
                      : "text-slate-500"
                }`}
              >
                {row.fraud_status === "dedup"
                  ? `Duplicate${row.meta?.duplicate_of_event_id ? ` of #${row.meta.duplicate_of_event_id}` : ""}`
                  : row.is_counted
                    ? "Counted"
                    : row.fraud_status || "Not counted"}
              </span>
            </li>
          ))
        )}
      </ul>

      {lastPage > 1 ? (
        <div className="mt-6 flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border border-slate-200 px-3 py-1 text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm text-slate-500">
            Page {page} / {lastPage}
          </span>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-slate-200 px-3 py-1 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </>
  );
}
