"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/components/ui/Toast";
import {
  adminBulkApproveUsers,
  adminListUsers,
  adminUpdateUser,
  type AdminUserRow,
} from "@/lib/api/admin";
import {
  AdminPageHeader,
  AdminButton,
  AdminInput,
  AdminSelect,
  AdminAlert,
  AdminTableWrap,
} from "@/components/admin/admin-ui";
import { adminUserPath } from "@/lib/staticExport";

type ActiveFilter = "" | "1" | "0";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [approval, setApproval] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("");
  const [filtersReady, setFiltersReady] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [perPage, setPerPage] = useState(25);

  const pendingOnPage = useMemo(
    () =>
      users.filter(
        (u) =>
          u.creator &&
          (u.creator.approval_status ?? "pending") !== "approved" &&
          (u.creator.approval_status ?? "pending") !== "rejected",
      ),
    [users],
  );

  const selectablePendingIds = useMemo(
    () => pendingOnPage.map((u) => u.id),
    [pendingOnPage],
  );

  const load = () => {
    setError(null);
    adminListUsers({
      search: search || undefined,
      role: role || undefined,
      approval_status: approval || undefined,
      is_active:
        activeFilter === ""
          ? undefined
          : activeFilter === "1",
      page,
      per_page: perPage,
    })
      .then(({ data, meta }) => {
        setUsers(data);
        setLastPage(Number(meta.last_page ?? 1));
        setTotal(Number(meta.total ?? data.length));
        setSelected((prev) =>
          prev.filter((id) => data.some((u) => u.id === id)),
        );
      })
      .catch(() => setError("Failed to load users"));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initial = params.get("role") ?? "";
    if (initial === "admin" || initial === "creator" || initial === "employer") {
      setRole(initial);
    }
    const approvalParam = params.get("approval") ?? "";
    if (
      approvalParam === "pending" ||
      approvalParam === "approved" ||
      approvalParam === "rejected"
    ) {
      setApproval(approvalParam);
      if (!initial) setRole("creator");
    }
    const activeParam = params.get("active") ?? "";
    if (activeParam === "1" || activeParam === "0") {
      setActiveFilter(activeParam);
      if (activeParam === "1") setPerPage(100);
    }
    setFiltersReady(true);
  }, []);

  useEffect(() => {
    if (!filtersReady) return;
    load();
  }, [page, role, approval, activeFilter, perPage, filtersReady]);

  const toggleSelected = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAllPending = () => {
    if (
      selectablePendingIds.length > 0 &&
      selectablePendingIds.every((id) => selected.includes(id))
    ) {
      setSelected((prev) => prev.filter((id) => !selectablePendingIds.includes(id)));
      return;
    }
    setSelected((prev) => Array.from(new Set([...prev, ...selectablePendingIds])));
  };

  const showFullActives = () => {
    setActiveFilter("1");
    setApproval("");
    setPerPage(100);
    setPage(1);
    const url = new URL(window.location.href);
    url.searchParams.set("active", "1");
    url.searchParams.delete("approval");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  };

  const showPendingCreators = () => {
    setRole("creator");
    setApproval("pending");
    setActiveFilter("");
    setPerPage(100);
    setPage(1);
    const url = new URL(window.location.href);
    url.searchParams.set("role", "creator");
    url.searchParams.set("approval", "pending");
    url.searchParams.delete("active");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  };

  const bulkApprove = async () => {
    const ids =
      selected.length > 0
        ? selected
        : selectablePendingIds;
    if (ids.length === 0) {
      toast.error("Select pending creators to approve.");
      return;
    }
    setBulkBusy(true);
    try {
      const result = await adminBulkApproveUsers(ids);
      toast.success(result.message ?? `Approved ${result.approved} creator(s).`);
      setSelected([]);
      load();
    } catch {
      toast.error("Bulk approve failed.");
    } finally {
      setBulkBusy(false);
    }
  };

  const setActive = async (u: AdminUserRow, next: boolean) => {
    setBusyId(u.id);
    try {
      await adminUpdateUser(u.id, { is_active: next });
      toast.success(next ? "User activated." : "User deactivated.");
      load();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not update account status.",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Users"
        description="All accounts, roles, and linked creator or employer profiles."
      />

      <div className="mt-6 flex flex-wrap gap-2">
        <AdminButton variant="primary" onClick={showFullActives}>
          Show all actives
        </AdminButton>
        <AdminButton variant="secondary" onClick={showPendingCreators}>
          Pending creators
        </AdminButton>
        {(approval === "pending" || selectablePendingIds.length > 0) && (
          <AdminButton
            variant="primary"
            disabled={bulkBusy}
            onClick={bulkApprove}
          >
            {bulkBusy
              ? "Approving…"
              : `Bulk approve${selected.length ? ` (${selected.length})` : pendingOnPage.length ? ` (${pendingOnPage.length})` : ""}`}
          </AdminButton>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <AdminInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email…"
          className="flex-1"
        />
        <AdminSelect
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="creator">Creator</option>
          <option value="employer">Employer</option>
        </AdminSelect>
        <AdminSelect
          value={activeFilter}
          onChange={(e) => {
            const next = e.target.value as ActiveFilter;
            setActiveFilter(next);
            if (next === "1") setPerPage(100);
            else setPerPage(25);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="1">Active only</option>
          <option value="0">Deactivated only</option>
        </AdminSelect>
        <AdminSelect
          value={approval}
          onChange={(e) => {
            setApproval(e.target.value);
            if (e.target.value) setRole("creator");
            setPage(1);
          }}
        >
          <option value="">All approvals</option>
          <option value="pending">Pending approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </AdminSelect>
        <AdminButton
          variant="primary"
          onClick={() => {
            setPage(1);
            load();
          }}
        >
          Search
        </AdminButton>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Showing {users.length} of {total} user{total === 1 ? "" : "s"}
        {activeFilter === "1" ? " · active filter on" : ""}
        {approval === "pending" ? " · pending creators" : ""}
      </p>

      {error ? (
        <div className="mt-4">
          <AdminAlert tone="error">{error}</AdminAlert>
        </div>
      ) : null}

      <div className="mt-6">
        <AdminTableWrap>
          <thead className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-3 py-2.5 font-semibold">
                {approval === "pending" || selectablePendingIds.length > 0 ? (
                  <input
                    type="checkbox"
                    aria-label="Select all pending on this page"
                    checked={
                      selectablePendingIds.length > 0 &&
                      selectablePendingIds.every((id) => selected.includes(id))
                    }
                    onChange={toggleSelectAllPending}
                  />
                ) : (
                  "#"
                )}
              </th>
              <th className="px-4 py-2.5 font-semibold">User</th>
              <th className="px-4 py-2.5 font-semibold">Roles</th>
              <th className="px-4 py-2.5 font-semibold">Profile</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Approval</th>
              <th className="px-4 py-2.5 font-semibold">Joined</th>
              <th className="px-4 py-2.5 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isPending =
                !!u.creator &&
                (u.creator.approval_status ?? "pending") !== "approved" &&
                (u.creator.approval_status ?? "pending") !== "rejected";
              return (
                <tr key={u.id} className="border-t border-zinc-800">
                  <td className="px-3 py-3">
                    {isPending ? (
                      <input
                        type="checkbox"
                        checked={selected.includes(u.id)}
                        onChange={() => toggleSelected(u.id)}
                        aria-label={`Select ${u.name}`}
                      />
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={adminUserPath(u.id)}
                      className="font-semibold text-amber-400/90 hover:text-amber-300"
                    >
                      {u.name}
                    </Link>
                    <div className="text-xs text-zinc-500">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {(u.roles ?? []).map((r) => r.name).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {u.creator
                      ? `@${u.creator.handle}`
                      : (u.employer?.company_name ?? "—")}
                  </td>
                  <td className="px-4 py-3">
                    {u.is_active ? (
                      <span className="text-emerald-500">Active</span>
                    ) : (
                      <span className="text-red-400">Deactivated</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.creator ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={
                            u.creator.approval_status === "approved"
                              ? "text-emerald-400"
                              : u.creator.approval_status === "rejected"
                                ? "text-red-400"
                                : "text-amber-300"
                          }
                        >
                          {u.creator.approval_status ?? "pending"}
                        </span>
                        {u.creator.approval_status !== "approved" ? (
                          <AdminButton
                            variant="primary"
                            disabled={busyId === u.id}
                            onClick={async () => {
                              setBusyId(u.id);
                              try {
                                await adminUpdateUser(u.id, {
                                  creator_approval_status: "approved",
                                });
                                toast.success("Creator approved.");
                                load();
                              } catch {
                                toast.error("Could not approve the creator.");
                              } finally {
                                setBusyId(null);
                              }
                            }}
                          >
                            Approve
                          </AdminButton>
                        ) : null}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {u.created_at?.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      {u.is_active ? (
                        <AdminButton
                          variant="secondary"
                          disabled={busyId === u.id}
                          onClick={() => setActive(u, false)}
                        >
                          Deactivate
                        </AdminButton>
                      ) : (
                        <AdminButton
                          variant="primary"
                          disabled={busyId === u.id}
                          onClick={() => setActive(u, true)}
                        >
                          Activate
                        </AdminButton>
                      )}
                      <Link
                        href={adminUserPath(u.id, "activity")}
                        className="self-center text-emerald-400 hover:text-emerald-300"
                      >
                        Activity
                      </Link>
                      <Link
                        href={adminUserPath(u.id, "earnings")}
                        className="self-center text-amber-400 hover:text-amber-300"
                      >
                        Earnings
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </AdminTableWrap>
      </div>

      {lastPage > 1 ? (
        <div className="mt-6 flex items-center gap-3">
          <AdminButton
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </AdminButton>
          <span className="text-sm text-zinc-500">
            Page {page} / {lastPage}
          </span>
          <AdminButton
            variant="secondary"
            disabled={page >= lastPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </AdminButton>
        </div>
      ) : null}
    </>
  );
}
