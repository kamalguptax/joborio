"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiClientError } from "@/lib/api/client";
import {
  absoluteSiteUrl,
  createPublisherMemberInvite,
  fetchPublisherIntegrations,
  updatePublisherIntegrationPreference,
  type PublisherIntegrations,
} from "@/lib/api/publisher";
import CredentialsPanel from "@/components/publisher/integrations/CredentialsPanel";
import GuideSteps from "@/components/publisher/integrations/GuideSteps";
import IntegrationSubnav from "@/components/publisher/integrations/IntegrationSubnav";
import SecretsBanner from "@/components/publisher/integrations/SecretsBanner";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";
import PageHeader from "@/components/layout/PageHeader";

const field =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#172b63] outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10";

export default function PublisherApiIntegrationPage() {
  const [data, setData] = useState<PublisherIntegrations | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secrets, setSecrets] = useState<{
    api_key: string;
    webhook_secret: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberInviteUrl, setMemberInviteUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    fetchPublisherIntegrations()
      .then((res) => {
        setData(res);
        if (res.integration_preference !== "api") {
          void updatePublisherIntegrationPreference("api").catch(() => null);
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

  async function onApiMember(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMemberInviteUrl(null);
    try {
      const res = await createPublisherMemberInvite({
        email: memberEmail.trim(),
      });
      setMemberInviteUrl(
        absoluteSiteUrl(res.invitation?.path, res.invite_url) || res.invite_url,
      );
      setMemberEmail("");
      toast.success("Invite created.");
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Could not create API invite.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!data && !error) return <PageSkeleton />;

  return (
    <>
      <PageHeader title="Connect with API keys" />
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          API integration
        </p>
        <p className="mt-2 max-w-2xl text-slate-500">
          Use Upclift APIs to automate member invites and publisher workflows.
          Keep keys private — rotate or revoke anytime.
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
        title="How API integration works"
        intro="Your server calls Upclift with an API key. Upclift never stores the raw key after creation — only a hash — so copy it when it appears."
        steps={[
          {
            title: "Generate credentials",
            body: "Create a named key below. You receive an API key (and a webhook secret for related event signing).",
          },
          {
            title: "Authenticate requests",
            body: "Send the API key on protected publisher endpoints (Authorization Bearer or the project’s documented API-key header). Never embed keys in browser code.",
          },
          {
            title: "Invite members by API",
            body: "Use the member-invite tool (or your own client) to create pending invites. Duplicates are rejected safely on retry.",
          },
          {
            title: "Rotate when needed",
            body: "If a key leaks, rotate or revoke it here. Old keys stop working immediately after revoke.",
          },
        ]}
      />

      {data ? (
        <>
          <CredentialsPanel
            credentials={data.credentials}
            onChanged={load}
            onSecrets={setSecrets}
            showOutbound={false}
          />

          <form
            onSubmit={onApiMember}
            className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold">API member creation</h2>
            <p className="mt-1 text-sm text-slate-500">
              Creates a pending invite via the API channel (safe retry —
              duplicates rejected).
            </p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Email
              <input
                type="email"
                required
                className={field}
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="mt-4 rounded-full bg-[#172b63] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              Create invite
            </button>
            {memberInviteUrl ? (
              <p className="mt-3 break-all text-sm text-emerald-800">
                {memberInviteUrl}
              </p>
            ) : null}
          </form>
        </>
      ) : null}
    </>
  );
}
