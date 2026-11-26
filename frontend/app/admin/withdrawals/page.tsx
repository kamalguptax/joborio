"use client";

import { useEffect, useState } from "react";
import { ApiClientError } from "@/lib/api/client";
import {
  adminListWithdrawals,
  adminPayWithdrawal,
  adminRejectWithdrawal,
  type AdminWithdrawalRow,
} from "@/lib/api/admin";
import {
  AdminAlert,
  AdminButton,
  AdminInput,
  AdminPageHeader,
  AdminSelect,
  AdminTableWrap,
} from "@/components/admin/admin-ui";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";

function money(n: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
}

export default function AdminWithdrawalsPage() {
  const [rows, setRows] = useState<AdminWithdrawalRow[]>([]);
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceNote, setEvidenceNote] = useState("");
  const [externalRef, setExternalRef] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    adminListWithdrawals({
      status: status === "all" ? undefined : status,
      role: role === "all" ? undefined : role,
      limit: 100,
    })
      .then((res) => setRows(res.withdrawals ?? []))
      .catch((err) => {
        setRows([]);
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load withdrawals. Run pending migrations if the table is missing.",
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, role]);

  const paySelected = async () => {
    if (!selectedId) {
      toast.error("Select a withdrawal first.");
      return;
    }
    if (!evidenceFile) {
      toast.error("Upload payment evidence before marking paid.");
      return;
    }
    setBusy(true);
    try {
      await adminPayWithdrawal(selectedId, {
        evidence: evidenceFile,
        evidence_note: evidenceNote || undefined,
        external_reference: externalRef || undefined,
        admin_note: adminNote || undefined,
      });
      toast.success("Withdrawal marked paid.");
      setSelectedId(null);
      setEvidenceFile(null);
      setEvidenceNote("");
      setExternalRef("");
      setAdminNote("");
      load();
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : "Could not pay withdrawal.",
      );
    } finally {
      setBusy(false);
    }
  };

  const rejectRow = async (id: number) => {
    setBusy(true);
    try {
      await adminRejectWithdrawal(id, {
        admin_note: adminNote || undefined,
      });
      toast.success("Withdrawal rejected.");
      if (selectedId === id) setSelectedId(null);
      load();
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Could not reject withdrawal.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Withdrawals"
        description="Creator, publisher, and network member withdrawal requests with status."
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <AdminSelect value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </AdminSelect>
        <AdminSelect value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="all">All roles</option>
          <option value="creator">Creator</option>
          <option value="publisher">Publisher</option>
          <option value="network_member">Network member</option>
        </AdminSelect>
        <AdminButton type="button" variant="secondary" onClick={load}>
          Refresh
        </AdminButton>
        <AdminButton
          type="button"
          disabled={busy || !selectedId}
          onClick={() => void paySelected()}
        >
          {busy ? "Working…" : "Pay selected"}
        </AdminButton>
      </div>

      {selectedId ? (
        <div className="mt-4 grid gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-semibold text-zinc-400">
            Payment evidence (required)
            <input
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              className="mt-1 block w-full text-xs text-zinc-300"
              onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="text-xs font-semibold text-zinc-400">
            Evidence note
            <AdminInput
              value={evidenceNote}
              onChange={(e) => setEvidenceNote(e.target.value)}
              className="mt-1"
            />
          </label>
          <label className="text-xs font-semibold text-zinc-400">
            External reference
            <AdminInput
              value={externalRef}
              onChange={(e) => setExternalRef(e.target.value)}
              className="mt-1"
            />
          </label>
          <label className="text-xs font-semibold text-zinc-400">
            Admin note
            <AdminInput
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              className="mt-1"
            />
          </label>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4">
          <AdminAlert tone="error">{error}</AdminAlert>
        </div>
      ) : null}

      <div className="mt-6">
        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : rows.length === 0 ? (
          <AdminAlert tone="info">
            No withdrawal requests for this filter.
          </AdminAlert>
        ) : (
          <AdminTableWrap>
            <thead className="border-b border-zinc-800 text-[11px] uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Method</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Requested</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-zinc-800/80">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-zinc-100">
                      {row.user?.name || "—"}
                    </p>
                    <p className="text-xs text-zinc-500">{row.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 capitalize text-zinc-300">
                    {row.role.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3 font-semibold text-zinc-100">
                    {money(row.amount_usd)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <p className="text-zinc-200">{row.payout_method}</p>
                    <p className="text-xs text-zinc-500">
                      {Object.values(row.payout_details || {})
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                        row.status === "paid"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : row.status === "pending"
                            ? "bg-amber-500/15 text-amber-300"
                            : row.status === "rejected"
                              ? "bg-red-500/15 text-red-300"
                              : "bg-zinc-700/60 text-zinc-300"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {row.created_at
                      ? new Date(row.created_at).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="text-xs font-semibold text-emerald-300"
                          onClick={() => setSelectedId(row.id)}
                        >
                          Select
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          className="text-xs font-semibold text-rose-300 disabled:opacity-50"
                          onClick={() => void rejectRow(row.id)}
                        >
                          Reject
                        </button>
                      </div>
                    ) : row.paid_at ? (
                      <span className="text-xs text-zinc-500">
                        Paid {new Date(row.paid_at).toLocaleDateString()}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTableWrap>
        )}
      </div>
    </>
  );
}
