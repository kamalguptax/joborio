"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  approvePostPromoteSubmission,
  fetchPostPromoteSubmissions,
  rejectPostPromoteSubmission,
  type PostPromoteSubmissionRow,
} from "@/lib/api/employer";
import { useResolvedParam } from "@/lib/hooks/useResolvedParam";

export default function EmployerPostPromoteClient() {
  const idParam = useResolvedParam("id", /^\/employer\/programs\/([^/]+)/);
  const programId = Number(idParam);
  const [rows, setRows] = useState<PostPromoteSubmissionRow[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = () => {
    fetchPostPromoteSubmissions(programId)
      .then(setRows)
      .catch(() => setRows([]));
  };

  useEffect(() => {
    if (!Number.isFinite(programId)) return;
    load();
  }, [programId]);

  const review = async (id: number, action: "approve" | "reject") => {
    setBusyId(id);
    try {
      if (action === "approve") {
        await approvePostPromoteSubmission(programId, id);
      } else {
        await rejectPostPromoteSubmission(programId, id);
      }
      load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Link
        href={`/employer/programs/${programId}`}
        className="text-sm font-semibold text-purple-600"
      >
        ← Program
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Post promote submissions</h1>
      <p className="mt-2 text-sm text-slate-500">
        Review creator like / comment / repost proof. Approving pays PPE from this
        campaign budget.
      </p>

      <ul className="mt-8 space-y-3">
        {rows.map((row) => {
          const actions = Array.isArray(row.actions_done)
            ? row.actions_done.join(", ")
            : "—";
          return (
            <li
              key={row.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  @{row.creator?.handle ?? `creator #${row.creator?.id ?? "—"}`}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {row.status} · {actions}
                </p>
                {row.proof_url ? (
                  <a
                    href={row.proof_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-sm font-semibold text-purple-700 underline"
                  >
                    View proof
                  </a>
                ) : null}
                {row.proof_note ? (
                  <p className="mt-1 text-sm text-slate-600">{row.proof_note}</p>
                ) : null}
              </div>
              {row.status === "pending" ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-bold text-white disabled:opacity-60"
                    onClick={() => review(row.id, "approve")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold disabled:opacity-60"
                    onClick={() => review(row.id, "reject")}
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">
          No submissions yet. Creators submit proof after joining this campaign.
        </p>
      ) : null}
    </>
  );
}
