"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiClientError } from "@/lib/api/client";
import { fetchNiches } from "@/lib/api/creator";
import { fetchJobMasterFilters } from "@/lib/api/jobMasters";
import {
  communityJoinUrl,
  createPublisherCommunity,
  fetchPublisherMarketplace,
  fetchPublisherTeam,
  type MarketplaceCampaign,
  type PublisherTeamMember,
} from "@/lib/api/publisher";
import { fetchPublicXmlJobs } from "@/lib/syndication/publicXmlFeed";
import type { SyndicatedJob } from "@/lib/api/syndication";
import { formatMoney } from "@/lib/money";
import MultiSelect from "@/components/ui/MultiSelect";
import SingleSelect from "@/components/ui/SingleSelect";
import { toast } from "@/components/ui/Toast";
import BackButton from "@/components/ui/BackButton";
import PageHeader from "@/components/layout/PageHeader";

const field =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#172b63] outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10";

type SourceKind = "all" | "job" | "campaign";

type PickerItemBase = {
  key: string;
  title: string;
  meta: string;
  search: string;
  rateText?: string;
  company?: string;
  location?: string;
  model?: string;
  note?: string;
};

type PickerItem =
  | (PickerItemBase & {
      kind: "program";
      programId: number;
      badge: "Job" | "Campaign";
    })
  | (PickerItemBase & {
      kind: "xml";
      xmlRef: string;
      badge: "Job";
    });

