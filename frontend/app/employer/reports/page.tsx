"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createEmployerComplaint,
  fetchEmployerComplaints,
  fetchEmployerPrograms,
} from "@/lib/api/employer";
import { ApiClientError } from "@/lib/api/client";
import { toast } from "@/components/ui/Toast";
import PageHeader from "@/components/layout/PageHeader";

const WORKFLOW = [
  "Submitted",
  "Received",
  "Triaged",
  "Investigating",
  "Partner notified",
  "Evidence review",
  "Decision",
  "Brand update",
  "Resolved",
  "Closed",
  "Archived",
];

const ISSUE_CATEGORIES = [
  "Misleading claim",
  "Off-brief creative",
  "Brand safety",
  "Wrong offer",
  "Unauthorized use of brand assets",
  "Other",
];

const PLATFORMS = [
  "Telegram",
  "WhatsApp",
  "Instagram",
  "YouTube",
  "LinkedIn",
  "Facebook",
  "X / Twitter",
  "Website / landing page",
  "Other",
];

type Complaint = {
  id: string;
  numeric_id: number;
  camp: string;
  camp_name?: string;
  plat: string;
  cat: string;
  urgency?: string;
  date: string;
  status: string;
  upd: string;
  outcome: string;
  post_url?: string;
  description?: string;
  additional_urls?: string | null;
  evidence_label?: string;
  timeline?: Array<{ text: string; at: string }>;
};

function statusPill(status: string) {
  const s = status.toLowerCase();
  if (s === "investigating") return "bg-amber-50 text-amber-800";
  if (s === "resolved") return "bg-emerald-50 text-emerald-700";
  if (s === "closed") return "bg-slate-100 text-slate-600";
  return "bg-violet-50 text-violet-700";
}

const emptyForm = {
  campaign_id: "",
  cat: "",
  url: "https://",
  platform: "Telegram",
  date: "",
  urgency: "Normal",
  desc: "",
  extraUrls: "",
  evidence: [] as string[],
};

