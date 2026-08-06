"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Send, X, Check } from "lucide-react";

export default function TransferPopup() {
  const [pending, setPending] = useState<any[]>([]);
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);
  const [actingId, setActingId] = useState<number | null>(null);

  async function load() {
    try {
      const res = await api.getStaffTransfers({ for_me: "1" });
      setPending(res.transfers.data || res.transfers);
    } catch {
      // silent — this is a background poll, not a user-triggered action
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  async function handleAccept(id: number) {
    setActingId(id);
    try {
      await api.acceptStaffTransfer(id);
      load();
    } finally {
      setActingId(null);
    }
  }

  async function handleReject(id: number) {
    setActingId(id);
    try {
      await api.rejectStaffTransfer(id);
      load();
    } finally {
      setActingId(null);
    }
  }

  // Only the popup dismisses — the transfer itself still sits on the Staff
  // Transfers page's "awaiting your approval" section, so nothing is lost if
  // someone closes this without deciding.
  const visible = pending.filter((t) => !dismissedIds.includes(t.id));
  if (visible.length === 0) return null;

  const current = visible[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
            <Send size={18} className="text-sky-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 text-sm">Incoming transfer</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {visible.length > 1 ? `${visible.length} transfers awaiting your response` : "Awaiting your response"}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 mb-4">
          <p className="text-sm">
            <strong>{current.sender_name}</strong> wants to send you{" "}
            <strong>{current.currency_symbol}{Number(current.amount).toLocaleString()}</strong>
          </p>
          {current.additional_notes && (
            <p className="text-xs text-slate-400 mt-1">{current.additional_notes}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleAccept(current.id)}
            disabled={actingId === current.id}
            className="btn flex-1 flex items-center justify-center gap-1.5"
          >
            <Check size={15} /> {actingId === current.id ? "..." : "Accept"}
          </button>
          <button
            onClick={() => handleReject(current.id)}
            disabled={actingId === current.id}
            className="btn-outline flex-1"
          >
            Reject
          </button>
          <button
            onClick={() => setDismissedIds((prev) => [...prev, current.id])}
            className="w-10 flex-shrink-0 flex items-center justify-center text-slate-300 hover:text-slate-500"
            aria-label="Dismiss for now"
            title="Decide later — find it on Staff Transfers"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
