"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [approval, setApproval] = useState("");
  const [filtersReady, setFiltersReady] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = () => {
    setError(null);
    adminListUsers({
      search: search || undefined,
      role: role || undefined,
      approval_status: approval || undefined,
      page,
    })
      .then(({ data, meta }) => {
        setUsers(data);
        setLastPage(Number(meta.last_page ?? 1));
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
    setFiltersReady(true);
  }, []);

  useEffect(() => {
    if (!filtersReady) return;
    load();
  }, [page, role, approval, filtersReady]);

  return (
    <>
      <AdminPageHeader
        title="Users"
        description="All accounts, roles, and linked creator or employer profiles."
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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

      {error ? <div className="mt-4"><AdminAlert tone="error">{error}</AdminAlert></div> : null}

      <div className="mt-8">
      <AdminTableWrap>
          <thead className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-2.5 font-semibold">User</th>
              <th className="px-4 py-2.5 font-semibold">Roles</th>
              <th className="px-4 py-2.5 font-semibold">Profile</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Approval</th>
              <th className="px-4 py-2.5 font-semibold">Joined</th>
              <th className="px-4 py-2.5 font-semibold">View</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-zinc-800">
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${u.id}`} className="font-semibold text-amber-400/90 hover:text-amber-300">
                    {u.name}
                  </Link>
                  <div className="text-xs text-zinc-500">{u.email}</div>
                </td>
                <td className="px-4 py-3">
                  {(u.roles ?? []).map((r) => r.name).join(", ") || "—"}
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {u.creator ? `@${u.creator.handle}` : u.employer?.company_name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {u.is_active ? (
                    <span className="text-emerald-500">Active</span>
                  ) : (
                    <span className="text-red-400">Disabled</span>
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
                              load();
                            } catch {
                              setError("Approve failed");
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
                <td className="px-4 py-3 text-zinc-500">{u.created_at?.slice(0, 10)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <Link
                      href={`/admin/users/${u.id}?tab=activity`}
                      className="text-emerald-400 hover:text-emerald-300"
                    >
                      Activity
                    </Link>
                    <Link
                      href={`/admin/users/${u.id}?tab=earnings`}
                      className="text-amber-400 hover:text-amber-300"
                    >
                      Earnings
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
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
