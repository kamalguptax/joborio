"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Users } from "lucide-react";
import {
  fetchCreatorReferrals,
  type CreatorReferralDashboard,
} from "@/lib/api/creator";
import { formatMoney } from "@/lib/money";

const LIVE_SITE = "https://joborio.com";

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

  useEffect(() => {
    fetchCreatorReferrals()
      .then(setData)
      .catch(() => setError("Could not load referral program."));
  }, []);

  const inviteLink = data ? liveInviteUrl(data.referral_url, data.referral_code) : "";

  const copyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
          Module J · Growth
        </p>
        <h1 className="mt-1 text-3xl font-bold">Refer creators</h1>
        <p className="mt-2 text-slate-500">
          Share your link or code. Referred creators keep about 75% of revenue;
          you earn 2–5% from JobOrio’s platform fee on their earnings.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {data ? (
        <>
          <div className="rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-400">Your code</p>
            <p className="mt-1 font-mono text-2xl font-bold text-indigo-950">
              {data.referral_code}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-bold text-white"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied" : "Copy invite link"}
              </button>
            </div>
            <p className="mt-3 break-all text-xs text-slate-500">{inviteLink}</p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Signups", data.stats.signups],
              [`Active (${formatMoney(data.terms.bonus_threshold_usd, data.currency, 0)}+)`, data.stats.active_referrals],
              ["Bonus", formatMoney(data.stats.bonus_earned_usd, data.currency)],
              ["Override", formatMoney(data.stats.override_earned_usd, data.currency)],
            ].map(([label, val]) => (
              <div
                key={String(label)}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-xs text-slate-400">{label}</p>
                <p className="mt-1 text-2xl font-bold">{val}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-sm text-slate-600">
            <strong>{formatMoney(data.terms.bonus_usd, data.currency)}</strong> one-time bonus when
            a referral reaches{" "}
            <strong>{formatMoney(data.terms.bonus_threshold_usd, data.currency)}</strong> in
            approved earnings.{" "}
            <strong>{data.terms.override_percent}%</strong> of the platform fee for{" "}
            {data.terms.override_months} months (not taken from their 75% share).
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <Users size={18} className="text-purple-600" />
              <h2 className="font-bold">Referred creators</h2>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Handle</th>
                  <th className="px-4 py-2">Earnings</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.referred_creators.map((row) => (
                  <tr key={row.id} className="border-t border-slate-50">
                    <td className="px-4 py-2 font-medium">@{row.handle}</td>
                    <td className="px-4 py-2">
                      {formatMoney(row.approved_earnings_usd, data.currency)}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {row.is_active ? (
                        <span className="text-emerald-600">Active</span>
                      ) : (
                        <span className="text-slate-400">Pending</span>
                      )}
                      {row.bonus_paid ? " · bonus paid" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.referred_creators.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">
                No referrals yet. Share your invite link to get started.
              </p>
            ) : null}
          </div>
        </>
      ) : !error ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : null}
    </>
  );
}