export default function EmployerReportsPage() {
  const [rows, setRows] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<Array<{ l: string; v: number }>>([]);
  const [programs, setPrograms] = useState<Array<{ id: number; title: string }>>(
    [],
  );
  const [sel, setSel] = useState<Complaint | null>(null);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fetchEmployerComplaints(), fetchEmployerPrograms()])
      .then(([c, p]) => {
        setStats(c.stats ?? []);
        setRows((c.complaints as Complaint[]) ?? []);
        const list = (p ?? []).map((x) => ({
          id: Number(x.id),
          title: String(x.title ?? "Campaign"),
        }));
        setPrograms(list);
        setForm((prev) =>
          prev.campaign_id || !list[0]
            ? prev
            : { ...prev, campaign_id: String(list[0].id) },
        );
      })
      .catch(() => toast.error("Could not load complaints."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleEvidence = (label: string) => {
    setForm((p) => ({
      ...p,
      evidence: p.evidence.includes(label)
        ? p.evidence.filter((x) => x !== label)
        : [...p.evidence, label],
    }));
  };

  const submitReport = async () => {
    if (!form.campaign_id) {
      toast.error("Select a related campaign.");
      return;
    }
    if (!form.cat) {
      toast.error("Select an issue category.");
      return;
    }
    if (!form.url.startsWith("https://") || form.url.length < 12) {
      toast.error("Enter a valid promotional post URL (https://).");
      return;
    }
    if (!form.date) {
      toast.error("Select the date discovered.");
      return;
    }
    if (!form.desc.trim()) {
      toast.error("Describe the issue.");
      return;
    }

    setBusy(true);
    try {
      const res = await createEmployerComplaint({
        campaign_id: Number(form.campaign_id),
        platform: form.platform,
        post_url: form.url.trim(),
        category: form.cat,
        urgency: form.urgency,
        description: form.desc.trim(),
        additional_urls: form.extraUrls.trim() || undefined,
        evidence: form.evidence,
        seen_on: form.date,
      });
      toast.success("Report submitted. JobOrio will investigate.");
      setModal(false);
      setForm({
        ...emptyForm,
        campaign_id: programs[0] ? String(programs[0].id) : "",
      });
      load();
      setSel(res.complaint as Complaint);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : "Could not submit.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Reports and content complaints" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mt-1 text-sm text-slate-500">
            Report a post to JobOrio. JobOrio investigates and handles all
            partner communication. You never contact partners directly.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal(true)}
          className="rounded-full bg-violet-600 px-4 py-2 text-sm font-bold text-white"
        >
          Report promotional content
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <div
            key={s.l}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase text-slate-400">
              {s.l}
            </p>
            <p className="mt-2 text-2xl font-bold text-[#0F1B3D]">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-5 text-sm text-slate-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            No complaints yet. Use Report promotional content to file one.
          </p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                {[
                  "Complaint",
                  "Campaign",
                  "Platform",
                  "Issue",
                  "Submitted",
                  "Status",
                  "Updated",
                  "Outcome",
                  "",
                ].map((h) => (
                  <th key={h || "a"} className="px-3 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-slate-100">
                  <td className="px-3 py-3 font-mono text-xs">{c.id}</td>
                  <td className="px-3 py-3 font-mono text-xs">{c.camp}</td>
                  <td className="px-3 py-3">{c.plat}</td>
                  <td className="px-3 py-3">{c.cat}</td>
                  <td className="px-3 py-3">{c.date}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusPill(c.status)}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">{c.upd}</td>
                  <td className="px-3 py-3">{c.outcome}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => setSel(c)}
                      className="rounded-full border border-slate-200 px-2 py-1 text-[11px] font-bold"
                    >
                      View details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {sel ? (
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-bold text-[#0F1B3D]">
              {sel.id}{" "}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusPill(sel.status)}`}
              >
                {sel.status}
              </span>
            </h2>
            <button
              type="button"
              onClick={() => setSel(null)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold"
            >
              Close
            </button>
          </div>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {[
              ["Campaign", sel.camp_name ? `${sel.camp} · ${sel.camp_name}` : sel.camp],
              ["Issue", sel.cat],
              ["Reported post", sel.post_url || "—"],
              ["Platform", sel.plat],
              ["Urgency", sel.urgency || "Normal"],
              ["Your description", sel.description || "—"],
              ["Evidence", sel.evidence_label || "None"],
              ["Outcome", sel.outcome],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-slate-50 px-3 py-2">
                <dt className="text-[10px] font-bold uppercase text-slate-400">
                  {k}
                </dt>
                <dd className="break-all font-medium text-[#0F1B3D]">{v}</dd>
              </div>
            ))}
          </dl>
          <h3 className="mt-5 text-sm font-bold text-[#0F1B3D]">
            Status workflow
          </h3>
          <div className="mt-2 flex flex-wrap gap-1">
            {WORKFLOW.map((step, i) => {
              const active =
                sel.status === "Investigating"
                  ? i <= 3
                  : sel.status === "Resolved"
                    ? i <= 8
                    : i <= 1;
              return (
                <span
                  key={step}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    active
                      ? "bg-violet-100 text-violet-800"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {step}
                </span>
              );
            })}
          </div>
          <h3 className="mt-5 text-sm font-bold text-[#0F1B3D]">
            Updates from JobOrio
          </h3>
          <ul className="mt-2 space-y-2 text-sm">
            {(sel.timeline?.length
              ? sel.timeline
              : [{ text: "Complaint received and queued", at: sel.date }]
            ).map((e, i) => (
              <li key={i} className="rounded-xl bg-slate-50 px-3 py-2">
                {e.text}
                <span className="mt-0.5 block text-[11px] text-slate-400">
                  {e.at}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-[#0F1B3D]">
              Report promotional content
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              JobOrio will investigate and handle all partner communication. You
              never contact the partner.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-[#0F1B3D]">
                Related campaign
                <select
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-violet-400"
                  value={form.campaign_id}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, campaign_id: e.target.value }))
                  }
                >
                  <option value="">Select…</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      JO-C-{p.id} {p.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-[#0F1B3D]">
                Issue category
                <select
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-violet-400"
                  value={form.cat}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, cat: e.target.value }))
                  }
                >
                  <option value="">Select…</option>
                  {ISSUE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-[#0F1B3D] sm:col-span-2">
                Promotional post URL
                <input
                  type="url"
                  placeholder="https://"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-violet-400"
                  value={form.url}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, url: e.target.value }))
                  }
                />
              </label>

              <label className="block text-sm font-semibold text-[#0F1B3D]">
                Platform or channel
                <select
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-violet-400"
                  value={form.platform}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, platform: e.target.value }))
                  }
                >
                  {PLATFORMS.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-[#0F1B3D]">
                Date discovered
                <input
                  type="date"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-violet-400"
                  value={form.date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, date: e.target.value }))
                  }
                />
              </label>

              <label className="block text-sm font-semibold text-[#0F1B3D] sm:col-span-2">
                Urgency (optional)
                <select
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-violet-400"
                  value={form.urgency}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, urgency: e.target.value }))
                  }
                >
                  {["Low", "Normal", "High", "Critical"].map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-[#0F1B3D] sm:col-span-2">
                Describe the issue
                <textarea
                  rows={3}
                  placeholder="What is wrong and what should the post say?"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-violet-400"
                  value={form.desc}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, desc: e.target.value }))
                  }
                />
              </label>

              <label className="block text-sm font-semibold text-[#0F1B3D] sm:col-span-2">
                Additional URLs (one per line)
                <textarea
                  rows={2}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-violet-400"
                  value={form.extraUrls}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, extraUrls: e.target.value }))
                  }
                />
              </label>

              <div className="sm:col-span-2">
                <p className="text-sm font-semibold text-[#0F1B3D]">
                  Evidence (sample upload)
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    ["screenshot", "Add screenshot"],
                    ["video", "Add video"],
                    ["pdf", "Add PDF"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleEvidence(label)}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                        form.evidence.includes(label)
                          ? "border-violet-500 bg-violet-50 text-violet-800"
                          : "border-sky-300 text-[#0F1B3D]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-[#0F1B3D]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={submitReport}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {busy ? "Submitting…" : "Submit report"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
