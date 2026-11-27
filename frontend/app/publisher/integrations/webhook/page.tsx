"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { ApiClientError } from "@/lib/api/client";
import {
  fetchPublisherIntegrations,
  updatePublisherIntegrationPreference,
  type PublisherIntegrations,
} from "@/lib/api/publisher";
import CredentialsPanel from "@/components/publisher/integrations/CredentialsPanel";
import GuideSteps from "@/components/publisher/integrations/GuideSteps";
import IntegrationSubnav from "@/components/publisher/integrations/IntegrationSubnav";
import SecretsBanner from "@/components/publisher/integrations/SecretsBanner";
import { PageSkeleton } from "@/components/ui/Skeleton";
import PageHeader from "@/components/layout/PageHeader";

export default function PublisherWebhookIntegrationPage() {
  const [data, setData] = useState<PublisherIntegrations | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secrets, setSecrets] = useState<{
    api_key: string;
    webhook_secret: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = () => {
    fetchPublisherIntegrations()
      .then((res) => {
        setData(res);
        if (res.integration_preference !== "webhook") {
          void updatePublisherIntegrationPreference("webhook").catch(() => null);
        }
      })
      .catch((err) =>
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load integrations.",
        ),
      );
  };

  useEffect(() => {
    load();
  }, []);

  async function copyText(label: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!data && !error) return <PageSkeleton />;

  return (
    <>
      <PageHeader title="Real-time event webhooks" />
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          Webhook integration
        </p>
        <p className="mt-2 max-w-2xl text-slate-500">
          Partners post conversion events to your inbound URL. You can also set
          an outbound URL so JobOrio notifies your system when events occur.
        </p>
      </div>

      <IntegrationSubnav />

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {secrets ? (
        <SecretsBanner
          secrets={secrets}
          copied={copied}
          onCopy={(label, value) => void copyText(label, value)}
        />
      ) : null}

      <GuideSteps
        title="How webhooks work"
        intro="Webhooks are HTTP callbacks. Unlike XML polling, events arrive as soon as the partner (or JobOrio) posts them."
        steps={[
          {
            title: "Copy your inbound URL",
            body: "Partners send POST requests to this URL. Include your webhook secret in the X-Joborio-Webhook-Secret header.",
          },
          {
            title: "Generate a webhook secret",
            body: "Create credentials below. The webhook secret authenticates inbound posts. Store it only on your server.",
          },
          {
            title: "Send unique event_id values",
            body: "Duplicate event_id values are ignored so retries stay safe. Include campaign / conversion payload fields your contract defines.",
          },
          {
            title: "Optional outbound URL",
            body: "Set an outbound webhook URL on a credential if you want JobOrio to push events to your own endpoint.",
          },
        ]}
      />

      {data ? (
        <>
          <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Inbound webhook URL</h2>
            <p className="mt-1 text-sm text-slate-500">
              POST partner events here. Authenticate with{" "}
              <code className="text-xs">X-Joborio-Webhook-Secret</code>.
            </p>
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="break-all font-mono text-sm font-medium text-[#172b63]">
                {data.inbound_webhook_url}
              </p>
              <button
                type="button"
                onClick={() =>
                  void copyText("inbound", data.inbound_webhook_url)
                }
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#172b63] px-4 py-2 text-xs font-bold text-white"
              >
                {copied === "inbound" ? <Check size={14} /> : <Copy size={14} />}
                {copied === "inbound" ? "Copied" : "Copy URL"}
              </button>
            </div>
          </section>

          <CredentialsPanel
            credentials={data.credentials}
            onChanged={load}
            onSecrets={setSecrets}
            showOutbound
          />

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Recent webhook events</h2>
            {data.webhook_events.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                No events yet. Send{" "}
                <code className="text-xs">X-Joborio-Webhook-Secret</code> with
                your payload to the inbound URL. Duplicate{" "}
                <code className="text-xs">event_id</code> values are ignored.
              </p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {data.webhook_events.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <p className="font-semibold text-[#172b63]">
                      {e.event_type} · {e.status} · {e.direction}
                    </p>
                    <p className="text-xs text-slate-500">
                      {e.external_event_id
                        ? `id ${e.external_event_id} · `
                        : ""}
                      {e.created_at
                        ? new Date(e.created_at).toLocaleString()
                        : ""}
                      {e.error_message ? ` · ${e.error_message}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </>
  );
}
