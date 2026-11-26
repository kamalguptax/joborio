"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchEmployerTeam,
  inviteEmployerTeamMember,
  removeEmployerTeamMember,
  updateEmployerTeamMember,
} from "@/lib/api/employer";
import { ApiClientError } from "@/lib/api/client";
import { toast } from "@/components/ui/Toast";

type Member = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  can_remove: boolean;
};

export default function EmployerTeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [matrix, setMatrix] = useState<string[][]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Campaign Manager");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchEmployerTeam()
      .then((d) => {
        setMembers(d.members ?? []);
        setRoles(d.roles ?? []);
        setMatrix(d.permission_matrix ?? []);
        const inviteRoles = (d.roles ?? []).filter((r) => r !== "Owner");
        if (inviteRoles.length && !inviteRoles.includes(role)) {
          setRole(inviteRoles[0]!);
        }
      })
      .catch(() => toast.error("Could not load team."))
      .finally(() => setLoading(false));
  }, [role]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const invite = async () => {
    if (!email.trim()) {
      toast.error("Enter an email to invite.");
      return;
    }
    try {
      await inviteEmployerTeamMember({ email: email.trim(), role });
      setEmail("");
      toast.success("Invite saved.");
      load();
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : "Invite failed.",
      );
    }
  };

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-[#0F1B3D]">
          Team and permissions
        </h1>
        <p className="mt-1 text-sm text-slate-500">Role changes are audited.</p>
      </div>

      <section className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Loading team…</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-3 py-3">Member</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-slate-100">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-[#0F1B3D]">{m.name}</p>
                    <p className="text-xs text-slate-500">{m.email}</p>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={m.role}
                      disabled={!m.can_remove}
                      onChange={async (e) => {
                        try {
                          await updateEmployerTeamMember(m.id, e.target.value);
                          toast.success("Role updated.");
                          load();
                        } catch (err) {
                          toast.error(
                            err instanceof ApiClientError
                              ? err.message
                              : "Update failed.",
                          );
                        }
                      }}
                      className="max-w-[200px] rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold disabled:bg-slate-50"
                    >
                      {(roles.length ? roles : [m.role]).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        m.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {m.can_remove ? (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await removeEmployerTeamMember(m.id);
                            toast.info("Access removed.");
                            load();
                          } catch (err) {
                            toast.error(
                              err instanceof ApiClientError
                                ? err.message
                                : "Remove failed.",
                            );
                          }
                        }}
                        className="rounded-full border border-rose-200 px-3 py-1 text-xs font-bold text-rose-600"
                      >
                        Remove access
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="mt-4 flex max-w-xl flex-wrap gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Invite by email"
            className="min-w-[220px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
          >
            {(roles.filter((r) => r !== "Owner").length
              ? roles.filter((r) => r !== "Owner")
              : ["Campaign Manager", "Analyst", "Finance", "Reviewer"]
            ).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={invite}
            className="rounded-full bg-violet-600 px-4 py-2 text-sm font-bold text-white"
          >
            Send invite
          </button>
        </div>
      </section>

      <section className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-[#0F1B3D]">
          Permission matrix (default)
        </h2>
        <table className="mt-3 min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-2 py-2">Role</th>
              <th className="px-2 py-2">Campaigns</th>
              <th className="px-2 py-2">Analytics</th>
              <th className="px-2 py-2">Complaints</th>
              <th className="px-2 py-2">Billing</th>
              <th className="px-2 py-2">Team</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row[0]} className="border-b border-slate-100">
                {row.map((cell, i) => (
                  <td
                    key={`${row[0]}-${i}`}
                    className={`px-2 py-2 ${i === 0 ? "font-semibold text-[#0F1B3D]" : "text-slate-600"}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