export default function PublisherCreateCommunityPage() {
  const router = useRouter();
  const [team, setTeam] = useState<PublisherTeamMember[]>([]);
  const [campaigns, setCampaigns] = useState<MarketplaceCampaign[]>([]);
  const [xmlJobs, setXmlJobs] = useState<SyndicatedJob[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [xmlLoading, setXmlLoading] = useState(false);
  const [selectedProgramIds, setSelectedProgramIds] = useState<number[]>([]);
  const [selectedXmlRefs, setSelectedXmlRefs] = useState<string[]>([]);
  /** Jobs (manual + XML feed) and/or campaigns. */
  const [sourceKind, setSourceKind] = useState<SourceKind>("all");
  const [programSearch, setProgramSearch] = useState("");
  const [role, setRole] = useState<string>("owner");
  const [error, setError] = useState<string | null>(null);
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

  const categoryNeedles = useMemo(
    () =>
      selectedCategories
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean),
    [selectedCategories],
  );

  const matchesSelectedCategories = (haystack: string) => {
    if (categoryNeedles.length === 0) return true;
    const hay = haystack.toLowerCase();
    return categoryNeedles.some((needle) => {
      if (hay.includes(needle) || needle.includes(hay)) return true;
      return needle
        .split(/[\s/,&-]+/)
        .filter((t) => t.length >= 3)
        .some((token) => hay.includes(token));
    });
  };

  const pickerItems = useMemo((): PickerItem[] => {
    const items: PickerItem[] = [];
    const includePrograms =
      sourceKind === "all" || sourceKind === "job" || sourceKind === "campaign";
    const includeXml = sourceKind === "all" || sourceKind === "job";

    if (includePrograms) {
      for (const c of campaigns) {
        const isJob =
          c.source_kind === "job" ||
          String(c.promotion_type ?? "").toLowerCase() === "job";
        if (sourceKind === "job" && !isJob) continue;
        if (sourceKind === "campaign" && isJob) continue;
        if (
          categoryNeedles.length > 0 &&
          !matchesSelectedCategories(
            [c.category, c.title, c.listing_title, c.promotion_type]
              .filter(Boolean)
              .join(" "),
          )
        ) {
          continue;
        }
        const model = c.pricing_model
          ? String(c.pricing_model).toUpperCase()
          : "";
        const rateText =
          c.rate_usd != null ? formatMoney(Number(c.rate_usd), "USD") : undefined;
        const note = c.assigned_community_count
          ? `Already on ${c.assigned_community_count} other community${c.assigned_community_count === 1 ? "" : "ies"}`
          : undefined;
        const meta = [
          (c.promotion_type || "campaign").toString(),
          model || null,
          rateText || null,
          c.employer || null,
          c.category || null,
          c.country_code || null,
          note || null,
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
          rateText,
          company: c.employer || undefined,
          location: c.country_code || c.category || undefined,
          model: model || undefined,
          note,
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
        if (
          categoryNeedles.length > 0 &&
          !matchesSelectedCategories(
            [job.category, job.title, job.jobtype, job.description_text]
              .filter(Boolean)
              .join(" "),
          )
        ) {
          continue;
        }
        const rateText =
          job.ppc_rate_usd != null
            ? formatMoney(Number(job.ppc_rate_usd), "USD")
            : undefined;
        const location =
          job.location_label || job.location || job.country || undefined;
        const meta = [
          "job",
          "PPC",
          rateText || null,
          job.company || null,
          job.category || null,
          location || null,
        ]
          .filter(Boolean)
          .join(" · ");
        items.push({
          key: `xml:${ref}`,
          kind: "xml",
          xmlRef: ref,
          title: job.title || ref,
          meta,
          badge: "Job",
          rateText,
          company: job.company || undefined,
          location,
          model: "PPC",
          search: [job.title, job.company, job.category, job.location, job.location_label, job.country, ref]
            .filter(Boolean)
            .join(" ")
            .toLowerCase(),
        });
      }
    }

    return items;
  }, [campaigns, xmlJobs, sourceKind, categoryNeedles]);

  const filteredPrograms = useMemo(() => {
    const q = programSearch.trim().toLowerCase();
    if (!q) return pickerItems;
    return pickerItems.filter((item) => item.search.includes(q));
  }, [pickerItems, programSearch]);

  const load = () => {
    return fetchPublisherTeam()
      .then((teamRes) => {
        setTeam(teamRes.team);
        setRole(teamRes.membership_role);
        if (teamRes.membership_role !== "owner") {
          router.replace("/publisher/communities");
        }
      })
      .catch((err) => {
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load publisher team.",
        );
      });
  };

  const loadCampaigns = (type: SourceKind = sourceKind) => {
    setCampaignsLoading(true);
    const marketType =
      type === "all" ? "all" : type === "job" ? "job" : "campaign";
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
    if (sourceKind === "campaign") {
      setXmlJobs([]);
      loadCampaigns(sourceKind);
    } else {
      loadCampaigns(sourceKind);
      loadXmlJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when source kind changes
  }, [sourceKind]);

  // When niches change, auto-select matching feed jobs for this community.
  useEffect(() => {
    if (categoryNeedles.length === 0) return;
    const matchingXml = xmlJobs
      .map((job) => (job.reference_id || "").trim())
      .filter(Boolean)
      .filter((ref) => {
        const job = xmlJobs.find((j) => j.reference_id === ref);
        if (!job) return false;
        return matchesSelectedCategories(
          [job.category, job.title, job.jobtype, job.description_text]
            .filter(Boolean)
            .join(" "),
        );
      });
    if (matchingXml.length === 0) return;
    setSelectedXmlRefs((prev) => {
      const next = new Set([...prev, ...matchingXml]);
      return [...next];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryNeedles.join("|"), xmlJobs]);

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
      setError("Pick at least one job or campaign for this community.");
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

      const attachedCount = selectedProgramIds.length + selectedXmlRefs.length;
      toast.success(
        communityJoinUrl(created) || created.join_path
          ? `Community created with ${attachedCount} job/campaign${attachedCount === 1 ? "" : "s"}. Share the join link from the list.`
          : "Community created.",
      );
      router.push("/publisher/communities");
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

  if (!isOwner) {
    return (
      <>
        <BackButton href="/publisher/communities" label="Back to communities" />
        <p className="mt-6 text-sm text-slate-500">
          Only publishers can create communities.
        </p>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Create community" />
      <div className="mb-8">
        <BackButton href="/publisher/communities" label="Back to communities" />
        <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-violet-600">
          Communities
        </p>
        <p className="mt-2 text-slate-500">
          Name your community, pick niches, attach jobs or campaigns, then
          invite members with the join link.
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <form
          onSubmit={onCreate}
          className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold">Community details</h2>
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
                Jobs from the live XML feed are filtered and attached by these
                niches. When the feed updates, community jobs refresh
                automatically.
              </span>
            </label>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Publisher commission (10–15% of creator pool) *
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Upclift keeps 30% platform fee first. Your rate is taken from the
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
                Example on $10 at {commissionPercent}%: Upclift $3.00 · you $
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
                    Showing jobs for your selected niches. Feed jobs auto-attach
                    and stay updated when the XML feed refreshes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    loadCampaigns(sourceKind);
                    if (sourceKind !== "campaign") loadXmlJobs();
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
                    <option value="all">All (jobs + campaigns)</option>
                    <option value="job">Jobs</option>
                    <option value="campaign">Campaigns</option>
                  </select>
                </label>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Filter
                  <input
                    className={field}
                    value={programSearch}
                    onChange={(e) => setProgramSearch(e.target.value)}
                    onBlur={() => {
                      if (sourceKind !== "campaign") {
                        loadXmlJobs(programSearch);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (sourceKind !== "campaign") {
                          loadXmlJobs(programSearch);
                        }
                      }
                    }}
                    placeholder={
                      sourceKind === "job"
                        ? "Search jobs by title, employer, category…"
                        : sourceKind === "campaign"
                          ? "Search campaigns by title, employer…"
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
                  {xmlJobs.length > 0 && sourceKind !== "campaign"
                    ? ` · ${xmlJobs.length} feed jobs`
                    : ""}
                </span>
              </div>

              {listLoading ? (
                <p className="mt-3 text-sm text-slate-500">
                  Loading{" "}
                  {sourceKind === "job"
                    ? "jobs"
                    : sourceKind === "campaign"
                      ? "campaigns"
                      : "jobs & campaigns"}
                  …
                </p>
              ) : pickerItems.length === 0 ? (
                <div className="mt-3 rounded-xl border border-dashed border-violet-200 bg-white px-4 py-5 text-sm text-slate-600">
                  <p className="font-semibold text-[#172b63]">
                    No live{" "}
                    {sourceKind === "job"
                      ? "jobs"
                      : sourceKind === "campaign"
                        ? "campaigns"
                        : "jobs or campaigns"}{" "}
                    yet
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Launch one from Admin → Manual campaigns / Syndication, or
                    open{" "}
                    <Link
                      href="/publisher/marketplace"
                      className="font-semibold text-violet-700 hover:underline"
                    >
                      Campaign Marketplace
                    </Link>
                    .
                  </p>
                </div>
              ) : filteredPrograms.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                  No matches for this filter. Try another search or source type.
                </p>
              ) : (
                <div className="mt-3 max-h-[28rem] overflow-y-auto rounded-2xl border border-violet-100 bg-white/70 p-3">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {filteredPrograms.map((item) => {
                      const checked = isItemSelected(item);
                      return (
                        <label
                          key={item.key}
                          className={`flex h-full cursor-pointer flex-col rounded-2xl border p-3 transition ${
                            checked
                              ? "border-violet-400 bg-violet-50 ring-2 ring-violet-200"
                              : "border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/40"
                          }`}
                        >
                          <span className="flex items-start justify-between gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                item.badge === "Job"
                                  ? "bg-sky-50 text-sky-700"
                                  : "bg-violet-50 text-violet-700"
                              }`}
                            >
                              {item.badge}
                            </span>
                            <input
                              type="checkbox"
                              className="mt-0.5 h-4 w-4 accent-violet-600"
                              checked={checked}
                              onChange={() => toggleItem(item)}
                            />
                          </span>
                          <span className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-[#172b63]">
                            {item.title}
                          </span>
                          {(item.company || item.location) ? (
                            <span className="mt-1 line-clamp-1 text-xs text-slate-500">
                              {[item.company, item.location]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          ) : null}
                          <span className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-3">
                            <span>
                              {item.rateText ? (
                                <span className="block text-base font-bold text-emerald-700">
                                  {item.rateText}
                                </span>
                              ) : (
                                <span className="block text-xs font-semibold text-slate-400">
                                  Rate TBD
                                </span>
                              )}
                              {item.model ? (
                                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                  {item.model}
                                </span>
                              ) : null}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                checked
                                  ? "bg-violet-600 text-white"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {checked ? "Selected" : "Select"}
                            </span>
                          </span>
                          {item.note ? (
                            <span className="mt-2 line-clamp-2 text-[10px] text-slate-400">
                              {item.note}
                            </span>
                          ) : null}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              {selectedCount > 0 ? (
                <p className="mt-2 text-xs font-semibold text-violet-700">
                  {selectedCount} selected
                  {selectedXmlRefs.length > 0
                    ? ` · ${selectedXmlRefs.length} feed jobs`
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
    </>
  );
}
