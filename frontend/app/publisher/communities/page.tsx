"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { ApiClientError } from "@/lib/api/client";
import { fetchNiches } from "@/lib/api/creator";
import { fetchJobMasterFilters } from "@/lib/api/jobMasters";
import {
  communityJoinUrl,
  createPublisherCommunity,
  fetchPublisherCommunities,
  fetchPublisherMarketplace,
  fetchPublisherTeam,
  invitePublisherManager,
  updatePublisherCommunity,
  type MarketplaceCampaign,
  type PublisherCommunity,
  type PublisherTeamMember,
} from "@/lib/api/publisher";
import { fetchPublicXmlJobs } from "@/lib/syndication/publicXmlFeed";
import type { SyndicatedJob } from "@/lib/api/syndication";
import { formatMoney } from "@/lib/money";
import MultiSelect from "@/components/ui/MultiSelect";
import SingleSelect from "@/components/ui/SingleSelect";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";

const field =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#172b63] outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10";

type SourceKind = "all" | "job" | "xml" | "campaign";

type PickerItem =
  | {
      key: string;
      kind: "program";
      programId: number;
      title: string;
      meta: string;
      badge: "Job" | "Campaign";
      search: string;
    }
  | {
      key: string;
      kind: "xml";
      xmlRef: string;
      title: string;
      meta: string;
      badge: "XML";
      search: string;
    };

