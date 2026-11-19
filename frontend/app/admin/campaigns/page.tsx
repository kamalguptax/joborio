"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/ui/Toast";
import {
  adminActivateProgram,
  adminCreateProgram,
  adminExportProgramLeads,
  adminGetProgram,
  adminListPrograms,
  adminPauseProgram,
  adminUpdateProgram,
  type CampaignTypeId,
} from "@/lib/api/admin";
import {
  AdminAlert,
  AdminButton,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
} from "@/components/admin/admin-ui";
import {
  LAUNCH_CATEGORIES,
  LEAD_TYPE_OPTIONS,
  REQUIRED_FIELD_OPTIONS,
  defaultCampaignSchedule,
  launchCategoryForOption,
  launchOptionById,
  launchOptionForProgram,
  pricingNeedsSchedule,
  toLocalDateTimeInput,
  type LaunchCategoryId,
  type LaunchOptionId,
} from "@/lib/campaigns/launchOptions";
import { fetchNiches } from "@/lib/api/creator";
import type { Niche } from "@/lib/api/types";
import CampaignScheduleFields from "@/components/campaigns/CampaignScheduleFields";

const defaultSchedule = defaultCampaignSchedule();

const COUNTRY_OPTS = [
  { code: "IN", label: "India" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "AE", label: "UAE" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "DE", label: "Germany" },
  { code: "SG", label: "Singapore" },
];

const emptyForm = {
  title: "",
  description: "",
  destination_url: "https://",
  company_name: "",
  rate_usd: "0.05",
  budget_total_usd: "500",
  country_code: "IN",
  niche_id: "" as string,
  lead_type: "application",
  required_fields: ["name", "email", "phone"] as string[],
  qualification_rules: "",
  auto_pause_on_budget: true,
  trial_without_ip: false,
  post_url: "",
  engage_brief: "",
  engagement_like: true,
  engagement_comment: true,
  engagement_repost: true,
  starts_at: defaultSchedule.starts_at,
  ends_at: defaultSchedule.ends_at,
};

