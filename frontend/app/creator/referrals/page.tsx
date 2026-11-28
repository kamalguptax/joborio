"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Copy,
  Check,
  Users,
  Share2,
  UserPlus,
  Sparkles,
  Gift,
  ChevronDown,
} from "lucide-react";
import {
  fetchCreatorReferrals,
  notifyReferredCreators,
  recordCreatorReferralShare,
  type CreatorReferralDashboard,
} from "@/lib/api/creator";
import { formatMoney } from "@/lib/money";
import { toast } from "@/components/ui/Toast";
import { SectionSkeleton } from "@/components/ui/Skeleton";
import PageHeader from "@/components/layout/PageHeader";

const LIVE_SITE = "https://joborio.com";

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Share your invite",
    body: "Copy your unique link or code and share it with creators on WhatsApp, Telegram, LinkedIn, or email.",
  },
  {
    step: "2",
    title: "They sign up & onboard",
    body: "When someone joins with your link, they appear under Referred creators after they finish onboarding.",
  },
  {
    step: "3",
    title: "They start earning",
    body: "Once their approved earnings hit the bonus threshold, you get a one-time bonus and platform-fee override.",
  },
  {
    step: "4",
    title: "Nudge inactive referrals",
    body: "Filter Active / Inactive, select creators, and send a notify to help them get started.",
  },
];

const FAQS = [
  {
    q: "How do I refer someone?",
    a: "Copy your invite link from this page and share it. Anyone who signs up through that link is attributed to you.",
  },
  {
    q: "When do I get the bonus?",
    a: "You earn a one-time bonus when a referred creator reaches the approved-earnings threshold shown on this page.",
  },
  {
    q: "What is the override?",
    a: "For a limited number of months, you earn a percent of Upclift’s platform fee on their earnings. It is not taken from their creator share.",
  },
  {
    q: "What do Shares and Onboarding mean?",
    a: "Shares count each time you copy/share your invite from this page. Onboarding counts referred creators who finished creator onboarding.",
  },
  {
    q: "Can I message my referrals?",
    a: "Yes. Filter by Active or Inactive, select creators, add an optional note, and tap Send notify.",
  },
];

function liveInviteUrl(apiUrl: string, code: string): string {
  const fallback = `${LIVE_SITE}/signup/?ref=${encodeURIComponent(code)}`;
  try {
    const parsed = new URL(apiUrl);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return fallback;
    }
    return apiUrl;
  } catch {
    return fallback;
  }
}

