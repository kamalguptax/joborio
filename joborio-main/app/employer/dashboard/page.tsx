"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PreferredJobsList from "@/components/job-preferences/PreferredJobsList";
import {
  fetchEmployerMe,
  fetchEmployerPreferredJobs,
  fetchEmployerPrograms,
} from "@/lib/api/employer";
import type { Listing } from "@/lib/api/types";

export default function EmployerDashboardPage() {
  const [company, setCompany] = useState<string>("");
  const [programs, setPrograms] = useState<Array<Record<string, unknown>>>([]);
  const [preferredJobs, setPreferredJobs] = useState<Listing[]>([]);

  useEffect(() => {
    fetchEmployerMe()
      .then((r) => setCompany(String(r.employer?.company_name ?? "Your company")))
      .catch(() => setCompany("Your company"));
    fetchEmployerPrograms()
      .then(setPrograms)
      .catch(() => setPrograms([]));
    fetchEmployerPreferredJobs()
      .then((rows) => setPreferredJobs(rows as Listing[]))
      .catch(() => setPreferredJobs([]));
  }, []);

  const active = programs.filter((p) => p.status === "active").length;
  const totalBudget = programs.reduce(
    (sum, p) => sum + Number(p.budget_total_usd ?? 0),
    0,
  );

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
            Employer dashboard
          </p>
          <h1 className="mt-1 text-3xl font-bold">{company}</h1>
          <p className="mt-2 text-slate-500">
            Launch programs and manage performance. Programs go live as soon as you create them.
          </p>
        </div>
        <Link
          href="/employer/programs/new"
          className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-md"
        >
          Create program
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-400">Programs</p>
          <p className="mt-2 text-3xl font-bold">{programs.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-400">Active</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{active}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-400">Total budget (USD)</p>
          <p className="mt-2 text-3xl font-bold">${totalBudget.toFixed(0)}</p>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Preferred jobs</h2>
          <Link
            href="/employer/job-preferences"
            className="text-sm font-semibold text-purple-600"
          >
            Job preferences →
          </Link>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Marketplace listings that match your hiring interests.
        </p>
        <div className="mt-4">
          <PreferredJobsList
            jobs={preferredJobs.slice(0, 5)}
            emptyHint="Set job preferences to see relevant listings."
          />
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Recent programs</h2>
          <Link href="/employer/programs" className="text-sm font-semibold text-purple-600">
            View all
          </Link>
        </div>
        <ul className="mt-4 space-y-3">
          {programs.slice(0, 5).map((p) => (
            <li
              key={String(p.id)}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div>
                <p className="font-semibold">{String(p.title)}</p>
                <p className="text-xs text-slate-500">
                  {String(p.pricing_model).toUpperCase()} · {String(p.status)}
                </p>
              </div>
              {p.pricing_model === "ppa" ? (
                <Link
                  href={`/employer/programs/${p.id}/applications`}
                  className="text-sm font-semibold text-purple-600"
                >
                  Applications
                </Link>
              ) : null}
            </li>
          ))}
          {programs.length === 0 ? (
            <li className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              No programs yet.{" "}
              <Link href="/employer/programs/new" className="font-semibold text-purple-600">
                Create your first program
              </Link>
            </li>
          ) : null}
        </ul>
      </div>
    </>
  );
}
