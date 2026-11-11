"use client";

import { useEffect, useState } from "react";
import { adminDisputes, adminResolveDispute } from "@/lib/api/admin";

export default function AdminDisputesPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);

  const load = () => {
    adminDisputes()
      .then(({ data }) => setItems(data))
      .catch(() => setItems([]));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <h1 className="text-2xl font-bold">Attribution disputes</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Review employer claims about click or conversion attribution.
      </p>
      <ul className="mt-8 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-zinc-400">No disputes.</p>
        ) : (
          items.map((row) => {
            const creator = row.creator as Record<string, unknown> | undefined;
            const opener = row.opener as Record<string, unknown> | undefined;
            const status = String(row.status ?? "open");
            return (
              <li
                key={String(row.id)}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold">Dispute #{String(row.id)}</p>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs uppercase">
                    {status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-300">{String(row.reason ?? "")}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Creator: @{String(creator?.handle ?? "—")} · Opened by{" "}
                  {String(opener?.email ?? opener?.name ?? "—")}
                </p>
                {status === "open" ? (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold"
                      onClick={() =>
                        adminResolveDispute(Number(row.id), { status: "upheld" }).then(load)
                      }
                    >
                      Uphold
                    </button>
                    <button
                      type="button"
                      className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold"
                      onClick={() =>
                        adminResolveDispute(Number(row.id), { status: "rejected" }).then(load)
                      }
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })
        )}
      </ul>
    </>
  );
}