export default function CreatorReferralsPage() {
  const [data, setData] = useState<CreatorReferralDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showActive, setShowActive] = useState(true);
  const [showInactive, setShowInactive] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    fetchCreatorReferrals()
      .then(setData)
      .catch(() => setError("Could not load referral program."));
  }, []);

  const inviteLink = data
    ? liveInviteUrl(data.referral_url, data.referral_code)
    : "";

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.referred_creators.filter((row) => {
      if (row.is_active && showActive) return true;
      if (!row.is_active && showInactive) return true;
      return false;
    });
  }, [data, showActive, showInactive]);

  useEffect(() => {
    const visible = new Set(filtered.map((r) => r.id));
    setSelectedIds((prev) => prev.filter((id) => visible.has(id)));
  }, [filtered]);

  const bumpShare = async () => {
    try {
      const res = await recordCreatorReferralShare();
      setData((prev) =>
        prev
          ? {
              ...prev,
              stats: { ...prev.stats, shares: res.shares },
            }
          : prev,
      );
    } catch {
      /* share still succeeds for the user even if count fails */
    }
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Invite link copied");
    void bumpShare();
    setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = async () => {
    if (!inviteLink || !data) return;
    const text = `Join Upclift with my invite code ${data.referral_code}: ${inviteLink}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "Join Upclift",
          text,
          url: inviteLink,
        });
      } else {
        await navigator.clipboard.writeText(inviteLink);
        toast.success("Invite link copied");
      }
      void bumpShare();
    } catch {
      /* cancelled */
    }
  };

  const toggleSelected = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((r) => selectedIds.includes(r.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(filtered.map((r) => r.id));
  };

  const sendNotify = async () => {
    if (selectedIds.length === 0) {
      toast.error("Select at least one referred creator.");
      return;
    }
    setSending(true);
    try {
      const result = await notifyReferredCreators({
        creator_ids: selectedIds,
        message: message.trim() || undefined,
      });
      toast.success(
        `Notify sent to ${result.sent} creator${result.sent === 1 ? "" : "s"}${
          result.skipped ? ` · ${result.skipped} skipped` : ""
        }.`,
      );
      setSelectedIds([]);
      setMessage("");
    } catch {
      toast.error("Could not send notify. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader title="Refer creators" />
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
          Module J · Growth
        </p>
        <p className="mt-2 text-slate-500">
          Share your link or code. Referred creators keep about 75% of revenue;
          you earn 2–5% from Upclift’s platform fee on their earnings.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {data ? (
        <>
          {/* Refer card */}
          <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-500 p-6 text-white shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                  Your refer card
                </p>
                <p className="mt-1 font-mono text-3xl font-bold tracking-wide">
                  {data.referral_code}
                </p>
                <p className="mt-2 max-w-md break-all text-xs text-white/75">
                  {inviteLink}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-violet-700"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copied" : "Copy link"}
                </button>
                <button
                  type="button"
                  onClick={() => void nativeShare()}
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/20"
                >
                  <Share2 size={16} />
                  Share
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: "Shares",
                  value: String(data.stats.shares ?? 0),
                  icon: Share2,
                },
                {
                  label: "Onboarding",
                  value: String(
                    data.stats.onboarding ?? data.stats.signups ?? 0,
                  ),
                  icon: UserPlus,
                },
                {
                  label: "Active",
                  value: String(data.stats.active_referrals),
                  icon: Sparkles,
                },
                {
                  label: "Bonus",
                  value: formatMoney(
                    data.stats.bonus_earned_usd,
                    data.currency,
                  ),
                  icon: Gift,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"
                >
                  <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/70">
                    <item.icon size={12} />
                    {item.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-600">
            <strong>{formatMoney(data.terms.bonus_usd, data.currency)}</strong>{" "}
            one-time bonus when a referral reaches{" "}
            <strong>
              {formatMoney(data.terms.bonus_threshold_usd, data.currency)}
            </strong>{" "}
            in approved earnings.{" "}
            <strong>{data.terms.override_percent}%</strong> of the platform fee
            for {data.terms.override_months} months (not taken from their 75%
            share). Override earned so far:{" "}
            <strong>
              {formatMoney(data.stats.override_earned_usd, data.currency)}
            </strong>
            .
          </p>

          {/* How it works */}
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#0A2150]">How it works</h2>
            <p className="mt-1 text-sm text-slate-500">
              Four steps from share to payout.
            </p>
            <ol className="mt-5 grid gap-4 sm:grid-cols-2">
              {HOW_IT_WORKS.map((item) => (
                <li
                  key={item.step}
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
                >
                  <p className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                    {item.step}
                  </p>
                  <p className="mt-3 font-semibold text-[#0A2150]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{item.body}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* FAQ */}
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#0A2150]">FAQ</h2>
            <p className="mt-1 text-sm text-slate-500">
              Common questions about referring creators.
            </p>
            <div className="mt-4 divide-y divide-slate-100">
              {FAQS.map((item, idx) => {
                const open = openFaq === idx;
                return (
                  <div key={item.q} className="py-1">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : idx)}
                      className="flex w-full items-center justify-between gap-3 py-3 text-left"
                      aria-expanded={open}
                    >
                      <span className="font-semibold text-[#0A2150]">
                        {item.q}
                      </span>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-slate-400 transition ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {open ? (
                      <p className="pb-3 text-sm leading-relaxed text-slate-500">
                        {item.a}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Referred creators */}
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-purple-600" />
                <h2 className="font-bold">Referred creators</h2>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <label className="inline-flex items-center gap-2 font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={showActive}
                    onChange={(e) => setShowActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                  Active
                </label>
                <label className="inline-flex items-center gap-2 font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                  Inactive
                </label>
              </div>
            </div>

            {data.referred_creators.length > 0 ? (
              <div className="space-y-3 border-b border-slate-100 px-4 py-3">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Notify message
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    maxLength={500}
                    placeholder="Optional note for selected creators…"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-[#0A2150] outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                  />
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void sendNotify()}
                    disabled={sending || selectedIds.length === 0}
                    className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    <Bell size={16} />
                    {sending
                      ? "Sending…"
                      : `Send notify (${selectedIds.length})`}
                  </button>
                  <p className="text-xs text-slate-500">
                    Showing {filtered.length} of {data.referred_creators.length}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAll}
                        disabled={filtered.length === 0}
                        aria-label="Select all visible"
                        className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                      />
                    </th>
                    <th className="px-4 py-2">Handle</th>
                    <th className="px-4 py-2">Earnings</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} className="border-t border-slate-50">
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.id)}
                          onChange={() => toggleSelected(row.id)}
                          aria-label={`Select @${row.handle}`}
                          className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                        />
                      </td>
                      <td className="px-4 py-2 font-medium">@{row.handle}</td>
                      <td className="px-4 py-2">
                        {formatMoney(row.approved_earnings_usd, data.currency)}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {row.is_active ? (
                          <span className="font-semibold text-emerald-600">
                            Active
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-400">
                            Inactive
                          </span>
                        )}
                        {row.bonus_paid ? " · bonus paid" : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.referred_creators.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">
                No referrals yet. Share your invite link to get started.
              </p>
            ) : filtered.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">
                No creators match the Active / Inactive filters.
              </p>
            ) : null}
          </div>
        </>
      ) : !error ? (
        <SectionSkeleton />
      ) : null}
    </>
  );
}
