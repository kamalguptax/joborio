"use client";

import { useEffect, useState } from "react";
import { adminFraudQueue, adminResolveFraud } from "@/lib/api/admin";

export default function AdminFraudPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);

  const load = () => {
    adminFraudQueue()
      .then(({ data }) => setItems(data))
      .catch(() => setItems([]));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <h1 className="text-2xl font-bold">Fraud queue</h1>
      <ul className="mt-8 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">No open reviews.</p>
        ) : (
          items.map((row) => (
            <li
              key={String(row.id)}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <p className="font-semibold">Review #{String(row.id)}</p>
              <p className="text-sm text-slate-400">{String(row.reason)}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold"
                  onClick={() =>
                    adminResolveFraud(Number(row.id), { status: "dismissed" }).then(load)
                  }
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold"
                  onClick={() =>
                    adminResolveFraud(Number(row.id), { status: "resolved" }).then(load)
                  }
                >
                  Resolve
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </>
  );
}
