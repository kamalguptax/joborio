"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchEmployerNotificationPreferences,
  saveEmployerNotificationPreferences,
} from "@/lib/api/employer";
import { ApiClientError } from "@/lib/api/client";
import { toast } from "@/components/ui/Toast";

type NotifRow = {
  l: string;
  sev: string;
  in_app: boolean;
  email: boolean;
  critical?: boolean;
};

function sevPill(sev: string) {
  if (sev === "High") return "bg-rose-50 text-rose-700";
  if (sev === "Medium") return "bg-amber-50 text-amber-800";
  return "bg-slate-100 text-slate-600";
}

export default function EmployerNotificationsPage() {
  const [rows, setRows] = useState<NotifRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchEmployerNotificationPreferences()
      .then((d) => setRows(d.preferences ?? []))
      .catch(() => toast.error("Could not load preferences."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flip = async (i: number, key: "in_app" | "email") => {
    const next = rows.map((r, idx) => {
      if (idx !== i) return r;
      if (key === "in_app" && r.critical && r.in_app) return r;
      return { ...r, [key]: !r[key] };
    });
    setRows(next);
    try {
      await saveEmployerNotificationPreferences(next);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : "Could not save.",
      );
      load();
    }
  };

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-[#0F1B3D]">Notifications</h1>
        <p className="mt-1 text-sm text-slate-500">
          Choose what reaches you in the app and by email.
        </p>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-5 text-sm text-slate-500">Loading…</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-3 py-3">Event</th>
                <th className="px-3 py-3">Severity</th>
                <th className="px-3 py-3">In-app</th>
                <th className="px-3 py-3">Email</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((n, i) => (
                <tr key={n.l} className="border-b border-slate-100">
                  <td className="px-3 py-3 font-medium text-[#0F1B3D]">
                    {n.l}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${sevPill(n.sev)}`}
                    >
                      {n.sev}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => flip(i, "in_app")}
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        n.in_app
                          ? "bg-violet-600 text-white"
                          : "border border-slate-200 text-slate-600"
                      }`}
                    >
                      {n.in_app ? "On" : "Off"}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => flip(i, "email")}
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        n.email
                          ? "bg-violet-600 text-white"
                          : "border border-slate-200 text-slate-600"
                      }`}
                    >
                      {n.email ? "On" : "Off"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
