"use client";

import type { SyndicationFeedRow } from "@/lib/api/admin";
import {
  aggregateFeedJobs,
  type FeedCountRow,
  type FeedJobStats,
} from "@/lib/admin/feedJobStats";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-50">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function BarChart({
  title,
  rows,
  accent = "bg-emerald-500",
}: {
  title: string;
  rows: FeedCountRow[];
  accent?: string;
}) {
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4">
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-4 text-xs text-slate-500">No data yet.</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-slate-300" title={row.label}>
                  {row.label}
                </span>
                <span className="shrink-0 tabular-nums text-slate-400">
                  {row.count}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${accent} transition-all duration-500`}
                  style={{ width: `${Math.max(4, (row.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CountTable({
  title,
  rows,
}: {
  title: string;
  rows: FeedCountRow[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <div className="border-b border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-200">
        {title}
      </div>
      <table className="w-full text-left text-sm">
        <thead className="text-[11px] uppercase text-slate-500">
          <tr>
            <th className="px-4 py-2 font-semibold">Name</th>
            <th className="px-4 py-2 font-semibold text-right">Jobs</th>
            <th className="px-4 py-2 font-semibold text-right">Share</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                No rows
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const total = rows.reduce((s, r) => s + r.count, 0) || 1;
              return (
                <tr key={row.label} className="border-t border-white/5">
                  <td className="max-w-[220px] truncate px-4 py-2 text-zinc-200">
                    {row.label}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-300">
                    {row.count}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-500">
                    {Math.round((row.count / total) * 100)}%
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function SyndicationFeedDashboard({
  feeds,
  selectedFeed,
  jobs,
  loading,
}: {
  feeds: SyndicationFeedRow[];
  selectedFeed: SyndicationFeedRow | null;
  jobs: Array<Record<string, unknown>>;
  loading?: boolean;
}) {
  const stats: FeedJobStats = aggregateFeedJobs(jobs);
  const feedBars: FeedCountRow[] = feeds
    .map((f) => ({ label: f.name, count: f.last_job_count ?? 0 }))
    .sort((a, b) => b.count - a.count);
  const allJobsCached = feeds.reduce((s, f) => s + (f.last_job_count ?? 0), 0);
  const activeFeeds = feeds.filter((f) => f.is_active).length;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-50">All feeds overview</h2>
            <p className="mt-1 text-sm text-slate-400">
              Totals across every XML source (JobRapido, WhatsJobs, and others you add).
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Configured feeds" value={feeds.length} />
          <StatCard label="Active feeds" value={activeFeeds} />
          <StatCard label="Jobs (last fetch)" value={allJobsCached} />
          <StatCard
            label="Avg jobs / feed"
            value={feeds.length ? Math.round(allJobsCached / feeds.length) : 0}
          />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <BarChart title="Jobs by feed" rows={feedBars} accent="bg-amber-400" />
          <CountTable title="Feed job counts" rows={feedBars} />
        </div>
      </section>

      <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-50">
              Feed dashboard
              {selectedFeed ? (
                <span className="ml-2 text-base font-semibold text-emerald-300">
                  · {selectedFeed.name}
                </span>
              ) : null}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {selectedFeed
                ? `Live breakdown for @${selectedFeed.slug}`
                : "Select a feed to see its dashboard."}
            </p>
          </div>
          {selectedFeed ? (
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
              {selectedFeed.is_active ? "Running" : "Paused"}
            </span>
          ) : null}
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-slate-500">Loading feed analytics…</p>
        ) : !selectedFeed ? (
          <p className="mt-6 text-sm text-slate-500">Choose a feed from the table below.</p>
        ) : (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
              <StatCard label="Total jobs" value={stats.total} />
              <StatCard label="Companies" value={stats.companies} />
              <StatCard label="Categories" value={stats.categories} />
              <StatCard label="Locations" value={stats.locations} />
              <StatCard label="States" value={stats.states} />
              <StatCard label="Countries" value={stats.countries} />
              <StatCard label="Job types" value={stats.jobTypes} />
              <StatCard
                label="With email"
                value={stats.withEmail}
                hint={stats.samples ? `${stats.samples} sample` : undefined}
              />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <BarChart title="Top categories" rows={stats.topCategories} />
              <BarChart
                title="Top locations"
                rows={stats.topLocations}
                accent="bg-sky-400"
              />
              <BarChart
                title="Top companies"
                rows={stats.topCompanies}
                accent="bg-violet-400"
              />
              <BarChart
                title="Posted age"
                rows={stats.postedBuckets}
                accent="bg-rose-400"
              />
              <BarChart
                title="Top states"
                rows={stats.topStates}
                accent="bg-teal-400"
              />
              <BarChart
                title="Job types"
                rows={stats.topJobTypes}
                accent="bg-orange-400"
              />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <CountTable title="Categories (table)" rows={stats.topCategories} />
              <CountTable title="Companies (table)" rows={stats.topCompanies} />
              <CountTable title="Locations (table)" rows={stats.topLocations} />
              <CountTable title="Posted age (table)" rows={stats.postedBuckets} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
