"use client";

import { useEffect, useState } from "react";
import {
  adminActivateProgram,
  adminListPrograms,
  adminPauseProgram,
} from "@/lib/api/admin";

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<Array<Record<string, unknown>>>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => {
    adminListPrograms()
      .then(({ data }) => setPrograms(data))
      .catch(() => setMsg("Failed to load programs"));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <h1 className="text-2xl font-bold">Employer programs</h1>
      {msg ? <p className="mt-4 text-sm text-amber-300">{msg}</p> : null}
      <ul className="mt-8 space-y-3">
        {programs.map((p) => (
          <li
            key={String(p.id)}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div>
              <p className="font-semibold">{String(p.title)}</p>
              <p className="text-sm text-slate-400">
                {String(p.status)} · {String(p.pricing_model)}
                {p.trial_without_ip ? " · Trial (no IP)" : ""}
              </p>
            </div>
            <div className="flex gap-2">
              {p.status === "pending_review" || p.status === "paused" ? (
                <button
                  type="button"
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-bold"
                  onClick={async () => {
                    await adminActivateProgram(Number(p.id));
                    load();
                  }}
                >
                  Activate
                </button>
              ) : null}
              {p.status === "active" ? (
                <button
                  type="button"
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-sm"
                  onClick={async () => {
                    await adminPauseProgram(Number(p.id));
                    load();
                  }}
                >
                  Pause
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
