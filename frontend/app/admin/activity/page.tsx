"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminActivity, CAMPAIGN_TYPES } from "@/lib/api/admin";
import { formatMoney } from "@/lib/money";
import { adminUserPath } from "@/lib/staticExport";

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

type ClickRow = {
  id: number;
  event_type?: string;
  is_counted?: boolean;
  fraud_status?: string;
  is_duplicate?: boolean;
  ip_address?: string | null;
  created_at?: string;
  geo_country?: string | null;
  source?: string | null;
  meta?: {
    title?: string;
    clicked_at?: string;
    duplicate_of_event_id?: number;
    reference_id?: string;
    source?: string;
    category?: string;
  };
  creator_id?: number;
  user_id?: number;
  creator_name?: string;
  creator_email?: string;
  creator_handle?: string;
  public_code?: string;
  job_title?: string;
  company_name?: string | null;
  work_category?: string | null;
  running_campaign?: {
    id: number;
    title: string;
    status?: string;
    promotion_type?: string;
    pricing_model?: string;
  } | null;
  running_campaigns?: Array<{ id: number; title: string }>;
  earning?: {
    id: number;
    net_usd: number;
    gross_usd: number;
    state: string;
    earning_type: string;
  } | null;
  email?: string;
  status?: string;
  listing?: { title?: string } | null;
  creator?: {
    handle?: string;
    user?: { id?: number; name?: string; email?: string; public_code?: string } | null;
  } | null;
};

type UserClickRow = {
  creator_id: number;
  user_id?: number;
  creator_name?: string;
  creator_email?: string;
  creator_handle?: string;
  public_code?: string;
  clicks: number | string;
  counted_clicks: number | string;
  duplicate_clicks: number | string;
  last_click_at?: string;
  running_campaign_count?: number;
  running_campaigns?: Array<{ id: number; title: string }>;
  creator?: {
    handle?: string;
    user?: { id?: number; name?: string; email?: string; public_code?: string } | null;
  } | null;
};

type Panel = "clicks" | "users" | "signups";
type SortKey = "date_desc" | "date_asc" | "earning_desc" | "earning_asc";

