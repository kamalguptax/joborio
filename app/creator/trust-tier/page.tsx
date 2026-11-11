"use client";

import Link from "next/link";
import { Briefcase, Building2, Gift, Megaphone, Wallet } from "lucide-react";

const creatorFeatures = [
  {
    title: "Share & earn (PPC / PPR / PPA)",
    text: "Promote jobs, courses and campaigns with tracked links. All earning models are open on creator accounts.",
    icon: Briefcase,
  },
  {
    title: "Campaigns & registrations",
    text: "Join brand programs and get credited when people register or convert through your links.",
    icon: Megaphone,
  },
  {
    title: "Referrals",
    text: "Invite other creators and earn a share of JobOrio’s platform fee when they succeed.",
    icon: Gift,
  },
  {
    title: "Payouts",
    text: "Add a payout method to receive approved earnings. Auto payouts run once a method is on file.",
    icon: Wallet,
  },
];

const employerFeatures = [
  {
    title: "Launch campaigns",
    text: "Employers post jobs and paid campaigns, set budgets, and reach creators’ audiences.",
    icon: Building2,
  },
  {
    title: "Hire through communities",
    text: "Get candidates and leads via creators — not cold job boards alone.",
    icon: Briefcase,
  },
];

export default function AccountFeaturesPage() {
  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
          Account type
        </p>
        <h1 className="mt-1 text-3xl font-bold">Creator features</h1>
        <p className="mt-2 max-w-2xl text-slate-500">
          Access is by user type — creator or employer — not by trust tier. You are on a
          creator account, so monetization tools below are available.
        </p>
      </div>

      <div className="rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-6 sm:p-8">
        <p className="text-sm text-slate-500">Your account</p>
        <p className="mt-1 text-3xl font-bold text-purple-700">Creator</p>
        <p className="mt-2 text-sm text-slate-600">
          PPC, PPR, PPA, campaigns, referrals and payouts are unlocked for creators.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/creator/opportunities"
            className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Browse opportunities
          </Link>
          <Link
            href="/creator/payout"
            className="rounded-full border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-700"
          >
            Set up payout
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {creatorFeatures.map(({ title, text, icon: Icon }) => (
          <div
            key={title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
              <Icon size={18} />
            </div>
            <p className="mt-3 font-bold text-[#172b63]">{title}</p>
            <p className="mt-1 text-sm text-slate-500">{text}</p>
          </div>
        ))}
      </div>

      <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">Employer accounts are different</h2>
        <p className="mt-1 text-sm text-slate-500">
          Hiring brands use employer features — separate from creator monetization.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {employerFeatures.map(({ title, text, icon: Icon }) => (
            <div key={title} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-[#172b63]">
                <Icon size={16} className="text-slate-500" />
                {title}
              </div>
              <p className="mt-1 text-sm text-slate-500">{text}</p>
            </div>
          ))}
        </div>
        <Link
          href="/hiring"
          className="mt-4 inline-block text-sm font-semibold text-purple-700 hover:text-blue-600"
        >
          Learn about hiring →
        </Link>
      </section>
    </>
  );
}
