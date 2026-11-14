"use client";

import { useEffect, useState } from "react";
import {
  confirmPpaApplication,
  disputePpaApplication,
  fetchProgramApplications,
  rejectPpaApplication,
} from "@/lib/api/employer";
import { useResolvedParam } from "@/lib/hooks/useResolvedParam";

export default function EmployerApplicationsClient() {
  const idParam = useResolvedParam("id", /^\/employer\/programs\/([^/]+)/);
  const programId = Number(idParam);
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [disputeId, setDisputeId] = useState<number | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeError, setDisputeError] = useState<string | null>(null);

  const load = () => {
    fetchProgramApplications(programId)
      .then(({ data }) => setRows(data))
      .catch(() => setRows([]));
  };

  useEffect(() => {
    if (!Number.isFinite(programId)) return;
    load();
  }, [programId]);

  const submitDispute = async () => {
    if (disputeId === null) return;
    setDisputeError(null);
    if (disputeReason.trim().length < 10) {
      setDisputeError("Please provide at least 10 characters explaining the dispute.");
      return;
    }
    try {
      await disputePpaApplication(programId, disputeId, disputeReason.trim());
      setDisputeId(null);
      setDisputeReason("");
      load();
    } catch {
      setDisputeError("Could not open dispute. Only confirmed applications can be disputed.");
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">PPA applications</h1>
      <p className="mt-2 text-sm text-slate-500">
        Confirm valid applications. Dispute attribution on confirmed rows if you believe the
        application was invalid.
      </p>
      <ul className="mt-8 space-y-3">
        {rows.map((row) => (
          <li
            key={String(row.id)}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-4"
          >
            <div>
              <p className="font-semibold">{String(row.email ?? row.external_application_id)}</p>
              <p className="text-sm text-slate-500">{String(row.status)}</p>
            </div>
            {row.status === "pending_employer" ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-bold text-white"
                  onClick={async () => {
                    await confirmPpaApplication(programId, Number(row.id));
                    load();
                  }}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold"
                  onClick={async () => {
                    await rejectPpaApplication(programId, Number(row.id));
                    load();
                  }}
                >
                  Reject
                </button>
              </div>
            ) : null}
            {row.status === "confirmed" ? (
              <button
                type="button"
                className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-900"
                onClick={() => {
                  setDisputeId(Number(row.id));
                  setDisputeReason("");
                  setDisputeError(null);
                }}
              >
                Dispute attribution
              </button>
            ) : null}
          </li>
        ))}
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">No applications yet.</p>
        ) : null}
      </ul>

      {disputeId !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Dispute application #{disputeId}</h2>
            <p className="mt-1 text-sm text-slate-500">
              The creator will be notified. An admin will review and rule upheld or rejected.
            </p>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Explain why this application should not count toward attribution…"
              className="mt-4 h-32 w-full rounded-xl border border-slate-200 p-3 text-sm"
            />
            {disputeError ? (
              <p className="mt-2 text-sm text-red-600">{disputeError}</p>
            ) : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold"
                onClick={() => setDisputeId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white"
                onClick={submitDispute}
              >
                Submit dispute
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
