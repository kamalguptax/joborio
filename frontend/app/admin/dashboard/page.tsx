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
import { PageSkeleton } from "@/components/ui/Skeleton";
import { adminNavGroups, adminPath } from "@/lib/adminNav";

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
    return <PageSkeleton />;
  }

  const c = data.counts;
  const users = adminPath("/admin/users");
  const creators = adminPath("/admin/users/?role=creator");
  const employers = adminPath("/admin/users/?role=employer");
  const pending = adminPath("/admin/users/?approval=pending");
  const listings = adminPath("/admin/listings");
  const jobs = adminPath("/admin/jobs");
  const feeds = adminPath("/admin/syndication-feeds");
  const activity = adminPath("/admin/activity");
  const activityDedup = adminPath("/admin/activity/?fraud=dedup");
  const fraud = adminPath("/admin/fraud");
  const publishers = adminPath("/admin/publishers");
  const payouts = adminPath("/admin/payouts");
  const programs = adminPath("/admin/programs");
  const signups = adminPath("/admin/activity/?panel=signups");

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Every card and shortcut opens that admin section."
        actions={
          <>
            <AdminLinkButton
              href={adminPath("/admin/campaign-earnings")}
              variant="primary"
            >
              Campaign earnings
            </AdminLinkButton>
            <AdminLinkButton href={adminPath("/admin/users/?approval=pending")}>
              Pending creators
            </AdminLinkButton>
            <AdminLinkButton href={adminPath("/admin/campaigns/?mode=trial")}>
              Trial post (no IP)
            </AdminLinkButton>
          </>
        }
      />

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="Users" value={c.users ?? 0} href={users} />
        <AdminStatCard label="Creators" value={c.creators ?? 0} href={creators} />
        <AdminStatCard label="Employers" value={c.employers ?? 0} href={employers} />
        <AdminStatCard
          label="Pending approval"
          value={c.creators_pending ?? c.pending_approval ?? 0}
          href={pending}
        />
        <AdminStatCard label="Publishers" value={c.publishers ?? 0} href={publishers} />
        <AdminStatCard label="Active listings" value={c.listings_active ?? 0} href={listings} />
        <AdminStatCard label="XML jobs (cache)" value={c.syndication_jobs ?? 0} href={jobs} />
        <AdminStatCard label="Active feeds" value={c.syndication_feeds ?? 0} href={feeds} />
        <AdminStatCard label="Programs" value={c.programs ?? 0} href={programs} />
        <AdminStatCard label="Tracked events" value={c.attribution_events ?? 0} href={activity} />
        <AdminStatCard
          label="Duplicate clicks"
          value={c.clicks_duplicate ?? 0}
          href={activityDedup}
          hint={
            data.click_dedup_minutes
              ? `${data.click_dedup_minutes}m IP+device window`
              : "IP + device window"
          }
        />
        <AdminStatCard
          label="Open fraud"
          value={c.fraud_open ?? 0}
          href={fraud}
          hint={c.fraud_open ? "Needs review" : undefined}
        />
        <AdminStatCard label="Payouts" value={c.payouts_open ?? c.payout_batches ?? 0} href={payouts} />
        <AdminStatCard
          label="Campaign earnings"
          value="Open →"
          href={adminPath("/admin/campaign-earnings")}
          hint="Earnings by campaign"
        />
      </div>

      <section className="mt-8 space-y-6">
        <h2 className="text-sm font-semibold text-zinc-200">All sections — click to open</h2>
        {adminNavGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
              {group.label}
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {group.items.map((item) => (
                <Link
                  key={`${item.label}-${item.href}`}
                  href={adminPath(item.href)}
                  className="group rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 transition hover:border-amber-500/50 hover:bg-zinc-800"
                >
                  <p className="flex items-center justify-between gap-2 text-sm font-semibold text-zinc-100">
                    <span>{item.label}</span>
                    <span className="text-xs font-semibold text-amber-500/80 opacity-80 group-hover:opacity-100">
                      Open →
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      {(data.syndication_feeds?.length ?? 0) > 0 ? (
        <section className="mt-8 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-4 py-3">
            <Link
              href={feeds}
              className="text-sm font-semibold text-zinc-200 hover:text-amber-400"
            >
              XML syndication feeds →
            </Link>
            <Link
              href={feeds}
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
                      href={adminPath(
                        `/admin/syndication-feeds/?feed=${encodeURIComponent(f.slug)}#live-feed`,
                      )}
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
        <AdminPanel title="Recent clicks" href={activity}>
          <ul className="space-y-2 text-sm">
            {(data.recent_clicks ?? []).length === 0 ? (
              <li className="text-zinc-600">No click events yet.</li>
            ) : (
              data.recent_clicks.map((row) => (
                <li key={String(row.id)}>
                  <Link
                    href={activity}
                    className="block rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 transition hover:border-amber-500/50 hover:bg-zinc-800"
                  >
                    <span className="font-medium text-zinc-200">
                      {String(row.event_type ?? "event")}
                    </span>
                    {" · "}
                    {String((row.listing as { title?: string })?.title ?? "Listing")}
                    {" · "}@
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
        <AdminPanel title="Recent PPR signups" href={signups}>
          <ul className="space-y-2 text-sm">
            {(data.recent_signups ?? []).length === 0 ? (
              <li className="text-zinc-600">No registrations yet.</li>
            ) : (
              data.recent_signups.map((row) => (
                <li key={String(row.id)}>
                  <Link
                    href={signups}
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
