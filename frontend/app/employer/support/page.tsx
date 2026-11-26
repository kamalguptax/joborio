"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createEmployerSupportTicket,
  fetchEmployerSupportTickets,
} from "@/lib/api/employer";
import { ApiClientError } from "@/lib/api/client";
import { toast } from "@/components/ui/Toast";

type Ticket = {
  id: string;
  numeric_id: number;
  subj: string;
  cat: string;
  pri: string;
  status: string;
  description: string;
  timeline: { text: string; at: string }[];
};

function pill(status: string) {
  if (status === "In Progress") return "bg-amber-50 text-amber-800";
  if (status === "Waiting for Brand") return "bg-violet-50 text-violet-700";
  if (status === "Resolved" || status === "Closed")
    return "bg-emerald-50 text-emerald-700";
  return "bg-slate-100 text-slate-600";
}

export default function EmployerSupportPage() {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Campaign issue");
  const [priority, setPriority] = useState("Normal");
  const [desc, setDesc] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sel, setSel] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchEmployerSupportTickets()
      .then((d) => {
        const list = d.tickets ?? [];
        setTickets(list);
        setSel((prev) => {
          if (!prev) return list[0] ?? null;
          return list.find((t) => t.numeric_id === prev.numeric_id) ?? list[0] ?? null;
        });
      })
      .catch(() => toast.error("Could not load tickets."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!subject.trim() || !desc.trim()) {
      toast.error("Subject and description are required.");
      return;
    }
    try {
      const res = await createEmployerSupportTicket({
        subject: subject.trim(),
        category,
        priority,
        description: desc.trim(),
      });
      toast.success(`Ticket ${res.ticket.id} submitted.`);
      setSubject("");
      setDesc("");
      setSel(res.ticket);
      load();
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : "Could not submit ticket.",
      );
    }
  };

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-[#0F1B3D]">
          Support and disputes
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Every ticket has an activity timeline.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#0F1B3D]">New ticket</h2>
          <div className="mt-3 grid gap-3">
            <label className="block text-xs font-semibold uppercase text-slate-400">
              Subject
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </label>
            <label className="block text-xs font-semibold uppercase text-slate-400">
              Category
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {[
                  "Campaign issue",
                  "Tracking issue",
                  "Billing dispute",
                  "Content complaint",
                  "Other",
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold uppercase text-slate-400">
              Priority
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {["Low", "Normal", "High"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold uppercase text-slate-400">
              Description
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                rows={4}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={submit}
            className="mt-4 rounded-full bg-violet-600 px-4 py-2 text-sm font-bold text-white"
          >
            Submit ticket
          </button>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#0F1B3D]">Your tickets</h2>
          {loading ? (
            <p className="mt-3 text-sm text-slate-500">Loading…</p>
          ) : tickets.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No tickets yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {tickets.map((t) => (
                <li key={t.numeric_id}>
                  <button
                    type="button"
                    onClick={() => setSel(t)}
                    className={`w-full py-3 text-left ${
                      sel?.numeric_id === t.numeric_id ? "bg-slate-50" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[#0F1B3D]">{t.subj}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${pill(t.status)}`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {t.id} · {t.cat} · {t.pri}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {sel ? (
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#0F1B3D]">
            Activity timeline · {sel.id}
          </h2>
          <ul className="mt-3 space-y-2">
            {(sel.timeline ?? []).map((e, i) => (
              <li
                key={`${sel.id}-${i}`}
                className="rounded-xl bg-slate-50 px-3 py-2 text-sm"
              >
                {e.text}
                <span className="mt-0.5 block text-[11px] text-slate-400">
                  {e.at}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
