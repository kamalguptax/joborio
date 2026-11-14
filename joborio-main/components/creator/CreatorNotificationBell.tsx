"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  fetchCreatorNotifications,
  markAllNotificationsRead,
  type UserNotificationRow,
} from "@/lib/api/creator";

export default function CreatorNotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<UserNotificationRow[]>([]);
  const [unread, setUnread] = useState(0);

  const load = () => {
    fetchCreatorNotifications()
      .then(({ data, meta }) => {
        setItems(data);
        setUnread(Number(meta.unread_count ?? 0));
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:border-purple-200"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-bold">Notifications</p>
              <button
                type="button"
                className="text-xs font-semibold text-purple-600"
                onClick={() => {
                  markAllNotificationsRead().then(load);
                }}
              >
                Mark all read
              </button>
            </div>
            <ul className="max-h-72 overflow-y-auto text-sm">
              {items.length === 0 ? (
                <li className="px-4 py-6 text-center text-slate-500">No notifications yet.</li>
              ) : (
                items.map((n) => (
                  <li
                    key={n.id}
                    className={`border-b border-slate-50 px-4 py-3 ${n.read_at ? "opacity-60" : ""}`}
                  >
                    <p className="font-semibold text-slate-800">{n.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{n.body}</p>
                  </li>
                ))
              )}
            </ul>
            <Link
              href="/creator/notifications"
              className="block border-t border-slate-100 px-4 py-2.5 text-center text-xs font-semibold text-purple-600"
              onClick={() => setOpen(false)}
            >
              View all
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
