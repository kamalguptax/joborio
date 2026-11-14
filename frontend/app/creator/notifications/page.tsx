"use client";

import { useEffect, useState } from "react";
import {
  fetchCreatorNotifications,
  markAllNotificationsRead,
  type UserNotificationRow,
} from "@/lib/api/creator";

export default function CreatorNotificationsPage() {
  const [rows, setRows] = useState<UserNotificationRow[]>([]);

  const load = () => {
    fetchCreatorNotifications().then(({ data }) => setRows(data));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="mt-2 text-slate-500">Payouts, tier upgrades, and account alerts.</p>
        </div>
        <button
          type="button"
          onClick={() => markAllNotificationsRead().then(load)}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold"
        >
          Mark all read
        </button>
      </div>
      <ul className="space-y-3">
        {rows.map((n) => (
          <li
            key={n.id}
            className={`rounded-2xl border border-slate-200 bg-white p-4 ${n.read_at ? "opacity-70" : ""}`}
          >
            <p className="font-bold">{n.title}</p>
            <p className="mt-1 text-sm text-slate-600">{n.body}</p>
            <p className="mt-2 text-xs text-slate-400">
              {new Date(n.created_at).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">No notifications yet.</p>
      ) : null}
    </>
  );
}