export default function PublisherCommunitiesPage() {
  const [rows, setRows] = useState<PublisherCommunity[]>([]);
  const [team, setTeam] = useState<PublisherTeamMember[]>([]);
  const [campaigns, setCampaigns] = useState<MarketplaceCampaign[]>([]);
  const [xmlJobs, setXmlJobs] = useState<SyndicatedJob[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [xmlLoading, setXmlLoading] = useState(false);
  const [selectedProgramIds, setSelectedProgramIds] = useState<number[]>([]);
  const [selectedXmlRefs, setSelectedXmlRefs] = useState<string[]>([]);
  /** What the publisher wants to attach: manual jobs, XML jobs, campaigns, or all. */
  const [sourceKind, setSourceKind] = useState<SourceKind>("all");
  const [programSearch, setProgramSearch] = useState("");
  const [canInvite, setCanInvite] = useState(false);
  const [role, setRole] = useState<string>("owner");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [commissionPercent, setCommissionPercent] = useState(12);
  const [description, setDescription] = useState("");
  const [country, setCountry] = useState("IN");
  const campaignAccess = "selected";
  const commissionOptions = [10, 11, 12, 13, 14, 15];
  const [managerId, setManagerId] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isOwner = role === "owner";
  const managers = team.filter((t) => t.role === "manager" || t.role === "owner");
  const sortedCategories = useMemo(
    () => [...categoryOptions].sort((a, b) => a.localeCompare(b)),
    [categoryOptions],
  );
  const categorySelectOptions = useMemo(
    () => sortedCategories.map((name) => ({ value: name, label: name })),
    [sortedCategories],
  );
  const managerSelectOptions = useMemo(
    () =>
      managers.map((m) => ({
        value: String(m.user_id),
        label: `${m.name} (${m.email}) · ${m.role}`,
      })),
    [managers],
  );

  const pickerItems = useMemo((): PickerItem[] => {
    const items: PickerItem[] = [];
    const includePrograms = sourceKind === "all" || sourceKind === "job" || sourceKind === "campaign";
    const includeXml = sourceKind === "all" || sourceKind === "job" || sourceKind === "xml";

    if (includePrograms) {
      for (const c of campaigns) {
        const isJob =
          c.source_kind === "job" ||
          String(c.promotion_type ?? "").toLowerCase() === "job";
        if (sourceKind === "job" && !isJob) continue;
        if (sourceKind === "campaign" && isJob) continue;
        const meta = [
          (c.promotion_type || "campaign").toString(),
          c.pricing_model ? String(c.pricing_model).toUpperCase() : null,
          c.rate_usd != null ? formatMoney(Number(c.rate_usd), "USD") : null,
          c.employer || null,
          c.category || null,
          c.country_code || null,
          c.assigned_community_count
            ? `already on ${c.assigned_community_count} other community${c.assigned_community_count === 1 ? "" : "ies"}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ");
        items.push({
          key: `program:${c.id}`,
          kind: "program",
          programId: c.id,
          title: c.title,
          meta,
          badge: isJob ? "Job" : "Campaign",
          search: [c.title, c.listing_title, c.employer, c.category, c.country_code, c.promotion_type, c.pricing_model]
            .filter(Boolean)
            .join(" ")
            .toLowerCase(),
        });
      }
    }

    if (includeXml) {
      for (const job of xmlJobs) {
        const ref = (job.reference_id || "").trim();
        if (!ref) continue;
        const meta = [
          "XML feed",
          job.ppc_rate_usd != null ? formatMoney(Number(job.ppc_rate_usd), "USD") : "PPC",
          job.company || null,
          job.category || null,
          job.location_label || job.location || null,
          job.country || null,
        ]
          .filter(Boolean)
          .join(" · ");
        items.push({
          key: `xml:${ref}`,
          kind: "xml",
          xmlRef: ref,
          title: job.title || ref,
          meta,
          badge: "XML",
          search: [job.title, job.company, job.category, job.location, job.location_label, job.country, ref]
            .filter(Boolean)
            .join(" ")
            .toLowerCase(),
        });
      }
    }

    return items;
  }, [campaigns, xmlJobs, sourceKind]);

  const filteredPrograms = useMemo(() => {
    const q = programSearch.trim().toLowerCase();
    if (!q) return pickerItems;
    return pickerItems.filter((item) => item.search.includes(q));
  }, [pickerItems, programSearch]);

  const load = () => {
    setLoading(true);
    return Promise.all([fetchPublisherCommunities(), fetchPublisherTeam()])
      .then(([communities, teamRes]) => {
        setRows(communities);
        setTeam(teamRes.team);
        setCanInvite(teamRes.can_invite_managers);
        setRole(teamRes.membership_role);
        return communities;
      })
      .catch((err) => {
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load communities.",
        );
        return [] as PublisherCommunity[];
      })
      .finally(() => setLoading(false));
  };

  const loadCampaigns = (type: SourceKind = sourceKind) => {
    if (type === "xml") {
      setCampaigns([]);
      return;
    }
    setCampaignsLoading(true);
    const marketType = type === "all" ? "all" : type === "job" ? "job" : "campaign";
    fetchPublisherMarketplace({ type: marketType })
      .then((list) => setCampaigns(list))
      .catch(() => setCampaigns([]))
      .finally(() => setCampaignsLoading(false));
  };

  const loadXmlJobs = (search = programSearch) => {
    setXmlLoading(true);
    fetchPublicXmlJobs({
      page: 1,
      per_page: 100,
      search: search.trim() || undefined,
      auth: true,
    })
      .then((res) => setXmlJobs(res.jobs ?? []))
      .catch(() => setXmlJobs([]))
      .finally(() => setXmlLoading(false));
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (sourceKind === "xml") {
      setCampaigns([]);
    } else {
      loadCampaigns(sourceKind);
    }
    if (sourceKind === "all" || sourceKind === "job" || sourceKind === "xml") {
      loadXmlJobs();
    } else {
      setXmlJobs([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when source kind changes
  }, [sourceKind]);

  useEffect(() => {
    let cancelled = false;
    setCategoriesLoading(true);
    Promise.all([
      fetchNiches().catch(() => []),
      fetchJobMasterFilters().catch(() => ({ category: [] as Array<{ name: string }> })),
    ])
      .then(([niches, masters]) => {
        if (cancelled) return;
        const names = new Set<string>();
        for (const n of niches) {
          const name = (n.name || "").trim();
          if (name) names.add(name);
        }
        for (const row of masters.category ?? []) {
          const name = (row.name || "").trim();
          if (name) names.add(name);
        }
        setCategoryOptions([...names]);
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isItemSelected = (item: PickerItem) =>
    item.kind === "program"
      ? selectedProgramIds.includes(item.programId)
      : selectedXmlRefs.includes(item.xmlRef);

  const toggleItem = (item: PickerItem) => {
    if (item.kind === "program") {
      setSelectedProgramIds((prev) =>
        prev.includes(item.programId)
          ? prev.filter((x) => x !== item.programId)
          : [...prev, item.programId],
      );
      return;
    }
    setSelectedXmlRefs((prev) =>
      prev.includes(item.xmlRef)
        ? prev.filter((x) => x !== item.xmlRef)
        : [...prev, item.xmlRef],
    );
  };

  const selectAllFiltered = () => {
    setSelectedProgramIds((prev) => {
      const next = new Set(prev);
      for (const item of filteredPrograms) {
        if (item.kind === "program") next.add(item.programId);
      }
      return [...next];
    });
    setSelectedXmlRefs((prev) => {
      const next = new Set(prev);
      for (const item of filteredPrograms) {
        if (item.kind === "xml") next.add(item.xmlRef);
      }
      return [...next];
    });
  };

  const clearFilteredSelection = () => {
    const visiblePrograms = new Set(
      filteredPrograms
        .filter((i): i is Extract<PickerItem, { kind: "program" }> => i.kind === "program")
        .map((i) => i.programId),
    );
    const visibleXml = new Set(
      filteredPrograms
        .filter((i): i is Extract<PickerItem, { kind: "xml" }> => i.kind === "xml")
        .map((i) => i.xmlRef),
    );
    setSelectedProgramIds((prev) => prev.filter((id) => !visiblePrograms.has(id)));
    setSelectedXmlRefs((prev) => prev.filter((ref) => !visibleXml.has(ref)));
  };

  const selectedCount = selectedProgramIds.length + selectedXmlRefs.length;
  const listLoading = campaignsLoading || xmlLoading;

  async function copyJoinLink(row: PublisherCommunity) {
    const url = communityJoinUrl(row);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(row.id);
      setTimeout(() => setCopiedId((id) => (id === row.id ? null : id)), 2000);
    } catch {
      setError("Could not copy join link.");
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Community name is required.");
      return;
    }
    if (selectedCategories.length === 0) {
      setError("Pick at least one niche / category.");
      return;
    }
    if (selectedProgramIds.length === 0 && selectedXmlRefs.length === 0) {
      setError("Pick at least one job, XML job, or campaign for this community.");
      return;
    }
    setSaving(true);
    try {
      const created = await createPublisherCommunity({
        name: name.trim(),
        categories: selectedCategories,
        category: selectedCategories.join(", "),
        commission_percent: commissionPercent,
        description: description.trim() || undefined,
        country_code: country,
        campaign_access: campaignAccess,
        status: "active",
        program_ids: selectedProgramIds,
        xml_job_refs: selectedXmlRefs,
        ...(managerId ? { manager_user_id: Number(managerId) } : {}),
      });

      setName("");
      setSelectedCategories([]);
      setCommissionPercent(12);
      setDescription("");
      setManagerId("");
      const attachedCount = selectedProgramIds.length + selectedXmlRefs.length;
      setSelectedProgramIds([]);
      setSelectedXmlRefs([]);
      setProgramSearch("");
      setHighlightId(created.id);
      toast.success(
        communityJoinUrl(created) || created.join_path
          ? `Community created with ${attachedCount} job/campaign${attachedCount === 1 ? "" : "s"}. Share the join link below.`
          : "Community created.",
      );
      await load();
      requestAnimationFrame(() => {
        listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Could not create community.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(row: PublisherCommunity) {
    const next = row.status === "active" ? "paused" : "active";
    try {
      await updatePublisherCommunity(row.id, { status: next });
      toast.success(next === "active" ? "Community activated." : "Community paused.");
      load();
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Could not update community.",
      );
    }
  }

  async function onAssignManager(row: PublisherCommunity, userId: string) {
    try {
      await updatePublisherCommunity(row.id, {
        manager_user_id: userId ? Number(userId) : null,
      });
      toast.success("Community manager updated.");
      load();
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Could not assign manager.",
      );
    }
  }

  async function onInviteManager(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await invitePublisherManager({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
      });
      setInviteName("");
      setInviteEmail("");
      toast.success(res.message);
      load();
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Could not invite manager.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          Communities
        </p>
        <h1 className="mt-1 text-3xl font-bold">Manage communities</h1>
        <p className="mt-2 text-slate-500">
          {isOwner
            ? "Create communities, attach selected jobs or campaigns, and assign managers."
            : "You only see communities assigned to you as manager."}
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {isOwner ? (
        <form
          onSubmit={onCreate}
          className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold">Create community</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Community name *
              <input
                className={field}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="IT & Career Creators"
                required
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Country
              <select
                className={field}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="IN">India</option>
                <option value="AE">UAE</option>
                <option value="US">USA</option>
              </select>
            </label>
            <label className="sm:col-span-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Niche / categories *
              <MultiSelect
                options={categorySelectOptions}
                value={selectedCategories}
                onChange={setSelectedCategories}
                disabled={categoriesLoading}
                placeholder={
                  categoriesLoading
                    ? "Loading niches…"
                    : categorySelectOptions.length === 0
                      ? "No niches yet"
                      : "Select one or more niches"
                }
                searchPlaceholder="Search niches…"
                emptyLabel="No matching niches"
              />
              <span className="mt-1.5 block text-[11px] font-normal normal-case tracking-normal text-slate-500">
                Audience niches for this private community.
              </span>
            </label>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Publisher commission (10–15% of creator pool) *
              </p>
              <p className="mt-1 text-xs text-slate-500">
                JobOrio keeps 30% platform fee first. Your rate is taken from the
                remaining 70% pool (creators get the rest).
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {commissionOptions.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setCommissionPercent(pct)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      commissionPercent === pct
                        ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white"
                        : "border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Example on $10 at {commissionPercent}%: JobOrio $3.00 · you $
                {((7 * commissionPercent) / 100).toFixed(2)} · creators $
                {(7 - (7 * commissionPercent) / 100).toFixed(2)}
              </p>
            </div>
            <div className="sm:col-span-2 rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
                    Jobs & campaigns
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Choose manual jobs, XML feed jobs, or campaigns — filter,
                    then select what this community can promote.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (sourceKind !== "xml") loadCampaigns(sourceKind);
                    if (sourceKind === "all" || sourceKind === "job" || sourceKind === "xml") {
                      loadXmlJobs();
                    }
                  }}
                  className="text-xs font-semibold text-violet-700 hover:underline"
                >
                  Refresh list
                </button>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Source type
                  <select
                    className={field}
                    value={sourceKind}
                    onChange={(e) => setSourceKind(e.target.value as SourceKind)}
                  >
                    <option value="all">All (jobs + XML + campaigns)</option>
                    <option value="job">Jobs (manual + XML)</option>
                    <option value="xml">XML jobs only</option>
                    <option value="campaign">Campaigns only</option>
                  </select>
                </label>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Filter
                  <input
                    className={field}
                    value={programSearch}
                    onChange={(e) => setProgramSearch(e.target.value)}
                    onBlur={() => {
                      if (sourceKind === "all" || sourceKind === "job" || sourceKind === "xml") {
                        loadXmlJobs(programSearch);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (sourceKind === "all" || sourceKind === "job" || sourceKind === "xml") {
                          loadXmlJobs(programSearch);
                        }
                      }
                    }}
                    placeholder={
                      sourceKind === "xml"
                        ? "Search XML jobs by title, company, category…"
                        : sourceKind === "job"
                          ? "Search jobs by title, employer, category…"
                          : "Search by title, employer, type…"
                    }
                  />
                </label>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  disabled={filteredPrograms.length === 0}
                  className="rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-semibold text-violet-700 disabled:opacity-50"
                >
                  Select all filtered
                </button>
                <button
                  type="button"
                  onClick={clearFilteredSelection}
                  disabled={selectedCount === 0}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 disabled:opacity-50"
                >
                  Clear filtered
                </button>
                <span className="text-xs text-slate-500">
                  Showing {filteredPrograms.length}
                  {pickerItems.length !== filteredPrograms.length
                    ? ` of ${pickerItems.length}`
                    : ""}
                  {xmlJobs.length > 0 ? ` · ${xmlJobs.length} XML` : ""}
                </span>
              </div>

              {listLoading ? (
                <p className="mt-3 text-sm text-slate-500">
                  Loading{" "}
                  {sourceKind === "xml"
                    ? "XML jobs"
                    : sourceKind === "job"
                      ? "jobs"
                      : "campaigns"}
                  …
                </p>
              ) : pickerItems.length === 0 ? (
                <div className="mt-3 rounded-xl border border-dashed border-violet-200 bg-white px-4 py-5 text-sm text-slate-600">
                  <p className="font-semibold text-[#172b63]">
                    No live{" "}
                    {sourceKind === "xml"
                      ? "XML jobs"
                      : sourceKind === "job"
                        ? "jobs"
                        : "campaigns"}{" "}
                    yet
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {sourceKind === "xml" ? (
                      <>
                        XML jobs come from Admin → Syndication feeds. Refresh the
                        feed, then try again here.
                      </>
                    ) : (
                      <>
                        Launch one from Admin → Manual campaigns, or open{" "}
                        <Link
                          href="/publisher/marketplace"
                          className="font-semibold text-violet-700 hover:underline"
                        >
                          Campaign Marketplace
                        </Link>
                        .
                      </>
                    )}
                  </p>
                </div>
              ) : filteredPrograms.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                  No matches for this filter. Try another search or source type.
                </p>
              ) : (
                <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                  {filteredPrograms.map((item) => {
                    const checked = isItemSelected(item);
                    return (
                      <li key={item.key}>
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 hover:border-violet-200">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={checked}
                            onChange={() => toggleItem(item)}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-[#172b63]">
                                {item.title}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                  item.badge === "XML"
                                    ? "bg-amber-50 text-amber-800"
                                    : item.badge === "Job"
                                      ? "bg-sky-50 text-sky-700"
                                      : "bg-violet-50 text-violet-700"
                                }`}
                              >
                                {item.badge}
                              </span>
                            </span>
                            <span className="mt-0.5 block text-xs text-slate-500">
                              {item.meta}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
              {selectedCount > 0 ? (
                <p className="mt-2 text-xs font-semibold text-violet-700">
                  {selectedCount} selected
                  {selectedXmlRefs.length > 0
                    ? ` · ${selectedXmlRefs.length} XML`
                    : ""}
                </p>
              ) : null}
            </div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Manager (optional)
              <SingleSelect
                options={managerSelectOptions}
                value={managerId}
                onChange={setManagerId}
                placeholder="Search & select manager"
                searchPlaceholder="Search by name or email…"
                emptyLabel="No managers match"
                clearLabel="Clear manager"
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 sm:col-span-2">
              Description
              <textarea
                className={`${field} min-h-[88px]`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Creators promoting IT jobs and courses"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create community"}
          </button>
        </form>
      ) : null}

      {canInvite ? (
        <form
          onSubmit={onInviteManager}
          className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold">Invite manager</h2>
          <p className="mt-1 text-sm text-slate-500">
            Managers only access communities you assign to them. Financial and
            credential APIs stay owner-only.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Name
              <input
                className={field}
                required
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Email
              <input
                type="email"
                className={field}
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-full bg-[#172b63] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            Add manager
          </button>
        </form>
      ) : null}

      <div
        ref={listRef}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">
            {isOwner ? "Your communities" : "Assigned communities"}
          </h2>
          <p className="text-xs font-semibold text-slate-400">{rows.length} total</p>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Each community has a join link. Anyone who opens it and accepts is
          added as a member of that community.
        </p>
        {loading ? (
          <ListSkeleton rows={3} className="mt-4" />
        ) : rows.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            {isOwner
              ? "No communities yet. Create your first one above."
              : "No communities assigned to you yet."}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {rows.map((row) => (
              <li
                key={row.id}
                className={`rounded-2xl border px-4 py-3 ${
                  highlightId === row.id
                    ? "border-violet-300 bg-violet-50/60 ring-2 ring-violet-200"
                    : "border-slate-100 bg-slate-50"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-[#172b63]">{row.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.code}
                      {row.categories && row.categories.length > 0
                        ? ` · ${row.categories.join(" · ")}`
                        : row.category
                          ? ` · ${row.category}`
                          : ""}
                      {" · "}
                      {row.members_count} members
                      {row.commission_percent != null
                        ? ` · ${Number(row.commission_percent)}% commission`
                        : ""}
                      {" · "}
                      Selected campaigns
                      {row.xml_jobs_count
                        ? ` · ${row.xml_jobs_count} XML jobs`
                        : ""}
                      {row.manager
                        ? ` · Manager: ${row.manager.name}`
                        : " · No manager"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/publisher/network?community=${row.id}`}
                      className="rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-1.5 text-xs font-bold text-white"
                    >
                      Invite Team
                    </Link>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                        row.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {row.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => void toggleStatus(row)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      {row.status === "active" ? "Pause" : "Activate"}
                    </button>
                  </div>
                </div>

                {communityJoinUrl(row) || row.join_path ? (
                  <div className="mt-3 rounded-xl border border-emerald-100 bg-white px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                      Community join link
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <p className="min-w-0 flex-1 break-all text-xs font-medium text-[#172b63]">
                        {communityJoinUrl(row)}
                      </p>
                      <button
                        type="button"
                        onClick={() => void copyJoinLink(row)}
                        className="inline-flex items-center gap-1 rounded-full bg-[#172b63] px-3 py-1.5 text-xs font-bold text-white"
                      >
                        {copiedId === row.id ? (
                          <>
                            <Check size={14} /> Copied
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> Copy link
                          </>
                        )}
                      </button>
                      <a
                        href={communityJoinUrl(row)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        Open
                      </a>
                    </div>
                  </div>
                ) : null}

                {isOwner ? (
                  <label className="mt-3 block max-w-sm text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Assign manager
                    <SingleSelect
                      options={managerSelectOptions}
                      value={row.manager_user_id ? String(row.manager_user_id) : ""}
                      onChange={(next) => void onAssignManager(row, next)}
                      placeholder="Search & select manager"
                      searchPlaceholder="Search by name or email…"
                      emptyLabel="No managers match"
                      clearLabel="Clear manager"
                    />
                  </label>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
