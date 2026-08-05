"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Bell, Check } from "lucide-react";

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: { transaction_id?: number; transfer_id?: number };
  read_at: string | null;
  created_at: string;
  user?: { name: string };
};

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await api.getNotifications();
      setUnreadCount(res.unread_count);
      setNotifications(res.notifications.data || res.notifications);
    } catch {
      // silent — notification polling shouldn't surface errors to the whole app
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleOpen() {
    setOpen((o) => !o);
    if (!open) {
      setLoading(true);
      await load();
      setLoading(false);
    }
  }

  async function handleClickNotification(n: NotificationItem) {
    if (!n.read_at) {
      await api.markNotificationRead(n.id);
      load();
    }
    setOpen(false);
    if (n.data?.transaction_id) router.push(`/transactions/${n.data.transaction_id}`);
    else if (n.data?.transfer_id) router.push(`/staff-transfers`);
  }

  async function handleMarkAllRead() {
    await api.markAllNotificationsRead();
    load();
  }

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={handleOpen} className="relative text-slate-500 hover:text-teal-600 p-1.5" aria-label="Notifications">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="font-semibold text-sm text-slate-900">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-teal-600 font-semibold flex items-center gap-1">
                <Check size={13} /> Mark all read
              </button>
            )}
          </div>

          {loading && <div className="px-4 py-6 text-sm text-slate-400 text-center">Loading...</div>}

          {!loading && notifications.length === 0 && (
            <div className="px-4 py-6 text-sm text-slate-400 text-center">No notifications yet.</div>
          )}

          {!loading &&
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClickNotification(n)}
                className={`w-full text-left px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 ${
                  !n.read_at ? "bg-teal-50/50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-sm text-slate-900">{n.title}</span>
                  {!n.read_at && <span className="w-2 h-2 rounded-full bg-teal-600 mt-1.5 flex-shrink-0" />}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                <p className="text-[11px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </button>
            ))}

          <a href="/notifications" className="block text-center text-xs font-semibold text-teal-600 py-2.5 border-t border-slate-100 no-underline">
            View all
          </a>
        </div>
      )}
    </div>
  );
}
