"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { ApiClientError } from "@/lib/api/client";
import {
  fetchPublisherIntegrations,
  updatePublisherIntegrationPreference,
  type PublisherIntegrations,
} from "@/lib/api/publisher";
import GuideSteps from "@/components/publisher/integrations/GuideSteps";
import IntegrationSubnav from "@/components/publisher/integrations/IntegrationSubnav";
import { PageSkeleton } from "@/components/ui/Skeleton";
import PageHeader from "@/components/layout/PageHeader";

export default function PublisherXmlIntegrationPage() {
  const [data, setData] = useState<PublisherIntegrations | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchPublisherIntegrations()
      .then((res) => {
        setData(res);
        if (res.integration_preference !== "xml") {
          void updatePublisherIntegrationPreference("xml").catch(() => null);
        }
      })
      .catch((err) =>
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load integrations.",
        ),
      );
  }, []);

  async function copyUrl() {
    if (!data?.xml_feed_hint) return;
    await navigator.clipboard.writeText(data.xml_feed_hint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!data && !error) return <PageSkeleton />;

  return (
    <>
      <PageHeader title="Partner XML feeds" />
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          XML integration
        </p>
        <p className="mt-2 max-w-2xl text-slate-500">
          XML is for publishers and partners that exchange jobs or campaign data
          as a feed. Upclift does not invent partner contracts — use the URL
          when your feed is provisioned.
        </p>
      </div>

      <IntegrationSubnav />

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <GuideSteps
        title="How XML integration works"
        intro="An XML feed is a structured file (or live URL) listing jobs or opportunities. Aggregators and your own systems can poll it on a schedule."
        steps={[
          {
            title: "Get your feed hint URL",
            body: "Each publisher has a dedicated XML path based on your publisher code. Copy it below once Upclift (or your partner) provisions the feed.",
          },
          {
            title: "Confirm the partner contract",
            body: "Field names, update frequency, and authentication depend on the partner agreement. Do not assume a generic schema until it is documented for your account.",
          },
          {
            title: "Attach XML jobs to communities",
            body: "In Communities → Jobs & campaigns, choose “XML jobs” to select live syndicated/XML jobs for your network members to promote.",
          },
          {
            title: "Monitor freshness",
            body: "Stale feeds hurt performance. Refresh syndication in Admin when feeds update, and verify titles/rates look correct before promoting.",
          },
        ]}
      />

      {data ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#172b63]">Your XML feed URL</h2>
          <p className="mt-1 text-sm text-slate-500">
            Partner XML contracts are not fabricated — use when a feed is
            provisioned for this publisher.
          </p>
          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="break-all font-mono text-sm font-medium text-[#172b63]">
              {data.xml_feed_hint}
            </p>
            <button
              type="button"
              onClick={() => void copyUrl()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#172b63] px-4 py-2 text-xs font-bold text-white"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy URL"}
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm text-amber-950">
              <p className="font-bold">What XML is for</p>
              <p className="mt-1 text-amber-900/90">
                Bulk job distribution to boards, ATS partners, or your CMS —
                typically scheduled pulls, not real-time clicks.
              </p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm text-sky-950">
              <p className="font-bold">When to prefer API / Webhook</p>
              <p className="mt-1 text-sky-900/90">
                Use <strong>API</strong> for invites and automation; use{" "}
                <strong>Webhook</strong> for instant conversion events.
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
