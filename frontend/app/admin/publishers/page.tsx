"use client";

import { useEffect, useState } from "react";
import { ApiClientError } from "@/lib/api/client";
import {
  adminActivatePublisher,
  adminListPublishers,
  type AdminPublisherRow,
} from "@/lib/api/admin";

export default function AdminPublishersPage() {
  const [rows, setRows] = useState<AdminPublisherRow[]>([]);
  const [status, setStatus] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = (nextStatus = status) => {
    setLoading(true);
    adminListPublishers(nextStatus)
      .then(setRows)
      .catch((err) =>
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load publishers.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function activate(id: number) {
    setBusyId(id);
    setError(null);
    try {
      await adminActivatePublisher(id);
      load();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not activate publisher.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Publisher applications</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review and activate publisher network accounts.
          </p>
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            load(e.target.value);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"
        >
          <option value="all">All</option>
          <option value="email_verified">Under review</option>
          <option value="activated">Activated</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
          No publishers found.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
              <div>
                <p className="font-bold text-[#172b63]">
                  {p.display_name}{" "}
                  <span className="font-semibold text-slate-400">@{p.username}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {p.code} · {p.country_code} · {p.network_type} · {p.status_label}
                </p>
              </div>
              {p.status !== "activated" ? (
                <button
                  type="button"
                  disabled={busyId === p.id}
                  onClick={() => void activate(p.id)}
                  className="rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {busyId === p.id ? "Activating…" : "Activate"}
                </button>
              ) : (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
                  Active
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