export default function AdminManualCampaignsPage() {
  const [categoryId, setCategoryId] = useState<LaunchCategoryId>("job");
  const [launchId, setLaunchId] = useState<LaunchOptionId>("job_ppc");
  const [programs, setPrograms] = useState<Array<Record<string, unknown>>>([]);
  const [allPrograms, setAllPrograms] = useState<Array<Record<string, unknown>>>([]);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const category =
    LAUNCH_CATEGORIES.find((c) => c.id === categoryId) ?? LAUNCH_CATEGORIES[0];
  const selected = launchOptionById(launchId);
  const type = selected.promotion_type as CampaignTypeId;
  const isTrial = form.trial_without_ip;
  const isPpe = selected.pricing_model === "ppe" || selected.promotion_type === "post_promote";
  const needsSchedule = pricingNeedsSchedule(selected.pricing_model);

  const load = () => {
    Promise.all([
      adminListPrograms(1, type),
      adminListPrograms(1),
    ])
      .then(([typed, all]) => {
        setPrograms(typed.data);
        setAllPrograms(all.data);
      })
      .catch(() => setError("Could not load campaigns."));
  };

  useEffect(() => {
    const mode = new URLSearchParams(window.location.search).get("mode");
    if (mode === "trial") {
      setForm((current) => ({
        ...current,
        trial_without_ip: true,
        rate_usd: "0",
        budget_total_usd: "0",
      }));
    }
    fetchNiches()
      .then(setNiches)
      .catch(() => setNiches([]));
  }, []);

  useEffect(() => {
    setError(null);
    load();
  }, [type]);

  const selectCategory = (id: LaunchCategoryId) => {
    const next = LAUNCH_CATEGORIES.find((c) => c.id === id) ?? LAUNCH_CATEGORIES[0];
    const option = next.options[0];
    setCategoryId(id);
    setLaunchId(option.id);
    setForm((current) => ({
      ...current,
      rate_usd: current.trial_without_ip ? "0" : option.defaultRate,
      budget_total_usd: current.trial_without_ip ? "0" : option.defaultBudget,
    }));
  };

  const selectOption = (id: LaunchOptionId) => {
    const option = launchOptionById(id);
    const cat = launchCategoryForOption(id);
    setCategoryId(cat.id);
    setLaunchId(id);
    setForm((current) => ({
      ...current,
      rate_usd: current.trial_without_ip ? "0" : option.defaultRate,
      budget_total_usd: current.trial_without_ip ? "0" : option.defaultBudget,
    }));
  };

  const enableTrial = (on: boolean) => {
    setForm((current) => ({
      ...current,
      trial_without_ip: on,
      rate_usd: on ? "0" : selected.defaultRate,
      budget_total_usd: on ? "0" : selected.defaultBudget,
    }));
    const url = new URL(window.location.href);
    if (on) url.searchParams.set("mode", "trial");
    else url.searchParams.delete("mode");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  };

  const startEdit = (p: Record<string, unknown>) => {
    const listing = (p.listing ?? {}) as Record<string, unknown>;
    const actions = Array.isArray(p.engagement_actions)
      ? (p.engagement_actions as string[])
      : [];
    const option = launchOptionForProgram(
      String(p.promotion_type ?? "job"),
      String(p.pricing_model ?? "ppc"),
    );
    const cat = launchCategoryForOption(option.id);
    setCategoryId(cat.id);
    setLaunchId(option.id);
    setEditingId(Number(p.id));
    setForm({
      title: String(p.title ?? ""),
      description: String(p.description ?? ""),
      destination_url: String(listing.destination_url ?? "https://"),
      company_name: String(listing.company_name ?? ""),
      rate_usd: String(p.rate_usd ?? option.defaultRate),
      budget_total_usd: String(p.budget_total_usd ?? option.defaultBudget),
      country_code: String(
        (Array.isArray(p.target_countries) && p.target_countries[0]
          ? p.target_countries[0]
          : listing.country_code) ?? "IN",
      ).toUpperCase(),
      niche_id: String(
        Array.isArray(p.target_niche_ids) && p.target_niche_ids[0]
          ? p.target_niche_ids[0]
          : "",
      ),
      lead_type: String(p.lead_type ?? "application"),
      required_fields: Array.isArray(p.required_fields)
        ? (p.required_fields as string[])
        : ["name", "email", "phone"],
      qualification_rules: String(p.qualification_rules ?? ""),
      auto_pause_on_budget: p.auto_pause_on_budget !== false,
      trial_without_ip: Boolean(p.trial_without_ip),
      post_url: String(p.post_url ?? ""),
      engage_brief: String(p.engage_brief ?? ""),
      engagement_like: actions.length ? actions.includes("like") : true,
      engagement_comment: actions.length ? actions.includes("comment") : true,
      engagement_repost: actions.length ? actions.includes("repost") : true,
      starts_at:
        toLocalDateTimeInput(String(p.starts_at ?? "")) ||
        defaultCampaignSchedule().starts_at,
      ends_at:
        toLocalDateTimeInput(String(p.ends_at ?? "")) ||
        defaultCampaignSchedule().ends_at,
    });
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const editId = Number(
      new URLSearchParams(window.location.search).get("edit") ?? "",
    );
    if (!Number.isFinite(editId) || editId <= 0) return;
    let cancelled = false;
    adminGetProgram(editId)
      .then(({ program }) => {
        if (cancelled || !program) return;
        startEdit(program);
        const url = new URL(window.location.href);
        url.searchParams.delete("edit");
        window.history.replaceState({}, "", `${url.pathname}${url.search}`);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load campaign for editing.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cancelEdit = () => {
    const schedule = defaultCampaignSchedule();
    setEditingId(null);
    setForm({
      ...emptyForm,
      rate_usd: selected.defaultRate,
      budget_total_usd: selected.defaultBudget,
      trial_without_ip: isTrial,
      starts_at: schedule.starts_at,
      ends_at: schedule.ends_at,
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isPpe && !form.post_url.trim()) {
        setError("PPE / post promote needs the social post URL.");
        setBusy(false);
        return;
      }
      if (needsSchedule && (!form.starts_at || !form.ends_at)) {
        setError("Campaign needs a start date and end date.");
        setBusy(false);
        return;
      }
      type EngageAction = "like" | "comment" | "repost";
      const defaultEngage: EngageAction[] = ["like", "comment", "repost"];
      const engagement_actions: EngageAction[] = (
        [
          form.engagement_like ? "like" : null,
          form.engagement_comment ? "comment" : null,
          form.engagement_repost ? "repost" : null,
        ] as Array<EngageAction | null>
      ).filter((v): v is EngageAction => Boolean(v));

      const country = form.country_code.trim().toUpperCase() || "IN";
      const nicheId = form.niche_id ? Number(form.niche_id) : null;
      const nicheName = niches.find((n) => n.id === nicheId)?.name;
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        destination_url: form.destination_url.trim(),
        company_name: form.company_name.trim() || undefined,
        promotion_type: selected.promotion_type,
        pricing_model: selected.pricing_model,
        rate_usd: Number(form.rate_usd),
        budget_total_usd: Number(form.budget_total_usd),
        trial_without_ip: form.trial_without_ip,
        country_code: country,
        target_countries: [country],
        target_niche_ids: nicheId ? [nicheId] : [],
        category: nicheName || selected.promotion_type,
        lead_type: form.lead_type || undefined,
        required_fields: form.required_fields,
        qualification_rules: form.qualification_rules.trim() || undefined,
        auto_pause_on_budget: form.auto_pause_on_budget,
        post_url: isPpe ? form.post_url.trim() : undefined,
        engage_brief: isPpe ? form.engage_brief.trim() || undefined : undefined,
        engagement_actions: isPpe
          ? engagement_actions.length
            ? engagement_actions
            : defaultEngage
          : undefined,
        starts_at: needsSchedule ? form.starts_at : undefined,
        ends_at: needsSchedule ? form.ends_at : undefined,
      };

      if (editingId) {
        await adminUpdateProgram(editingId, payload);
        setEditingId(null);
        toast.success("Campaign updated.");
      } else {
        await adminCreateProgram(payload);
        toast.success(
          isTrial
            ? `Trial ${category.label} post (no IP) launched.`
            : `${category.label} · ${selected.label} added.`,
        );
      }
      {
        const schedule = defaultCampaignSchedule();
        setForm({
          ...emptyForm,
          rate_usd: selected.defaultRate,
          budget_total_usd: selected.defaultBudget,
          trial_without_ip: isTrial,
          starts_at: schedule.starts_at,
          ends_at: schedule.ends_at,
        });
      }
      load();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : editingId
            ? "Could not update campaign."
            : "Could not create campaign. Check the URL and amounts.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title={editingId ? "Edit campaign" : "Launch campaign"}
        description="Admin can launch PPC, PPR, PPA, and PPE for Jobs, Courses, Tools, Branding & post promote. Optional: Trial post (no IP)."
      />

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-zinc-300">Posting mode</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => enableTrial(false)}
            className={`rounded-xl border p-4 text-left transition ${
              !isTrial
                ? "border-amber-500 bg-amber-500/10"
                : "border-zinc-800 bg-zinc-900/50 hover:border-amber-500/40"
            }`}
          >
            <p className="font-semibold text-zinc-100">Paid campaign</p>
            <p className="mt-1 text-xs text-zinc-400">
              Normal tracking with IP, fraud checks, and paid earnings.
            </p>
          </button>
          <button
            type="button"
            onClick={() => enableTrial(true)}
            className={`rounded-xl border p-4 text-left transition ${
              isTrial
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-zinc-800 bg-zinc-900/50 hover:border-emerald-500/40"
            }`}
          >
            <p className="font-semibold text-zinc-100">Trial post (no IP)</p>
            <p className="mt-1 text-xs text-zinc-400">
              For clients testing creatives. No IP stored, clicks not paid.
            </p>
          </button>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-zinc-300">
          Required · choose campaign type
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Step through Jobs → Courses → Tools → Branding & other.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LAUNCH_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => selectCategory(cat.id)}
              className={`rounded-xl border p-4 text-left transition ${
                categoryId === cat.id
                  ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30"
                  : "border-zinc-800 bg-zinc-900/50 hover:border-amber-500/40"
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
                {cat.step}. {cat.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-100">{cat.label}</p>
              <p className="mt-1 text-xs text-zinc-400">{cat.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-zinc-300">
          {category.step}. {category.label} · pricing model
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {category.options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => selectOption(option.id)}
              className={`rounded-xl border p-4 text-left transition ${
                launchId === option.id
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-zinc-800 bg-zinc-900/50 hover:border-emerald-500/40"
              }`}
            >
              <p className="font-semibold text-zinc-100">{option.label}</p>
              <p className="mt-1 text-xs text-zinc-400">{option.description}</p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                {option.pricing_model.toUpperCase()}
              </p>
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <div className="mt-4">
          <AdminAlert tone="error">{error}</AdminAlert>
        </div>
      ) : null}

      <AdminPanel
        className="mt-8"
        title={
          editingId
            ? `Editing #${editingId} · ${category.label} · ${selected.label}`
            : `Required · ${category.step}. ${category.label} · ${selected.label}`
        }
      >
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="text-zinc-400">
              {category.id === "job"
                ? "Job campaign title"
                : category.id === "course"
                  ? "Course campaign title"
                  : category.id === "tool"
                    ? "Tool / product title"
                    : "Campaign title"}
            </span>
            <AdminInput
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={selected.label}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-zinc-400">
              {isPpe ? "Campaign / brand landing URL" : "Destination URL"}
            </span>
            <AdminInput
              required
              type="url"
              value={form.destination_url}
              onChange={(e) =>
                setForm({ ...form, destination_url: e.target.value })
              }
            />
          </label>
          {isPpe ? (
            <>
              <label className="block text-sm sm:col-span-2">
                <span className="text-zinc-400">
                  Social post URL (LinkedIn / Instagram / X)
                </span>
                <AdminInput
                  required
                  type="url"
                  value={form.post_url}
                  onChange={(e) => setForm({ ...form, post_url: e.target.value })}
                  placeholder="https://www.linkedin.com/posts/…"
                />
              </label>
              <fieldset className="sm:col-span-2">
                <legend className="text-sm text-zinc-400">Engagement actions (PPE)</legend>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-zinc-300">
                  {(
                    [
                      ["engagement_like", "Like"],
                      ["engagement_comment", "Comment"],
                      ["engagement_repost", "Repost"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form[key]}
                        onChange={(e) =>
                          setForm({ ...form, [key]: e.target.checked })
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="block text-sm sm:col-span-2">
                <span className="text-zinc-400">Creator brief (optional)</span>
                <textarea
                  value={form.engage_brief}
                  onChange={(e) =>
                    setForm({ ...form, engage_brief: e.target.value })
                  }
                  rows={2}
                  placeholder="What should creators say or emphasize?"
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                />
              </label>
            </>
          ) : null}
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
            <AdminSelect
              required
              value={form.country_code}
              onChange={(e) =>
                setForm({ ...form, country_code: e.target.value })
              }
            >
              {COUNTRY_OPTS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label} ({c.code})
                </option>
              ))}
            </AdminSelect>
            <span className="mt-1 block text-[11px] text-zinc-500">
              Only creators targeting this country will see the campaign.
            </span>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-zinc-400">Category (creator niche)</span>
            <AdminSelect
              value={form.niche_id}
              onChange={(e) => setForm({ ...form, niche_id: e.target.value })}
            >
              <option value="">All categories (everyone)</option>
              {niches.map((n) => (
                <option key={n.id} value={String(n.id)}>
                  {n.name}
                </option>
              ))}
            </AdminSelect>
            <span className="mt-1 block text-[11px] text-zinc-500">
              If set, only creators in this category see the campaign.
            </span>
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
          {needsSchedule ? (
            <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
              <CampaignScheduleFields
                tone="admin"
                required
                startsAt={form.starts_at}
                endsAt={form.ends_at}
                onStartsAtChange={(starts_at) => setForm({ ...form, starts_at })}
                onEndsAtChange={(ends_at) => setForm({ ...form, ends_at })}
              />
            </div>
          ) : null}
          <label className="block text-sm">
            <span className="text-zinc-400">Lead type</span>
            <AdminSelect
              value={form.lead_type}
              onChange={(e) => setForm({ ...form, lead_type: e.target.value })}
            >
              {LEAD_TYPE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </AdminSelect>
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={form.auto_pause_on_budget}
              onChange={(e) =>
                setForm({ ...form, auto_pause_on_budget: e.target.checked })
              }
            />
            Auto-pause when budget is finished
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="text-sm text-zinc-400">Required fields</legend>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-300">
              {REQUIRED_FIELD_OPTIONS.map((opt) => {
                const checked = form.required_fields.includes(opt.id);
                return (
                  <label key={opt.id} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setForm({
                          ...form,
                          required_fields: checked
                            ? form.required_fields.filter((f) => f !== opt.id)
                            : [...form.required_fields, opt.id],
                        })
                      }
                    />
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <label className="block text-sm sm:col-span-2">
            <span className="text-zinc-400">Qualification rules</span>
            <textarea
              value={form.qualification_rules}
              onChange={(e) =>
                setForm({ ...form, qualification_rules: e.target.value })
              }
              rows={3}
              placeholder="Who qualifies? e.g. min experience, city, must submit resume…"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
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
          {isTrial ? (
            <p className="sm:col-span-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              Trial mode: IP is not stored, clicks are marked{" "}
              <code className="text-emerald-300">trial</code>, and earnings stay at $0.
            </p>
          ) : (
            <label className="flex items-start gap-3 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.trial_without_ip}
                onChange={(e) => enableTrial(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-zinc-300">
                Switch to trial post (no IP tracking)
              </span>
            </label>
          )}
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <AdminButton type="submit" variant="primary" disabled={busy}>
              {busy
                ? "Saving…"
                : editingId
                  ? "Save changes"
                  : isTrial
                    ? `Launch trial · ${category.label}`
                    : `Launch · ${category.label}`}
            </AdminButton>
            {editingId ? (
              <AdminButton type="button" variant="secondary" onClick={cancelEdit}>
                Cancel edit
              </AdminButton>
            ) : null}
          </div>
        </form>
      </AdminPanel>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-zinc-200">
          {category.label} campaigns
        </h2>
        <ul className="mt-4 space-y-3">
          {programs.map((p) => {
            const listing = (p.listing ?? {}) as Record<string, unknown>;
            const nicheIds = Array.isArray(p.target_niche_ids)
              ? (p.target_niche_ids as number[])
              : [];
            const nicheLabel = nicheIds
              .map((id) => niches.find((n) => n.id === Number(id))?.name)
              .filter(Boolean)
              .join(", ");
            const countries = Array.isArray(p.target_countries)
              ? (p.target_countries as string[]).join(", ")
              : String(listing.country_code ?? "");
            const spent = Number(p.budget_spent_usd ?? 0);
            const total = Number(p.budget_total_usd ?? 0);
            const remaining = Math.max(0, total - spent);
            const pct = total > 0 ? Math.min(100, (spent / total) * 100) : 0;
            const canActivate =
              p.status === "pending_review" ||
              p.status === "paused" ||
              (p.status === "budget_exhausted" && remaining > 0);
            return (
              <li
                key={String(p.id)}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-zinc-100">{String(p.title)}</p>
                    <p className="text-xs text-zinc-500">
                      {String(p.status)} · {String(p.pricing_model).toUpperCase()} ·{" "}
                      {String(p.promotion_type ?? type)}
                      {p.lead_type ? ` · Lead: ${String(p.lead_type)}` : ""}
                      {p.trial_without_ip ? " · Trial (no IP)" : ""}
                      {countries ? ` · ${countries}` : ""}
                      {nicheLabel
                        ? ` · ${nicheLabel}`
                        : listing.category
                          ? ` · ${String(listing.category)}`
                          : ""}
                      {p.starts_at
                        ? ` · ${new Date(String(p.starts_at)).toLocaleDateString()} → ${
                            p.ends_at
                              ? new Date(String(p.ends_at)).toLocaleDateString()
                              : "—"
                          }`
                        : ""}
                    </p>
                    {p.qualification_rules ? (
                      <p className="mt-1 text-xs text-zinc-400">
                        Rules: {String(p.qualification_rules)}
                      </p>
                    ) : null}
                    <div className="mt-3 max-w-md">
                      <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
                        <span>
                          Budget used ${spent.toFixed(2)} / ${total.toFixed(2)}
                        </span>
                        <span>Left ${remaining.toFixed(2)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className={`h-full rounded-full ${
                            pct >= 100
                              ? "bg-red-500"
                              : pct >= 80
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {p.status === "budget_exhausted" ? (
                        <p className="mt-1 text-[11px] text-red-300">
                          Auto-paused — budget finished
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AdminButton
                      variant="secondary"
                      onClick={() => startEdit(p)}
                    >
                      {editingId === Number(p.id) ? "Editing…" : "Edit"}
                    </AdminButton>
                    {canActivate ? (
                      <AdminButton
                        variant="primary"
                        onClick={async () => {
                          try {
                            await adminActivateProgram(Number(p.id));
                            toast.success("Campaign activated.");
                            load();
                          } catch (err) {
                            toast.error(
                              err instanceof Error
                                ? err.message
                                : "Could not activate the campaign.",
                            );
                          }
                        }}
                      >
                        Activate
                      </AdminButton>
                    ) : null}
                    {p.status === "active" ? (
                      <AdminButton
                        variant="secondary"
                        onClick={async () => {
                          try {
                            await adminPauseProgram(Number(p.id));
                            toast.success("Campaign paused.");
                            load();
                          } catch {
                            toast.error("Could not pause the campaign.");
                          }
                        }}
                      >
                        Pause
                      </AdminButton>
                    ) : null}
                    <AdminButton
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await adminExportProgramLeads(Number(p.id), "csv");
                          toast.success("Leads CSV downloaded.");
                        } catch {
                          toast.error("Could not export leads.");
                        }
                      }}
                    >
                      Export CSV
                    </AdminButton>
                    <AdminButton
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await adminExportProgramLeads(Number(p.id), "excel");
                          toast.success("Leads Excel/CSV downloaded.");
                        } catch {
                          toast.error("Could not export leads.");
                        }
                      }}
                    >
                      Export Excel
                    </AdminButton>
                  </div>
                </div>
              </li>
            );
          })}
          {programs.length === 0 ? (
            <li className="text-sm text-zinc-500">
              No {category.label.toLowerCase()} campaigns yet.
            </li>
          ) : null}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-zinc-200">All campaigns</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Edit any campaign below — country and category control who sees it.
        </p>
        <ul className="mt-4 space-y-3">
          {allPrograms.map((p) => {
            const listing = (p.listing ?? {}) as Record<string, unknown>;
            const nicheIds = Array.isArray(p.target_niche_ids)
              ? (p.target_niche_ids as number[])
              : [];
            const nicheLabel = nicheIds
              .map((id) => niches.find((n) => n.id === Number(id))?.name)
              .filter(Boolean)
              .join(", ");
            const spent = Number(p.budget_spent_usd ?? 0);
            const total = Number(p.budget_total_usd ?? 0);
            const remaining = Math.max(0, total - spent);
            const pct = total > 0 ? Math.min(100, (spent / total) * 100) : 0;
            const canActivate =
              p.status === "pending_review" ||
              p.status === "paused" ||
              (p.status === "budget_exhausted" && remaining > 0);
            return (
              <li
                key={`all-${String(p.id)}`}
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-zinc-100">{String(p.title)}</p>
                    <p className="text-xs text-zinc-500">
                      #{String(p.id)} · {String(p.status)} ·{" "}
                      {String(p.pricing_model).toUpperCase()} ·{" "}
                      {String(p.promotion_type ?? "—")}
                      {p.lead_type ? ` · ${String(p.lead_type)}` : ""}
                      {Array.isArray(p.target_countries) && p.target_countries[0]
                        ? ` · ${String(p.target_countries[0])}`
                        : ""}
                      {nicheLabel ? ` · ${nicheLabel}` : ""}
                      {listing.category && !nicheLabel
                        ? ` · ${String(listing.category)}`
                        : ""}
                    </p>
                    <div className="mt-2 max-w-sm">
                      <div className="mb-1 flex justify-between text-[11px] text-zinc-500">
                        <span>
                          ${spent.toFixed(0)} / ${total.toFixed(0)}
                        </span>
                        <span>${remaining.toFixed(0)} left</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className={`h-full ${pct >= 100 ? "bg-red-500" : "bg-emerald-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AdminButton variant="secondary" onClick={() => startEdit(p)}>
                      {editingId === Number(p.id) ? "Editing…" : "Edit"}
                    </AdminButton>
                    {canActivate ? (
                      <AdminButton
                        variant="primary"
                        onClick={async () => {
                          try {
                            await adminActivateProgram(Number(p.id));
                            toast.success("Campaign activated.");
                            load();
                          } catch (err) {
                            toast.error(
                              err instanceof Error
                                ? err.message
                                : "Could not activate.",
                            );
                          }
                        }}
                      >
                        Activate
                      </AdminButton>
                    ) : null}
                    {p.status === "active" ? (
                      <AdminButton
                        variant="secondary"
                        onClick={async () => {
                          try {
                            await adminPauseProgram(Number(p.id));
                            toast.success("Campaign paused.");
                            load();
                          } catch {
                            toast.error("Could not pause.");
                          }
                        }}
                      >
                        Pause
                      </AdminButton>
                    ) : null}
                    <AdminButton
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await adminExportProgramLeads(Number(p.id), "csv");
                          toast.success("Leads exported.");
                        } catch {
                          toast.error("Export failed.");
                        }
                      }}
                    >
                      Export leads
                    </AdminButton>
                  </div>
                </div>
              </li>
            );
          })}
          {allPrograms.length === 0 ? (
            <li className="text-sm text-zinc-500">No campaigns yet.</li>
          ) : null}
        </ul>
      </section>
    </>
  );
}
