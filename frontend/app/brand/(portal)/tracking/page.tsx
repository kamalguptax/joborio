"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createEmployerApiKey,
  fetchEmployerTracking,
  generateEmployerTrackingLink,
  revokeEmployerApiKey,
  sendEmployerTrackingTest,
} from "@/lib/api/employer";
import { ApiClientError } from "@/lib/api/client";
import { toast } from "@/components/ui/Toast";
import PageHeader from "@/components/layout/PageHeader";

const PAYLOADS: Record<string, string> = {
  registration: `{
  "event": "registration",
  "event_id": "evt_01JD4Q8X2K",
  "click_id": "clk_8f3a2c91",
  "campaign_id": "JO-C-…",
  "timestamp": "2026-11-25T07:21:10Z",
  "status": "received"
}`,
  lead: `{
  "event": "qualified_lead",
  "event_id": "evt_01JD4Q9A7M",
  "click_id": "clk_77b1e0aa",
  "status": "verified"
}`,
  approved: `{
  "event": "conversion_status",
  "status": "approved",
  "billable_amount": 65
}`,
};

export default function EmployerTrackingPage() {
  const [programId, setProgramId] = useState<number | "">("");
  const [dest, setDest] = useState("");
  const [sub1, setSub1] = useState("");
  const [sub2, setSub2] = useState("");
  const [link, setLink] = useState("");
  const [testLabel, setTestLabel] = useState("Not run");
  const [payloadTab, setPayloadTab] = useState("registration");
  const [diag, setDiag] = useState<Array<{ k: string; v: string }>>([]);
  const [keys, setKeys] = useState<
    Array<{
      id: number;
      mask: string;
      created: string;
      status: string;
      can_revoke: boolean;
    }>
  >([]);
  const [programs, setPrograms] = useState<
    Array<{ id: number; code: string; title: string }>
  >([]);
  const [newSecret, setNewSecret] = useState("");

  const load = useCallback(() => {
    fetchEmployerTracking()
      .then((d) => {
        setDiag(d.diagnostics ?? []);
        setKeys(d.keys ?? []);
        setPrograms(d.programs ?? []);
        if (!programId && d.programs?.[0]) {
          setProgramId(d.programs[0].id);
        }
      })
      .catch(() => toast.error("Could not load tracking."));
  }, [programId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PageHeader title="Tracking and integrations" />
      <div>
        <p className="mt-1 text-sm text-slate-500">
          Generate campaign-level links, check diagnostics, manage API keys.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#0A2150]">
            Tracking link generator
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold uppercase text-slate-400 sm:col-span-2">
              Campaign
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={programId}
                onChange={(e) =>
                  setProgramId(e.target.value ? Number(e.target.value) : "")
                }
              >
                <option value="">Select campaign</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold uppercase text-slate-400 sm:col-span-2">
              Destination URL (optional override)
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={dest}
                onChange={(e) => setDest(e.target.value)}
                placeholder="https://…"
              />
            </label>
            <label className="block text-xs font-semibold uppercase text-slate-400">
              Sub ID 1
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={sub1}
                onChange={(e) => setSub1(e.target.value)}
              />
            </label>
            <label className="block text-xs font-semibold uppercase text-slate-400">
              Sub ID 2
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={sub2}
                onChange={(e) => setSub2(e.target.value)}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={async () => {
              if (!programId) {
                toast.error("Select a campaign.");
                return;
              }
              try {
                const res = await generateEmployerTrackingLink({
                  program_id: Number(programId),
                  destination_url: dest || undefined,
                  sub1: sub1 || undefined,
                  sub2: sub2 || undefined,
                });
                setLink(res.link);
                toast.success("Link generated.");
              } catch (err) {
                toast.error(
                  err instanceof ApiClientError
                    ? err.message
                    : "Could not generate link.",
                );
              }
            }}
            className="mt-4 rounded-full bg-violet-600 px-4 py-2 text-sm font-bold text-white"
          >
            Generate link
          </button>
          {link ? (
            <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-50 p-3 text-[11px] text-slate-700">
              {link}
            </pre>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#0A2150]">Diagnostics</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {diag.map((d) => (
              <div
                key={d.k}
                className="flex justify-between gap-3 border-b border-slate-50 py-1"
              >
                <dt className="text-slate-400">{d.k}</dt>
                <dd className="font-medium text-[#0A2150]">{d.v}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-3 border-b border-slate-50 py-1">
              <dt className="text-slate-400">Test conversion</dt>
              <dd className="font-medium text-[#0A2150]">{testLabel}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={async () => {
              try {
                const res = await sendEmployerTrackingTest(
                  programId ? Number(programId) : undefined,
                );
                setTestLabel(`Passed · ${res.event_id}`);
                toast.success(res.message);
                load();
              } catch (err) {
                setTestLabel("Failed");
                toast.error(
                  err instanceof ApiClientError ? err.message : "Test failed.",
                );
              }
            }}
            className="mt-4 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold"
          >
            Send test conversion
          </button>
        </section>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#0A2150]">API keys</h2>
          {newSecret ? (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
              Copy this secret now. It is shown once.
              <pre className="mt-2 overflow-x-auto text-xs">{newSecret}</pre>
              <button
                type="button"
                className="mt-2 text-xs font-bold text-violet-700"
                onClick={() => setNewSecret("")}
              >
                I have saved it
              </button>
            </div>
          ) : null}
          <table className="mt-2 min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                <th className="px-2 py-2">Key</th>
                <th className="px-2 py-2">Created</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-b border-slate-100">
                  <td className="px-2 py-2 font-mono text-xs">{k.mask}</td>
                  <td className="px-2 py-2">{k.created}</td>
                  <td className="px-2 py-2">{k.status}</td>
                  <td className="px-2 py-2">
                    {k.can_revoke ? (
                      <button
                        type="button"
                        className="text-xs font-bold text-rose-600"
                        onClick={async () => {
                          try {
                            await revokeEmployerApiKey(k.id);
                            toast.info("Key revoked.");
                            load();
                          } catch (err) {
                            toast.error(
                              err instanceof ApiClientError
                                ? err.message
                                : "Revoke failed.",
                            );
                          }
                        }}
                      >
                        Revoke
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            onClick={async () => {
              try {
                const res = await createEmployerApiKey();
                setNewSecret(res.secret);
                toast.success(res.message);
                load();
              } catch (err) {
                toast.error(
                  err instanceof ApiClientError
                    ? err.message
                    : "Could not create key.",
                );
              }
            }}
            className="mt-3 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold"
          >
            Create API key
          </button>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#0A2150]">Example payloads</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.keys(PAYLOADS).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPayloadTab(p)}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  payloadTab === p
                    ? "bg-violet-600 text-white"
                    : "border border-slate-200 text-slate-600"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-50 p-3 text-[11px] text-slate-700">
            {PAYLOADS[payloadTab]}
          </pre>
          <p className="mt-2 text-xs text-slate-500">
            Every request carries an HMAC-SHA256 signature of the raw body, a
            timestamp (replay window 5 minutes) and a unique event_id for
            idempotency.
          </p>
        </section>
      </div>
    </>
  );
}
