"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminCreateTrackedWebsite,
  adminDeleteTrackedWebsite,
  adminListTrackedWebsites,
  adminTrackedWebsiteDetail,
  type TrackedWebsiteRow,
} from "@/lib/api/admin";
import { API_BASE_URL } from "@/lib/config";
import {
  AdminAlert,
  AdminButton,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/admin-ui";

export default function AdminWebsiteTrackingPage() {
  const [sites, setSites] = useState<TrackedWebsiteRow[]>([]);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<{
    stats: Record<string, number>;
    recent_events: Array<Record<string, unknown>>;
  } | null>(null);

  const load = useCallback(() => {
    adminListTrackedWebsites()
      .then(setSites)
      .catch(() => setMsg("Could not load tracked websites."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadDetail = (id: number) => {
    setSelectedId(id);
    adminTrackedWebsiteDetail(id)
      .then((r) =>
        setDetail({ stats: r.stats, recent_events: r.recent_events }),
      )
      .catch(() => setDetail(null));
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await adminCreateTrackedWebsite({
        name: name.trim(),
        domain: domain.trim(),
      });
      setName("");
      setDomain("");
      setMsg("Website added. Copy the embed code below into your site <head>.");
      load();
    } catch {
      setMsg("Create failed — check name and domain.");
    }
  };

  const copySnippet = async (snippet: string) => {
    try {
      await navigator.clipboard.writeText(snippet);
      setMsg("Embed code copied to clipboard.");
    } catch {
      setMsg("Copy failed — select the code manually.");
    }
  };

  const selected = sites.find((s) => s.id === selectedId);

  return (
    <>
      <AdminPageHeader
        title="Website tracking"
        description="Add external sites and install the JobOrio script (like Search Console / Analytics). Page views are sent to the API."
      />

      {msg ? (
        <div className="mt-4">
          <AdminAlert tone="info">{msg}</AdminAlert>
        </div>
      ) : null}

      <p className="mt-4 text-xs text-zinc-500">
        API base used in snippets: <code className="text-amber-500/90">{API_BASE_URL}</code>{" "}
        (set <code>APP_URL</code> on the server if links are wrong)
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <AdminPanel title="Add website">
          <form onSubmit={create} className="space-y-4">
            <label className="block text-sm">
              <span className="font-semibold text-zinc-300">Site name</span>
              <AdminInput
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My careers blog"
                className="mt-1"
              />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-zinc-300">Domain</span>
              <AdminInput
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                className="mt-1"
              />
            </label>
            <AdminButton type="submit">Create tracking property</AdminButton>
          </form>
        </AdminPanel>

        <AdminPanel title="How it works">
          <ol className="list-decimal space-y-2 pl-4 text-sm text-zinc-400">
            <li>Create a property for each domain you own.</li>
            <li>Copy the embed script into <code>&lt;head&gt;</code> on every page.</li>
            <li>Page views appear here within seconds.</li>
            <li>
              Optional: call <code>joborioTrack(&apos;event_name&apos;, &#123; &#125;)</code> for
              custom events.
            </li>
          </ol>
        </AdminPanel>
      </div>

      <div className="mt-10 space-y-4">
        {sites.length === 0 ? (
          <p className="text-sm text-zinc-500">No properties yet.</p>
        ) : (
          sites.map((site) => (
            <div
              key={site.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-zinc-100">{site.name}</p>
                  <p className="text-sm text-zinc-500">{site.domain}</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Key: {site.public_key} · Pageviews: {site.pageviews_count ?? 0} · Last:{" "}
                    {site.last_event_at
                      ? new Date(site.last_event_at).toLocaleString()
                      : "—"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <AdminButton
                    type="button"
                    variant="secondary"
                    onClick={() => loadDetail(site.id)}
                  >
                    View hits
                  </AdminButton>
                  <AdminButton
                    type="button"
                    variant="secondary"
                    onClick={() => copySnippet(site.embed_snippet)}
                  >
                    Copy embed code
                  </AdminButton>
                  <AdminButton
                    type="button"
                    variant="secondary"
                    onClick={async () => {
                      if (!confirm("Delete this property and all its events?")) return;
                      await adminDeleteTrackedWebsite(site.id);
                      load();
                      if (selectedId === site.id) {
                        setSelectedId(null);
                        setDetail(null);
                      }
                    }}
                  >
                    Delete
                  </AdminButton>
                </div>
              </div>
              <pre className="mt-4 overflow-x-auto rounded-lg bg-zinc-950 p-3 text-xs text-emerald-400/90">
                {site.embed_snippet}
              </pre>
              <p className="mt-2 text-xs text-zinc-600">{site.install_note}</p>
            </div>
          ))
        )}
      </div>

      {selected && detail ? (
        <section className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-lg font-bold text-zinc-100">
            Hits — {selected.name}
          </h2>
          <div className="mt-4 flex flex-wrap gap-6 text-sm">
            <span>Pageviews (7d): {detail.stats.pageviews_7d ?? 0}</span>
            <span>All events (7d): {detail.stats.events_7d ?? 0}</span>
            <span>Unique URLs (7d): {detail.stats.unique_pages_7d ?? 0}</span>
          </div>
          <ul className="mt-6 max-h-96 space-y-2 overflow-y-auto text-sm">
            {detail.recent_events.length === 0 ? (
              <li className="text-zinc-500">No events yet — install the script and visit the site.</li>
            ) : (
              detail.recent_events.map((ev) => (
                <li
                  key={String(ev.id)}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2"
                >
                  <span className="font-medium text-zinc-200">
                    {String(ev.event_type)}
                  </span>
                  {" · "}
                  <span className="text-zinc-400">{String(ev.page_url ?? "")}</span>
                  <span className="mt-0.5 block text-xs text-zinc-600">
                    {String(ev.created_at)} · {String(ev.geo_country ?? "")}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      ) : null}
    </>
  );
}
