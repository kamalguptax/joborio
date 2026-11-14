"use client";

import { useEffect, useState } from "react";
import {
  adminActivateProgram,
  adminCreateProgram,
  adminListPrograms,
  adminPauseProgram,
  type CampaignTypeId,
} from "@/lib/api/admin";
import {
  AdminAlert,
  AdminButton,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/admin-ui";
import {
  LAUNCH_OPTIONS,
  launchOptionById,
  type LaunchOptionId,
} from "@/lib/campaigns/launchOptions";

const emptyForm = {
  title: "",
  description: "",
  destination_url: "https://",
  company_name: "",
  rate_usd: "0.05",
  budget_total_usd: "500",
  country_code: "IN",
  trial_without_ip: false,
};

export default function AdminManualCampaignsPage() {
  const [launchId, setLaunchId] = useState<LaunchOptionId>("ppc");
  const [programs, setPrograms] = useState<Array<Record<string, unknown>>>([]);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = launchOptionById(launchId);
  const type = selected.promotion_type as CampaignTypeId;

  const load = () => {
    adminListPrograms(1, type)
      .then(({ data }) => setPrograms(data))
      .catch(() => setError("Could not load campaigns."));
  };

  useEffect(() => {
    setError(null);
    load();
  }, [type]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setError(null);
    setBusy(true);
    try {
      await adminCreateProgram({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        destination_url: form.destination_url.trim(),
        company_name: form.company_name.trim() || undefined,
        promotion_type: selected.promotion_type,
        pricing_model: selected.pricing_model,
        rate_usd: Number(form.rate_usd),
        budget_total_usd: Number(form.budget_total_usd),
        trial_without_ip: form.trial_without_ip,
        country_code: form.country_code.trim().toUpperCase() || undefined,
        target_countries: form.country_code.trim()
          ? [form.country_code.trim().toUpperCase()]
          : ["IN"],
        category: selected.promotion_type,
      });
      setForm({
        ...emptyForm,
        rate_usd: selected.defaultRate,
        budget_total_usd: selected.defaultBudget,
      });
      setMsg(`${selected.label} campaign added.`);
      load();
    } catch {
      setError("Could not create campaign. Check the URL and amounts.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Launch campaign"
        description="After Launch campaign, pick one option: Pay Per Click, Courses, Pay Per Signup / Registration, Brand awareness, or Pay per Lead."
      />

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-zinc-300">Campaign options</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LAUNCH_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setLaunchId(option.id);
                setForm((current) => ({
                  ...current,
                  rate_usd: current.trial_without_ip
                    ? "0"
                    : option.defaultRate,
                  budget_total_usd: current.trial_without_ip
                    ? "0"
                    : option.defaultBudget,
                }));
              }}
              className={`rounded-xl border p-4 text-left transition ${
                launchId === option.id
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-zinc-800 bg-zinc-900/50 hover:border-amber-500/40"
              }`}
            >
              <p className="font-semibold text-zinc-100">{option.label}</p>
              <p className="mt-1 text-xs text-zinc-400">{option.description}</p>
            </button>
          ))}
        </div>
      </section>

      {msg ? (
        <div className="mt-4">
          <AdminAlert tone="info">{msg}</AdminAlert>
        </div>
      ) : null}
      {error ? (
        <div className="mt-4">
          <AdminAlert tone="error">{error}</AdminAlert>
        </div>
      ) : null}

      <AdminPanel className="mt-8" title={`Required · ${selected.label}`}>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="text-zinc-400">Campaign title</span>
            <AdminInput
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={selected.label}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-zinc-400">Destination URL</span>
            <AdminInput
              required
              type="url"
              value={form.destination_url}
              onChange={(e) =>
                setForm({ ...form, destination_url: e.target.value })
              }
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-400">Brand / company</span>
            <AdminInput
              value={form.company_name}
              onChange={(e) =>
                setForm({ ...form, company_name: e.target.value })
              }
              placeholder="Optional"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-400">Country</span>
            <AdminInput
              maxLength={2}
              value={form.country_code}
              onChange={(e) =>
                setForm({ ...form, country_code: e.target.value })
              }
              placeholder="IN"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-400">Rate (USD)</span>
            <AdminInput
              required
              value={form.rate_usd}
              onChange={(e) => setForm({ ...form, rate_usd: e.target.value })}
              disabled={form.trial_without_ip}
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-400">Budget (USD)</span>
            <AdminInput
              required
              value={form.budget_total_usd}
              onChange={(e) =>
                setForm({ ...form, budget_total_usd: e.target.value })
              }
              disabled={form.trial_without_ip}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-zinc-400">Description</span>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <label className="flex items-start gap-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.trial_without_ip}
              onChange={(e) => {
                const on = e.target.checked;
                setForm({
                  ...form,
                  trial_without_ip: on,
                  rate_usd: on ? "0" : selected.defaultRate,
                  budget_total_usd: on ? "0" : selected.defaultBudget,
                });
              }}
              className="mt-1"
            />
            <span className="text-sm text-zinc-300">
              Trial post (no IP tracking)
            </span>
          </label>
          <div className="sm:col-span-2">
            <AdminButton type="submit" variant="primary" disabled={busy}>
              {busy ? "Saving…" : "Launch campaign"}
            </AdminButton>
          </div>
        </form>
      </AdminPanel>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-zinc-200">
          {selected.label} campaigns
        </h2>
        <ul className="mt-4 space-y-3">
          {programs.map((p) => (
            <li
              key={String(p.id)}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
            >
              <div>
                <p className="font-semibold text-zinc-100">{String(p.title)}</p>
                <p className="text-xs text-zinc-500">
                  {String(p.status)} · {String(p.pricing_model).toUpperCase()} ·{" "}
                  {String(p.promotion_type ?? type)}
                  {p.trial_without_ip ? " · Trial (no IP)" : ""}
                </p>
              </div>
              <div className="flex gap-2">
                {p.status === "pending_review" || p.status === "paused" ? (
                  <AdminButton
                    variant="primary"
                    onClick={async () => {
                      await adminActivateProgram(Number(p.id));
                      load();
                    }}
                  >
                    Activate
                  </AdminButton>
                ) : null}
                {p.status === "active" ? (
                  <AdminButton
                    variant="secondary"
                    onClick={async () => {
                      await adminPauseProgram(Number(p.id));
                      load();
                    }}
                  >
                    Pause
                  </AdminButton>
                ) : null}
              </div>
            </li>
          ))}
          {programs.length === 0 ? (
            <li className="text-sm text-zinc-500">
              No campaigns for this option yet.
            </li>
          ) : null}
        </ul>
      </section>
    </>
  );
}
