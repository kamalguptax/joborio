"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminOverview, type AdminOverview } from "@/lib/api/admin";
import {
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
  AdminLinkButton,
  AdminAlert,
} from "@/components/admin/admin-ui";

const quickLinks = [
  { href: "/admin/users", label: "Users", desc: "Accounts & roles" },
  { href: "/admin/users/?role=creator", label: "Creators", desc: "Creator profiles" },
  { href: "/admin/users/?approval=pending", label: "Pending approval", desc: "Review new creators" },
  { href: "/admin/users/?role=employer", label: "Employers", desc: "Company accounts" },
  { href: "/admin/syndication-feeds", label: "XML feeds", desc: "Live job feeds" },
  { href: "/admin/jobs", label: "Jobs catalog", desc: "Cached XML jobs" },
  { href: "/admin/listings", label: "Listings", desc: "Active listings" },
  { href: "/admin/job-masters", label: "Filter masters", desc: "Job filters" },
  { href: "/admin/activity", label: "Activity", desc: "Clicks & signups" },
  { href: "/admin/geo", label: "Geo map", desc: "Traffic map" },
  { href: "/admin/website-tracking", label: "Website tracking", desc: "Embed sites" },
  { href: "/admin/campaigns", label: "Manual campaigns", desc: "Jobs · Courses · Tools" },
  { href: "/admin/programs", label: "Programs", desc: "All employer programs" },
  { href: "/admin/campaign-earnings", label: "Campaign earnings", desc: "Earn by campaign" },
  { href: "/admin/payouts", label: "Payouts", desc: "Batches & pay" },
  { href: "/admin/fraud", label: "Fraud queue", desc: "Review flags" },
  { href: "/admin/disputes", label: "Disputes", desc: "Open cases" },
  { href: "/admin/settings", label: "Platform settings", desc: "Rates & currency" },
];

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminOverview()
      .then(setData)
      .catch(() => setError("Failed to load overview"));
  }, []);

  if (error) {
    return <AdminAlert tone="error">{error}</AdminAlert>;
  }

  if (!data) {
    return (
      <p className="text-sm text-zinc-500">Loading dashboard…</p>
    );
  }

  const c = data.counts;

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Click any card or shortcut to open that section."
        actions={
          <>
            <AdminLinkButton href="/admin/syndication-feeds" variant="primary">
              XML feeds
            </AdminLinkButton>
            <AdminLinkButton href="/admin/fraud">Fraud queue</AdminLinkButton>
            <AdminLinkButton href="/admin/users">Users</AdminLinkButton>
          </>
        }
      />

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="Users" value={c.users ?? 0} href="/admin/users" />
        <AdminStatCard label="Creators" value={c.creators ?? 0} href="/admin/users/?role=creator" />
        <AdminStatCard label="Employers" value={c.employers ?? 0} href="/admin/users/?role=employer" />
        <AdminStatCard label="Active listings" value={c.listings_active ?? 0} href="/admin/listings" />
        <AdminStatCard label="XML jobs (cache)" value={c.syndication_jobs ?? 0} href="/admin/jobs" />
        <AdminStatCard
          label="Active feeds"
          value={c.syndication_feeds ?? 0}
          href="/admin/syndication-feeds"
        />
        <AdminStatCard label="Tracked events" value={c.attribution_events ?? 0} href="/admin/activity" />
        <AdminStatCard
          label="Duplicate clicks"
          value={c.clicks_duplicate ?? 0}
          href="/admin/activity/?fraud=dedup"
          hint={
            data.click_dedup_minutes
              ? `${data.click_dedup_minutes}m IP+device window`
              : "IP + device window"
          }
        />
        <AdminStatCard
          label="Open fraud"
          value={c.fraud_open ?? 0}
          href="/admin/fraud"
          hint={c.fraud_open ? "Needs review" : undefined}
        />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-zinc-200">All sections</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 transition hover:border-amber-500/50 hover:bg-zinc-800"
            >
              <p className="text-sm font-semibold text-zinc-100">{item.label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {(data.syndication_feeds?.length ?? 0) > 0 ? (
        <section className="mt-8 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-4 py-3">
            <Link
              href="/admin/syndication-feeds"
              className="text-sm font-semibold text-zinc-200 hover:text-amber-400"
            >
              XML syndication feeds →
            </Link>
            <Link
              href="/admin/syndication-feeds"
              className="text-xs font-semibold text-amber-500 hover:text-amber-400"
            >
              Manage →
            </Link>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-zinc-600">
              <tr>
                <th className="px-4 py-2 font-semibold">Name</th>
                <th className="px-4 py-2 font-semibold">Jobs</th>
                <th className="px-4 py-2 font-semibold">Last fetch</th>
                <th className="px-4 py-2 font-semibold">Error</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {data.syndication_feeds!.map((f) => (
                <tr key={f.id} className="border-t border-zinc-800/80 hover:bg-zinc-800/40">
                  <td className="px-4 py-2.5" colSpan={4}>
                    <Link
                      href={`/admin/syndication-feeds/?feed=${encodeURIComponent(f.slug)}#live-feed`}
                      className="grid grid-cols-[minmax(0,1.4fr)_0.5fr_1fr_1fr] items-center gap-2"
                      title={`View jobs from ${f.name}`}
                    >
                      <span className="font-medium text-zinc-100 hover:text-amber-400">
                        {f.name}
                        {!f.is_active ? (
                          <span className="ml-2 text-xs text-zinc-600">(paused)</span>
                        ) : null}
                      </span>
                      <span className="tabular-nums">{f.last_job_count}</span>
                      <span className="text-xs text-zinc-500">
                        {f.last_fetched_at
                          ? new Date(f.last_fetched_at).toLocaleString()
                          : "—"}
                      </span>
                      <span className="text-xs text-red-400/90">{f.last_error ?? "—"}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <AdminPanel title="Recent clicks" href="/admin/activity">
          <ul className="space-y-2 text-sm">
            {(data.recent_clicks ?? []).length === 0 ? (
              <li className="text-zinc-600">No click events yet.</li>
            ) : (
              data.recent_clicks.map((row) => (
                <li key={String(row.id)}>
                  <Link
                    href="/admin/activity"
                    className="block rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 transition hover:border-amber-500/50 hover:bg-zinc-800"
                  >
                  <span className="font-medium text-zinc-200">
                    {String(row.event_type ?? "event")}
                  </span>
                  {" · "}
                  {String((row.listing as { title?: string })?.title ?? "Listing")}
                  {" · "}
                  @
                  {String((row.creator as { handle?: string })?.handle ?? "creator")}
                  <span className="mt-0.5 block text-xs text-zinc-600">
                    {String(row.created_at ?? "")}
                    {row.fraud_status === "dedup" ? (
                      <span className="text-amber-500/90"> · duplicate (not paid)</span>
                    ) : row.is_counted === false ? (
                      " · not counted"
                    ) : (
                      " · counted"
                    )}
                  </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </AdminPanel>
        <AdminPanel title="Recent PPR signups" href="/admin/activity/?panel=signups">
          <ul className="space-y-2 text-sm">
            {(data.recent_signups ?? []).length === 0 ? (
              <li className="text-zinc-600">No registrations yet.</li>
            ) : (
              data.recent_signups.map((row) => (
                <li key={String(row.id)}>
                  <Link
                    href="/admin/activity/?panel=signups"
                    className="block rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 transition hover:border-amber-500/50 hover:bg-zinc-800"
                  >
                  {String(row.email ?? "email")}
                  {" · "}
                  {String((row.listing as { title?: string })?.title ?? "Listing")}
                  <span className="mt-0.5 block text-xs text-zinc-600">
                    {String(row.status ?? "")} · {String(row.created_at ?? "")}
                  </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </AdminPanel>
      </div>
    </>
  );
}
