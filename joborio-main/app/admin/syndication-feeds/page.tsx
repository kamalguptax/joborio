"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  adminCreateSyndicationFeed,
  adminDeleteSyndicationFeed,
  adminListSyndicationFeeds,
  adminProbeSyndicationFeed,
  adminRefreshAllSyndicationFeeds,
  adminRefreshSyndicationFeed,
  adminSyndicationJobs,
  adminUpdateSyndicationFeed,
  type SyndicationFeedRow,
} from "@/lib/api/admin";
import SyndicationFeedDashboard from "@/components/admin/SyndicationFeedDashboard";
import { companyName } from "@/lib/jobs/companyName";
import { postedAgo } from "@/lib/home/opportunityCards";

const emptyForm = {
  name: "",
  slug: "",
  feed_url: "",
  country_code: "",
  is_active: true,
  use_sample_when_empty: true,
  sample_path: "",
  sort_order: 0,
};

export default function AdminSyndicationFeedsPage() {
  const [feeds, setFeeds] = useState<SyndicationFeedRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [liveJobs, setLiveJobs] = useState<Array<Record<string, unknown>>>([]);
  const [analyticsJobs, setAnalyticsJobs] = useState<Array<Record<string, unknown>>>([]);
  const [liveTotal, setLiveTotal] = useState(0);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const liveRef = useRef<HTMLDivElement | null>(null);

  const selectFeed = useCallback((slug: string, scroll = true) => {
    setSelectedSlug(slug);
    const url = new URL(window.location.href);
    url.searchParams.set("feed", slug);
    window.history.replaceState({}, "", `${url.pathname}?${url.searchParams.toString()}`);
    if (scroll) {
      requestAnimationFrame(() => {
        liveRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);

  const load = useCallback(() => {
    adminListSyndicationFeeds()
      .then((rows) => {
        setFeeds(rows);
        const requested = new URLSearchParams(window.location.search).get("feed");
        setSelectedSlug((current) => {
          if (current && rows.some((row) => row.slug === current)) return current;
          if (requested && rows.some((row) => row.slug === requested)) return requested;
          return rows.find((row) => row.is_active)?.slug ?? rows[0]?.slug ?? null;
        });
      })
      .catch(() => setMsg("Could not load XML feeds."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selectedSlug) {
      setLiveJobs([]);
      setAnalyticsJobs([]);
      setLiveTotal(0);
      return;
    }
    let cancelled = false;
    setLiveLoading(true);
    setLiveError(null);
    // group_by_category returns the full filtered set (not paginated) for dashboard stats
    adminSyndicationJobs({ feed: selectedSlug, group_by_category: true })
      .then(({ data, meta }) => {
        if (cancelled) return;
        const all = data.jobs ?? [];
        setAnalyticsJobs(all);
        setLiveJobs(all.slice(0, 24));
        setLiveTotal(Number(meta.total ?? all.length));
        if (window.location.hash === "#live-feed") {
          requestAnimationFrame(() => {
            liveRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLiveJobs([]);
          setAnalyticsJobs([]);
          setLiveError("Live feed could not be loaded.");
        }
      })
      .finally(() => {
        if (!cancelled) setLiveLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSlug]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setBusy("save");
    try {
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        feed_url: form.feed_url.trim(),
        country_code: form.country_code.trim().toUpperCase() || null,
        is_active: form.is_active,
        use_sample_when_empty: form.use_sample_when_empty,
        sample_path: form.sample_path.trim() || null,
        sort_order: Number(form.sort_order) || 0,
        format: "jobrapido",
        job_xpath: "//job",
      };
      if (editingId) {
        await adminUpdateSyndicationFeed(editingId, body);
        setMsg("Feed updated.");
      } else {
        await adminCreateSyndicationFeed(body);
        setMsg("Feed added.");
      }
      resetForm();
      load();
    } catch {
      setMsg("Save failed — check URL and slug.");
    } finally {
      setBusy(null);
    }
  };

  const startEdit = (row: SyndicationFeedRow) => {
    setShowForm(true);
    setEditingId(row.id);
    setForm({
      name: row.name,
      slug: row.slug,
      feed_url: row.feed_url,
      country_code: row.country_code ?? "",
      is_active: row.is_active,
      use_sample_when_empty: row.use_sample_when_empty,
      sample_path: row.sample_path ?? "",
      sort_order: row.sort_order,
    });
  };

  const selectedFeed = feeds.find((row) => row.slug === selectedSlug) ?? null;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">XML job feeds</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Live jobs from the active feed open first. Use{" "}
            <span className="text-emerald-400">Add new feed</span> to onboard
            another XML source.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={openAdd}
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold shadow-lg shadow-emerald-900/40"
          >
            + Add new feed
          </button>
          <button
            type="button"
            disabled={busy === "all"}
            onClick={async () => {
              setBusy("all");
              setMsg(null);
              try {
                const r = await adminRefreshAllSyndicationFeeds();
                setMsg(`Merged cache refreshed — ${r.total_in_feed} jobs.`);
                load();
              } catch {
                setMsg("Refresh all failed.");
              } finally {
                setBusy(null);
              }
            }}
            className="rounded-lg border border-white/20 px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            Refresh caches
          </button>
        </div>
      </div>

      {msg ? <p className="mt-4 text-sm text-amber-300">{msg}</p> : null}

      {showForm ? (
      <form
        onSubmit={submit}
        className="mt-8 grid gap-4 rounded-xl border border-white/10 bg-white/5 p-5 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 text-lg font-bold">
          {editingId ? "Edit feed" : "Add XML feed"}
        </h2>
        <label className="block text-sm">
          <span className="text-slate-400">Name</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2"
            placeholder="Vigyapanam India"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Slug (optional)</span>
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2"
            placeholder="vigyapanam-in"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-slate-400">Feed URL</span>
          <input
            required
            type="url"
            value={form.feed_url}
            onChange={(e) => setForm({ ...form, feed_url: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2"
            placeholder="https://…/jobrapido_….xml"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Country code</span>
          <input
            maxLength={2}
            value={form.country_code}
            onChange={(e) => setForm({ ...form, country_code: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2"
            placeholder="IN"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Sort order</span>
          <input
            type="number"
            min={0}
            value={form.sort_order}
            onChange={(e) =>
              setForm({ ...form, sort_order: Number(e.target.value) })
            }
            className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-slate-400">Sample file path (server, optional)</span>
          <input
            value={form.sample_path}
            onChange={(e) => setForm({ ...form, sample_path: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 font-mono text-xs"
            placeholder="E:\upsidcnew\backend\storage\app\syndication\sample.xml"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.use_sample_when_empty}
            onChange={(e) =>
              setForm({ ...form, use_sample_when_empty: e.target.checked })
            }
          />
          Use sample when live XML has no jobs
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={busy === "save"}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {editingId ? "Update" : "Add feed"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
      ) : null}

      <div className="mt-10 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Feed</th>
              <th className="px-4 py-3">Jobs</th>
              <th className="px-4 py-3">Last fetch</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {feeds.map((row) => (
              <tr
                key={row.id}
                className={`border-b border-white/5 align-top ${
                  selectedSlug === row.slug
                    ? "bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/40"
                    : "hover:bg-white/[0.03]"
                }`}
              >
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => selectFeed(row.slug)}
                    className="text-left font-semibold text-zinc-100 hover:text-amber-300"
                  >
                    {row.name}
                  </button>
                  <p className="text-xs text-slate-500">@{row.slug}</p>
                  <p className="mt-1 max-w-md truncate font-mono text-[11px] text-purple-300">
                    {row.feed_url}
                  </p>
                </td>
                <td className="px-4 py-3 tabular-nums">{row.last_job_count}</td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {row.last_fetched_at
                    ? new Date(row.last_fetched_at).toLocaleString()
                    : "Never"}
                  {row.last_build_date ? (
                    <span className="block">Build: {row.last_build_date}</span>
                  ) : null}
                  {row.last_error ? (
                    <span className="block text-red-400">{row.last_error}</span>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  {row.is_active ? (
                    <span className="text-emerald-400">Active</span>
                  ) : (
                    <span className="text-slate-500">Paused</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300"
                      onClick={() => selectFeed(row.slug)}
                    >
                      View jobs
                    </button>
                    <Link
                      href={`/admin/jobs?feed=${encodeURIComponent(row.slug)}`}
                      className="rounded border border-white/20 px-2 py-1 text-xs"
                    >
                      Jobs page
                    </Link>
                    <button
                      type="button"
                      className="rounded border border-white/20 px-2 py-1 text-xs"
                      onClick={() => startEdit(row)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded border border-white/20 px-2 py-1 text-xs"
                      onClick={async () => {
                        setBusy(`probe-${row.id}`);
                        try {
                          const r = await adminProbeSyndicationFeed(row.id);
                          setMsg(
                            `Probe @${row.slug}: ${r.job_count} jobs${r.source?.error ? ` (${String(r.source.error)})` : ""}.`,
                          );
                          load();
                        } catch {
                          setMsg("Probe failed.");
                        } finally {
                          setBusy(null);
                        }
                      }}
                    >
                      Test
                    </button>
                    <button
                      type="button"
                      className="rounded border border-white/20 px-2 py-1 text-xs"
                      onClick={async () => {
                        setBusy(`refresh-${row.id}`);
                        try {
                          const r = await adminRefreshSyndicationFeed(row.id);
                          setMsg(`Refreshed @${row.slug}: ${r.job_count} jobs.`);
                          selectFeed(row.slug);
                          load();
                        } catch {
                          setMsg("Refresh failed.");
                        } finally {
                          setBusy(null);
                        }
                      }}
                    >
                      Refresh
                    </button>
                    <button
                      type="button"
                      className="rounded border border-red-500/40 px-2 py-1 text-xs text-red-300"
                      onClick={async () => {
                        if (!confirm(`Delete feed "${row.name}"?`)) return;
                        await adminDeleteSyndicationFeed(row.id);
                        load();
                        setMsg("Feed deleted.");
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {feeds.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No feeds yet. Add a URL above or run{" "}
            <code className="text-purple-300">php artisan db:seed --class=SyndicationFeedSeeder</code>
          </p>
        ) : null}
      </div>

      <div id="live-feed" ref={liveRef} className="mt-8 scroll-mt-24 space-y-6">
        {feeds.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {feeds.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => selectFeed(row.slug, false)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  selectedSlug === row.slug
                    ? "bg-emerald-500 text-zinc-950"
                    : "border border-white/15 bg-white/5 text-slate-300 hover:border-emerald-400/50"
                }`}
              >
                {row.name}
                <span className="ml-1 opacity-70">({row.last_job_count})</span>
              </button>
            ))}
          </div>
        ) : null}

        <SyndicationFeedDashboard
          feeds={feeds}
          selectedFeed={selectedFeed}
          jobs={analyticsJobs}
          loading={liveLoading}
        />

        <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">
              Jobs from this XML feed
              {selectedFeed ? (
                <span className="ml-2 text-base font-semibold text-emerald-300">
                  · {selectedFeed.name}
                </span>
              ) : null}
            </h2>
            {selectedFeed?.is_active ? (
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                Running
              </span>
            ) : selectedFeed ? (
              <span className="rounded-full bg-slate-500/20 px-3 py-1 text-xs font-semibold text-slate-400">
                Paused
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {selectedFeed
              ? `Sample of live XML jobs for ${selectedFeed.name} · ${liveTotal} total (showing ${liveJobs.length})`
              : "Click a feed name or View jobs to see its XML listings."}
          </p>
          {liveError ? (
            <p className="mt-4 text-sm text-amber-300">{liveError}</p>
          ) : liveLoading ? (
            <p className="mt-4 text-sm text-slate-500">Loading live jobs…</p>
          ) : liveJobs.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No live jobs in this feed right now.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {liveJobs.map((job) => (
                <li
                  key={String(job.reference_id)}
                  className="rounded-lg border border-white/10 px-3 py-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-zinc-100">{String(job.title ?? "Job")}</p>
                    <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                      {String(job.syndication_feed_name || selectedFeed?.name || "XML")}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-400">
                    {postedAgo(typeof job.publishdate === "string" ? job.publishdate : null)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {companyName(typeof job.company === "string" ? job.company : "", "Company")}
                    {" · "}
                    {String(job.location_label || job.location || "Remote")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