export default function AdminActivityPage() {
  const [panel, setPanel] = useState<Panel>("clicks");
  const [fraudFilter, setFraudFilter] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [creatorIdFilter, setCreatorIdFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [earning, setEarning] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState("");
  const [rows, setRows] = useState<Array<ClickRow | UserClickRow>>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const panelParam = params.get("panel");
    const fraud = params.get("fraud");
    if (panelParam === "clicks" || panelParam === "users" || panelParam === "signups") {
      setPanel(panelParam);
    }
    if (fraud === "dedup" || fraud === "clean" || fraud === "self_click" || fraud === "trial") {
      setFraudFilter(fraud);
      setPanel("clicks");
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const type = panel === "signups" ? "signups" : "clicks";
    const creatorIdNum = Number(creatorIdFilter);
    adminActivity({
      type,
      view: panel === "users" ? "users" : undefined,
      page,
      fraud_status: panel === "clicks" ? fraudFilter || undefined : undefined,
      user_id: panel === "clicks" && userId ? userId : undefined,
      creator_id:
        panel === "clicks" && Number.isFinite(creatorIdNum) && creatorIdNum > 0
          ? creatorIdNum
          : undefined,
      search: query || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      earning: panel === "clicks" ? earning || undefined : undefined,
      category: panel === "clicks" ? category || undefined : undefined,
      sort: panel === "clicks" ? sort : undefined,
    })
      .then(({ data, meta }) => {
        if (cancelled) return;
        setRows(data as Array<ClickRow | UserClickRow>);
        setLastPage(Number(meta.last_page ?? 1));
        setTotal(Number(meta.total ?? 0));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setRows([]);
        setTotal(0);
        setError(err instanceof Error ? err.message : "Could not load activity.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    panel,
    page,
    fraudFilter,
    userId,
    query,
    creatorIdFilter,
    dateFrom,
    dateTo,
    earning,
    category,
    sort,
    reloadKey,
  ]);

  const openUser = (id: number, name: string) => {
    setUserId(id);
    setUserName(name);
    setPanel("clicks");
    setPage(1);
  };

  const applyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    setQuery(search.trim());
    setPage(1);
    setReloadKey((k) => k + 1);
  };

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">User activity</h1>
          <p className="mt-1 text-sm text-slate-400">
            Creator name, IDs, click, running campaign, duplicate status, and earnings — filter by
            name/id, date, earning, or work category.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold"
        >
          Refresh
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["clicks", "All clicks"],
            ["users", "By user"],
            ["signups", "PPR signups"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setPanel(id);
              setPage(1);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              panel === id ? "bg-purple-600" : "border border-white/20"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form
        onSubmit={applyFilters}
        className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="block text-xs text-slate-400 sm:col-span-2">
          Search name / VIG code / job / IP
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="kamal, VIG003, job title…"
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs text-slate-400">
          Creator ID
          <input
            value={creatorIdFilter}
            onChange={(e) => {
              setCreatorIdFilter(e.target.value.replace(/[^\d]/g, ""));
              setPage(1);
            }}
            placeholder="e.g. 12"
            inputMode="numeric"
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs text-slate-400">
          From date
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs text-slate-400">
          To date
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
          />
        </label>
        {panel === "clicks" ? (
          <>
            <label className="block text-xs text-slate-400">
              Earnings
              <select
                value={earning}
                onChange={(e) => {
                  setEarning(e.target.value);
                  setPage(1);
                }}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
              >
                <option value="">All earnings</option>
                <option value="with">With earning</option>
                <option value="without">No earning</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="payable">Payable</option>
                <option value="paid">Paid</option>
              </select>
            </label>
            <label className="block text-xs text-slate-400">
              Work category
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
              >
                <option value="">All categories</option>
                {CAMPAIGN_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-slate-400">
              Sort
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as SortKey);
                  setPage(1);
                }}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
              >
                <option value="date_desc">Newest first</option>
                <option value="date_asc">Oldest first</option>
                <option value="earning_desc">Highest earning</option>
                <option value="earning_asc">Lowest earning</option>
              </select>
            </label>
            <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-4">
              {[
                { id: "", label: "All clicks" },
                { id: "dedup", label: "Duplicates" },
                { id: "clean", label: "Clean" },
                { id: "self_click", label: "Self-click" },
                { id: "trial", label: "Trial" },
              ].map((f) => (
                <button
                  key={f.id || "all"}
                  type="button"
                  onClick={() => {
                    setFraudFilter(f.id);
                    setPage(1);
                  }}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                    fraudFilter === f.id
                      ? "bg-amber-500 text-zinc-950"
                      : "border border-white/20 text-slate-300"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </>
        ) : null}
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold"
          >
            Search
          </button>
          <button
            type="button"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm"
            onClick={() => {
              setSearch("");
              setQuery("");
              setCreatorIdFilter("");
              setDateFrom("");
              setDateTo("");
              setEarning("");
              setCategory("");
              setSort("date_desc");
              setFraudFilter("");
              setUserId(null);
              setUserName("");
              setPage(1);
            }}
          >
            Reset
          </button>
        </div>
      </form>

      {panel === "clicks" && userId ? (
        <p className="mt-4 text-sm text-amber-200">
          Clicks for {userName || `user #${userId}`}
          <button
            type="button"
            className="ml-3 underline"
            onClick={() => {
              setUserId(null);
              setUserName("");
              setPage(1);
            }}
          >
            Show every user
          </button>
        </p>
      ) : null}

      <p className="mt-4 text-sm text-slate-400">
        {loading ? "Loading…" : `${total} ${panel === "users" ? "users with clicks" : "records"}`}
      </p>
      {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}

      {panel === "users" ? (
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Creator</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Clicks</th>
                <th className="px-4 py-3">Counted</th>
                <th className="px-4 py-3">Duplicates</th>
                <th className="px-4 py-3">Running campaigns</th>
                <th className="px-4 py-3">Last click</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-slate-500">
                    No clicks yet. Open a share link (`/go/?code=…&ref=…`) or view/apply a job while
                    logged in as a creator.
                  </td>
                </tr>
              ) : (
                (rows as UserClickRow[]).map((row) => {
                  const name =
                    row.creator_name ||
                    row.creator?.user?.name ||
                    row.creator_email ||
                    (row.creator_handle ? `@${row.creator_handle}` : `Creator #${row.creator_id}`);
                  const code =
                    row.public_code || row.creator?.user?.public_code || "—";
                  const uid = row.user_id || row.creator?.user?.id;
                  return (
                    <tr key={row.creator_id} className="border-t border-white/10 align-top">
                      <td className="px-4 py-3">
                        <span className="font-semibold">{name}</span>
                        <span className="block text-xs text-slate-400">
                          {row.creator_email || row.creator?.user?.email || "—"}
                          {row.creator_handle ? ` · @${row.creator_handle}` : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div>User #{uid ?? "—"}</div>
                        <div>Creator #{row.creator_id}</div>
                        <div className="text-amber-200">{code}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold">{Number(row.clicks)}</td>
                      <td className="px-4 py-3">{Number(row.counted_clicks)}</td>
                      <td className="px-4 py-3 text-amber-300">
                        {Number(row.duplicate_clicks)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300">
                        {row.running_campaign_count
                          ? (row.running_campaigns ?? [])
                              .map((c) => c.title)
                              .join(", ")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {formatClickTime(row.last_click_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {uid ? (
                          <button
                            type="button"
                            onClick={() => openUser(uid, name)}
                            className="text-xs font-semibold text-purple-300"
                          >
                            View clicks
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : panel === "clicks" ? (
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Creator</th>
                <th className="px-4 py-3">IDs</th>
                <th className="px-4 py-3">Click / job</th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Earning</th>
                <th className="px-4 py-3">When / IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-slate-500">
                    No activity yet. Clicks are stored when someone opens a creator share link, or
                    when a logged-in creator uses View / Apply / Copy link on Opportunities or
                    Campaigns.
                  </td>
                </tr>
              ) : (
                (rows as ClickRow[]).map((row) => {
                  const name =
                    row.creator_name ||
                    row.creator?.user?.name ||
                    row.creator_email ||
                    (row.creator_handle ? `@${row.creator_handle}` : "Unknown");
                  const code = row.public_code || row.creator?.user?.public_code || "—";
                  const uid = row.user_id || row.creator?.user?.id;
                  const extraCampaigns = (row.running_campaigns ?? []).filter(
                    (c) => c.id !== row.running_campaign?.id,
                  );
                  return (
                    <tr key={row.id} className="border-t border-white/10 align-top">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="text-left font-semibold text-purple-300"
                          onClick={() => {
                            if (uid) openUser(uid, name);
                          }}
                        >
                          {name}
                        </button>
                        <div className="text-xs text-slate-400">
                          {row.creator_email || "—"}
                          {row.creator_handle ? ` · @${row.creator_handle}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300">
                        <div>Event #{row.id}</div>
                        <div>User #{uid ?? "—"}</div>
                        <div>Creator #{row.creator_id ?? "—"}</div>
                        <div className="text-amber-200">{code}</div>
                        {uid ? (
                          <Link
                            href={adminUserPath(uid)}
                            className="text-purple-300 underline"
                          >
                            Profile
                          </Link>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-zinc-100">
                          {row.job_title || row.listing?.title || row.meta?.title || "Job"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {row.company_name || "—"} · {row.event_type}
                          {row.meta?.reference_id ? ` · ${row.meta.reference_id}` : ""}
                        </div>
                        {(row.source || row.meta?.source) ? (
                          <div className="text-[11px] text-slate-500">
                            via {row.source || row.meta?.source}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {row.running_campaign ? (
                          <>
                            <div className="font-semibold text-zinc-200">
                              {row.running_campaign.title}
                            </div>
                            <div className="text-slate-400">
                              #{row.running_campaign.id} · {row.running_campaign.status} ·{" "}
                              {row.running_campaign.pricing_model}
                            </div>
                            {extraCampaigns.length ? (
                              <div className="mt-1 text-slate-500">
                                +{extraCampaigns.length} more:{" "}
                                {extraCampaigns.map((c) => c.title).join(", ")}
                              </div>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-slate-500">Organic / XML</span>
                        )}
                      </td>
                      <td className="px-4 py-3 uppercase text-xs text-slate-300">
                        {row.work_category || row.meta?.category || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div>
                          {row.is_duplicate || row.fraud_status === "dedup" ? (
                            <span className="text-amber-300">Duplicate</span>
                          ) : row.is_counted ? (
                            <span className="text-emerald-400">Counted</span>
                          ) : (
                            <span className="text-slate-400">Not counted</span>
                          )}
                        </div>
                        <div className="text-slate-500">{row.fraud_status || "—"}</div>
                        {row.meta?.duplicate_of_event_id ? (
                          <div className="text-amber-200">
                            of #{row.meta.duplicate_of_event_id}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {row.earning ? (
                          <>
                            <div className="font-semibold text-emerald-300">
                              {formatMoney(row.earning.net_usd, "USD")}
                            </div>
                            <div className="text-slate-400">
                              {row.earning.earning_type} · {row.earning.state}
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        <div>{formatClickTime(row.meta?.clicked_at ?? row.created_at)}</div>
                        <div>IP {row.ip_address || "none"}</div>
                        {row.geo_country ? <div>{row.geo_country}</div> : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="mt-4 space-y-2 text-sm">
          {rows.length === 0 ? (
            <li className="text-slate-500">No signups yet.</li>
          ) : (
            (rows as ClickRow[]).map((row) => (
              <li key={String(row.id)} className="rounded-xl border border-white/10 bg-white/5 p-4">
                {String(row.email)} · {String(row.status)} ·{" "}
                {row.job_title || row.listing?.title || "Listing"}
                <div className="mt-1 text-xs text-slate-400">
                  {row.creator_name || row.creator?.user?.name || "Creator"} ·{" "}
                  {formatClickTime(row.created_at)}
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      {lastPage > 1 ? (
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border border-white/20 px-3 py-1 text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm text-slate-400">
            Page {page} / {lastPage}
          </span>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-white/20 px-3 py-1 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </>
  );
}
