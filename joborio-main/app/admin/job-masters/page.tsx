"use client";

import { useEffect, useState } from "react";
import {
  MASTER_TYPES,
  adminCreateJobMaster,
  adminDeactivateJobMaster,
  adminListJobMasters,
  type JobMasterAdminRow,
} from "@/lib/api/admin";

export default function AdminJobMastersPage() {
  const [type, setType] = useState<string>("category");
  const [rows, setRows] = useState<JobMasterAdminRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [code, setCode] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  const load = () => {
    adminListJobMasters(type)
      .then(({ data }) => setRows(data))
      .catch(() => setMsg("Failed to load masters — run migrations & seed?"));
  };

  useEffect(() => {
    load();
  }, [type]);

  const add = async () => {
    setMsg(null);
    if (!name.trim()) {
      setMsg("Name is required");
      return;
    }
    try {
      await adminCreateJobMaster({
        type,
        name: name.trim(),
        parent_id: parentId ? Number(parentId) : null,
        code: code.trim() || null,
        sort_order: Number(sortOrder) || 0,
        is_active: true,
      });
      setName("");
      setParentId("");
      setCode("");
      load();
      setMsg("Added");
    } catch {
      setMsg("Create failed");
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Job filter masters</h1>
      <p className="mt-1 text-sm text-slate-400">
        Manage countries, states, cities, categories, and other filters stored in the database.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {MASTER_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${
              type === t ? "bg-purple-600" : "border border-white/20"
            }`}
          >
            {t.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name *"
          className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm"
        />
        <input
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          placeholder="Parent ID (state→country, city→state)"
          className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm"
        />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code (e.g. IN)"
          className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm"
        />
        <input
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          placeholder="Sort order"
          className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold"
        >
          Add {type.replace("_", " ")}
        </button>
      </div>

      {msg ? <p className="mt-3 text-sm text-amber-300">{msg}</p> : null}

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr>
              <th className="pb-2 pr-3">ID</th>
              <th className="pb-2 pr-3">Name</th>
              <th className="pb-2 pr-3">Slug</th>
              <th className="pb-2 pr-3">Parent</th>
              <th className="pb-2 pr-3">Sort</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="py-2 pr-3">{r.id}</td>
                <td className="py-2 pr-3 font-medium">{r.name}</td>
                <td className="py-2 pr-3 text-slate-400">{r.slug}</td>
                <td className="py-2 pr-3 text-slate-400">
                  {r.parent ? `${r.parent.name} (#${r.parent.id})` : "—"}
                </td>
                <td className="py-2 pr-3">{r.sort_order}</td>
                <td className="py-2">
                  <button
                    type="button"
                    className="text-xs text-rose-300 hover:text-rose-200"
                    onClick={async () => {
                      await adminDeactivateJobMaster(r.id);
                      load();
                    }}
                  >
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
