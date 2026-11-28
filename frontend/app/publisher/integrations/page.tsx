"use client";

import Link from "next/link";
import { ArrowRight, Code2, FileCode2, Webhook } from "lucide-react";
import IntegrationSubnav from "@/components/publisher/integrations/IntegrationSubnav";
import PageHeader from "@/components/layout/PageHeader";

const cards = [
  {
    href: "/publisher/integrations/api",
    title: "API",
    icon: Code2,
    blurb:
      "Call Upclift with an API key to invite members, sync communities, and automate publisher workflows.",
    points: [
      "Generate & rotate API keys",
      "Create member invites by API",
      "Auth with Bearer / API key headers",
    ],
  },
  {
    href: "/publisher/integrations/xml",
    title: "XML",
    icon: FileCode2,
    blurb:
      "Pull or publish job/campaign data through a partner XML feed when Upclift provisions your feed URL.",
    points: [
      "Feed URL for your publisher code",
      "Use for job boards & aggregators",
      "No invented partner contracts",
    ],
  },
  {
    href: "/publisher/integrations/webhook",
    title: "Webhook",
    icon: Webhook,
    blurb:
      "Receive conversion events inbound, and optionally push outbound notifications to your own endpoint.",
    points: [
      "Inbound URL + webhook secret",
      "Outbound URL per credential",
      "Event log & dedupe by event_id",
    ],
  },
] as const;

export default function PublisherIntegrationsHubPage() {
  return (
    <>
      <PageHeader title="Integration guides" />
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          API & Integration
        </p>
        <p className="mt-2 max-w-2xl text-slate-500">
          Choose how your network connects to Upclift — API for automation, XML
          for feeds, or Webhooks for real-time events. Each mode has its own
          guide and tools.
        </p>
      </div>

      <IntegrationSubnav />

      <div className="grid gap-5 lg:grid-cols-3">
        {cards.map(({ href, title, icon: Icon, blurb, points }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <Icon size={20} />
            </span>
            <h2 className="mt-4 text-xl font-bold text-[#172b63]">{title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
              {blurb}
            </p>
            <ul className="mt-4 space-y-1.5 text-xs font-medium text-slate-500">
              {points.map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="text-violet-600">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-violet-700 group-hover:underline">
              Open {title} guide
              <ArrowRight size={14} />
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
