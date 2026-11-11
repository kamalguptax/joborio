"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchCreatorRegistrations,
  type CreatorRegistrationRow,
} from "@/lib/api/creator";

const statusFilters = [
  { value: "", label: "All" },
  { value: "pending_verification", label: "Pending verify" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

export default function CreatorRegistrationsPage() {
  const [rows, setRows] = useState<CreatorRegistrationRow[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCreatorRegistrations(status ? { status } : undefined)
      .then(({ data }) => setRows(data))
      .catch(() => setError("Could not load registrations."));
  }, [status]);

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
          PPR · Pay per registration
        </p>
        <h1 className="mt-1 text-3xl font-bold">Registrations</h1>
        <p className="mt-2 text-slate-500">
          Signups attributed to your links. Email must verify within 24 hours
          before earnings move to the ledger.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {statusFilters.map((f) => (
          <button
            key={f.value || "all"}
            type="button"
            onClick={() => setStatus(f.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              status === f.value
                ? "bg-purple-600 text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Listing</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="hidden px-4 py-3 sm:table-cell">Earning</th>
              <th className="hidden px-4 py-3 md:table-cell">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-3">
                  {row.listing?.title ?? `Listing #${row.id}`}
                  {row.listing?.company_name ? (
                    <span className="block text-xs text-slate-400">
                      {row.listing.company_name}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{row.email_masked}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  {row.earning ? (
                    <span className="font-semibold">
                      ${Number(row.earning.net_usd).toFixed(2)}{" "}
                      <span className="text-xs font-normal text-slate-400">
                        ({row.earning.state})
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="hidden px-4 py-3 text-slate-500 md:table-cell">
                  {new Date(row.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !error ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No registrations yet. Share tracked
            links on listings that accept signups.{" "}
            <Link href="/creator/earnings" className="font-semibold text-purple-600">
              Earnings ledger
            </Link>
          </p>
        ) : null}
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tones: Record<string, string> = {
    pending_verification: "bg-amber-50 text-amber-800",
    verified: "bg-emerald-50 text-emerald-800",
    rejected: "bg-red-50 text-red-700",
  };
  const label = status.replace(/_/g, " ");

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
        tones[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {label}
    </span>
  );
}
