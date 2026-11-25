"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiClientError } from "@/lib/api/client";
import {
  adminActivatePublisher,
  adminListPublishers,
  type AdminPublisherRow,
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
import { adminPath } from "@/lib/adminNav";

function money(n: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
}

export default function AdminPublishersPage() {
  const [rows, setRows] = useState<AdminPublisherRow[]>([]);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = (nextStatus = status, nextSearch = query) => {
    setLoading(true);
    setError(null);
    adminListPublishers(nextStatus, nextSearch || undefined)
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
      toast.success("Publisher activated.");
      load();
    } catch (err) {
      toast.error(
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
      <AdminPageHeader
        title="Publishers"
        description="All publisher network accounts, wallet balances, and community counts."
        actions={
          <Link
            href={adminPath("/admin/communities")}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-700"
          >
            Communities
          </Link>
        }
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <AdminSelect
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            load(e.target.value, query);
          }}
        >
          <option value="all">All statuses</option>
          <option value="under_review">Under review</option>
          <option value="email_verified">Email verified</option>
          <option value="activated">Activated</option>
          <option value="rejected">Rejected</option>
          <option value="submitted">Submitted</option>
        </AdminSelect>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search.trim());
            load(status, search.trim());
          }}
        >
          <div className="min-w-[220px]">
            <AdminInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, username, code"
            />
          </div>
          <AdminButton type="submit" variant="secondary">
            Search
          </AdminButton>
        </form>
      </div>

      {error ? (
        <div className="mt-4">
          <AdminAlert tone="error">{error}</AdminAlert>
        </div>
      ) : null}

      <div className="mt-6">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : rows.length === 0 ? (
          <AdminAlert tone="info">No publishers found for this filter.</AdminAlert>
        ) : (
          <AdminTableWrap>
            <thead className="border-b border-zinc-800 text-[11px] uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Publisher</th>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Network</th>
                <th className="px-4 py-3 font-semibold">Wallet</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-zinc-800/80">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-zinc-100">
                      {p.display_name}{" "}
                      <span className="font-medium text-zinc-500">
                        @{p.username}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {p.code} · {p.country_code} · {p.communities_count ?? 0}{" "}
                      communities · {p.members_count ?? 0} members
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <p className="text-zinc-200">{p.owner?.name || "—"}</p>
                    <p className="text-xs text-zinc-500">{p.owner?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                        p.status === "activated"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : p.status === "rejected"
                            ? "bg-red-500/15 text-red-300"
                            : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {p.status_label || p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm capitalize text-zinc-300">
                    {p.network_type}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <p className="font-semibold text-zinc-100">
                      {money(p.payable_usd)} payable
                    </p>
                    <p className="text-xs text-zinc-500">
                      {money(p.lifetime_net_usd)} lifetime · {money(p.paid_usd)} paid
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.status !== "activated" && p.status !== "rejected" ? (
                      <AdminButton
                        type="button"
                        disabled={busyId === p.id}
                        onClick={() => void activate(p.id)}
                      >
                        {busyId === p.id ? "Activating…" : "Activate"}
                      </AdminButton>
                    ) : p.status === "activated" ? (
                      <span className="text-xs font-semibold text-emerald-400">
                        Active
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-red-400">
                        Rejected
                      </span>
                    )}
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
