"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "@/components/ui/Toast";
import {
  adminActivateProgram,
  adminListPrograms,
  adminPauseProgram,
} from "@/lib/api/admin";
import { adminPath } from "@/lib/adminNav";

function formatDate(value: unknown): string {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{String(p.title)}</p>
              <p className="text-sm text-slate-400">
                {String(p.status)} · {String(p.pricing_model)}
                {p.trial_without_ip ? " · Trial (no IP)" : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                <span>
                  Created:{" "}
                  <span className="text-slate-200">{formatDate(p.created_at)}</span>
                </span>
                <span>
                  Start:{" "}
                  <span className="text-slate-200">{formatDate(p.starts_at)}</span>
                </span>
                <span>
                  End:{" "}
                  <span className="text-slate-200">{formatDate(p.ends_at)}</span>
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`${adminPath("/admin/campaigns")}?edit=${p.id}`}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-sm font-semibold"
              >
                Edit
              </Link>
              {p.status === "pending_review" ||
              p.status === "paused" ||
              p.status === "budget_exhausted" ? (
                <button
                  type="button"
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-bold"
                  onClick={async () => {
                    try {
                      await adminActivateProgram(Number(p.id));
                      toast.success("Program activated.");
                      load();
                    } catch {
                      toast.error("Could not activate the program.");
                    }
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
                    try {
                      await adminPauseProgram(Number(p.id));
                      toast.success("Program paused.");
                      load();
                    } catch {
                      toast.error("Could not pause the program.");
                    }
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
