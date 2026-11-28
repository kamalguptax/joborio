"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchEmployerSettings,
  saveEmployerSettings,
} from "@/lib/api/employer";
import { ApiClientError } from "@/lib/api/client";
import { toast } from "@/components/ui/Toast";
import PageHeader from "@/components/layout/PageHeader";

export default function EmployerSettingsPage() {
  const [twofa, setTwofa] = useState(true);
  const [timeoutOn, setTimeoutOn] = useState(true);
  const [exportOn, setExportOn] = useState(false);
  const [logins, setLogins] = useState<Array<{ text: string }>>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchEmployerSettings()
      .then((d) => {
        const s = d.settings;
        setTwofa(Boolean(s.twofa));
        setTimeoutOn(Boolean(s.session_timeout));
        setExportOn(Boolean(s.allow_data_export));
        setLogins(s.recent_logins ?? []);
      })
      .catch(() => toast.error("Could not load settings."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (patch: {
    twofa?: boolean;
    session_timeout?: boolean;
    allow_data_export?: boolean;
  }) => {
    try {
      await saveEmployerSettings(patch);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : "Could not save.",
      );
      load();
    }
  };

  const chips = [
    {
      l: "2FA (TOTP)",
      on: twofa,
      flip: () => {
        const next = !twofa;
        setTwofa(next);
        void save({ twofa: next });
      },
    },
    {
      l: "Session timeout",
      on: timeoutOn,
      flip: () => {
        const next = !timeoutOn;
        setTimeoutOn(next);
        void save({ session_timeout: next });
      },
    },
    {
      l: "Allow data export",
      on: exportOn,
      flip: () => {
        const next = !exportOn;
        setExportOn(next);
        void save({ allow_data_export: next });
        toast.info("Data export preference updated.");
      },
    },
  ];

  return (
    <>
      <PageHeader title="Settings" />
      <div>
        <p className="mt-1 text-sm text-slate-500">
          Security and data preferences.
        </p>
      </div>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {chips.map((t) => (
                <button
                  key={t.l}
                  type="button"
                  onClick={t.flip}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    t.on
                      ? "bg-violet-600 text-white"
                      : "border border-slate-200 text-slate-600"
                  }`}
                >
                  {t.l}: {t.on ? "On" : "Off"}
                </button>
              ))}
            </div>

            <h3 className="mt-6 text-sm font-bold text-[#0A2150]">
              Recent logins
            </h3>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              {logins.length === 0 ? (
                <li className="rounded-xl bg-slate-50 px-3 py-2">No logins recorded.</li>
              ) : (
                logins.map((l, i) => (
                  <li key={i} className="rounded-xl bg-slate-50 px-3 py-2">
                    {l.text}
                  </li>
                ))
              )}
            </ul>
          </>
        )}
      </section>
    </>
  );
}
