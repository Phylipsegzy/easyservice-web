"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications.data || res.notifications);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleClick(n: any) {
    if (!n.read_at) await api.markNotificationRead(n.id);
    if (n.data?.transaction_id) router.push(`/transactions/${n.data.transaction_id}`);
    else if (n.data?.transfer_id) router.push(`/staff-transfers`);
    else load();
  }

  async function handleMarkAllRead() {
    await api.markAllNotificationsRead();
    load();
  }

  return (
    <AppShell
      title="Notifications"
      subtitle="Everything that's happened across your account"
      actions={<button onClick={handleMarkAllRead} className="btn-ghost">Mark all read</button>}
    >
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`card text-left flex items-start justify-between gap-3 ${!n.read_at ? "border-teal-200 bg-teal-50/40" : ""}`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900">{n.title}</span>
                  {n.user?.name && <span className="text-xs text-slate-400">— {n.user.name}</span>}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(n.created_at).toLocaleString()}</span>
            </button>
          ))}
          {notifications.length === 0 && (
            <p className="text-center text-slate-400 py-12 text-sm">No notifications yet.</p>
          )}
        </div>
      )}
    </AppShell>
  );
}
