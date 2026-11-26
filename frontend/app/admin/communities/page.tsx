"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiClientError } from "@/lib/api/client";
import {
  adminListCommunities,
  type AdminCommunityRow,
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
import { adminPath } from "@/lib/adminNav";

export default function AdminCommunitiesPage() {
  const [rows, setRows] = useState<AdminCommunityRow[]>([]);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = (nextStatus = status, nextSearch = query) => {
    setLoading(true);
    setError(null);
    adminListCommunities({
      status: nextStatus,
      search: nextSearch || undefined,
      limit: 150,
    })
      .then((res) => setRows(res.communities))
      .catch((err) =>
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load communities.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <AdminPageHeader
        title="Communities"
        description="All publisher communities across the network."
        actions={
          <Link
            href={adminPath("/admin/publishers")}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-700"
          >
            Publishers
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
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="draft">Draft</option>
        </AdminSelect>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search.trim());
            load(status, search.trim());
          }}
        >
          <AdminInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search community or publisher"
          />
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
          <TableSkeleton rows={6} cols={5} />
        ) : rows.length === 0 ? (
          <AdminAlert tone="info">No communities found.</AdminAlert>
        ) : (
          <AdminTableWrap>
            <thead className="border-b border-zinc-800 text-[11px] uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Community</th>
                <th className="px-4 py-3 font-semibold">Publisher</th>
                <th className="px-4 py-3 font-semibold">Members</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-zinc-800/80">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-zinc-100">{c.name}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {c.code}
                      {c.category ? ` · ${c.category}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {c.publisher ? (
                      <>
                        <p className="text-zinc-200">
                          {c.publisher.display_name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          @{c.publisher.username} · {c.publisher.code}
                        </p>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-200">
                    {c.members_active}
                    <span className="text-zinc-500">
                      {" "}
                      / {c.members_total}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                        c.status === "active"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-zinc-700/60 text-zinc-300"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {[
                      c.country_code,
                      c.commission_percent != null
                        ? `${c.commission_percent}% commission`
                        : null,
                      `${c.xml_jobs_count} XML jobs`,
                      c.manager?.name ? `Mgr: ${c.manager.name}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
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
