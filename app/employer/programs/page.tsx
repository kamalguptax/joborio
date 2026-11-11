"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchEmployerPrograms,
  goLiveEmployerProgram,
} from "@/lib/api/employer";
import { ApiClientError } from "@/lib/api/client";

export default function EmployerProgramsPage() {
  const [programs, setPrograms] = useState<Array<Record<string, unknown>>>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = () => {
    fetchEmployerPrograms().then(setPrograms).catch(() => setPrograms([]));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your programs</h1>
        <Link
          href="/employer/programs/new"
          className="rounded-full bg-purple-600 px-4 py-2 text-sm font-bold text-white"
        >
          New program
        </Link>
      </div>
      {msg ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {msg}{" "}
          <Link href="/employer/billing" className="font-semibold underline">
            Open company & payment
          </Link>
        </p>
      ) : null}
      <ul className="mt-8 space-y-3">
        {programs.map((p) => (
          <li
            key={String(p.id)}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold">
                  {String(p.title)}
                  {p.trial_without_ip ? (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      Trial · no IP
                    </span>
                  ) : null}
                </p>
                <p className="text-sm text-slate-500">
                  {String(p.pricing_model).toUpperCase()} · {String(p.status)}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {(p.status === "pending_review" || p.status === "paused") &&
                !p.trial_without_ip ? (
                  <button
                    type="button"
                    disabled={busyId === Number(p.id)}
                    onClick={async () => {
                      setMsg(null);
                      setBusyId(Number(p.id));
                      try {
                        await goLiveEmployerProgram(Number(p.id));
                        load();
                      } catch (err) {
                        setMsg(
                          err instanceof ApiClientError
                            ? err.message
                            : "Complete billing before going live.",
                        );
                      } finally {
                        setBusyId(null);
                      }
                    }}
                    className="text-sm font-semibold text-emerald-700"
                  >
                    Go live
                  </button>
                ) : null}
                <Link
                  href={`/employer/programs/${p.id}`}
                  className="text-sm font-semibold text-purple-600"
                >
                  Dashboard
                </Link>
                {p.pricing_model === "ppa" ? (
                  <Link
                    href={`/employer/programs/${p.id}/applications`}
                    className="text-sm font-semibold text-purple-600"
                  >
                    Applications
                  </Link>
                ) : null}
              </div>
            </div>
          </li>
        ))}
        {programs.length === 0 ? (
          <p className="text-sm text-slate-500">No programs yet.</p>
        ) : null}
      </ul>
    </>
  );
}
