"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import SearchInput from "@/components/SearchInput";
import MoneyInput from "@/components/MoneyInput";

export default function StaffTransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [pendingForMe, setPendingForMe] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [allStaff, setAllStaff] = useState<any[]>([]); // unfiltered — only fetched for admin/manager's "on behalf of" picker
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const [senderId, setSenderId] = useState(""); // empty = self
  const [receiverId, setReceiverId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const canActForOthers = me?.role === "admin" || me?.role === "manager";

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const [transfersRes, pendingRes, staffRes, currenciesRes, meRes] = await Promise.all([
        api.getStaffTransfers(),
        api.getStaffTransfers({ for_me: "1" }),
        api.getStaff({ scope: "transfer" }), // server already scopes this to same-country when appropriate
        api.getCurrencies(),
        api.me(),
      ]);
      setTransfers(transfersRes.transfers.data || transfersRes.transfers);
      setPendingForMe(pendingRes.transfers.data || pendingRes.transfers);
      setStaff(staffRes.staff);
      setCurrencies(currenciesRes.currencies);
      setMe(meRes.user);
      if (meRes.user.role === "admin" || meRes.user.role === "manager") {
        // On-behalf-of sender picker needs the full list, not the transfer-scoped one
        const fullStaffRes = await api.getStaff();
        setAllStaff(fullStaffRes.staff);
      }
    } catch (err: any) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Auto-refresh — balances and pending approvals can change from someone
    // else's action at any time, so a quiet periodic refresh keeps this
    // current without needing a manual reload.
    const interval = setInterval(() => load(true), 15000);
    return () => clearInterval(interval);
  }, []);

  // Currency is derived from whoever is actually sending — either me, or the
  // staff member I'm sending on behalf of.
  const effectiveSender = senderId ? allStaff.find((s) => String(s.id) === senderId) : me;
  const myCurrency = currencies.find((c) => c.country?.toLowerCase() === effectiveSender?.location?.toLowerCase());

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!myCurrency) {
      setError("No matching currency for that staff member's location — set their location under Staff first.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        receiver_id: Number(receiverId),
        amount: parseFloat(amount),
        currency_id: myCurrency.id,
        additional_notes: notes,
      };
      if (canActForOthers && senderId) payload.sender_id = Number(senderId);
      await api.createStaffTransfer(payload);
      setAmount("");
      setNotes("");
      setSenderId("");
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAccept(id: number) {
    try {
      await api.acceptStaffTransfer(id);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleReject(id: number) {
    if (!confirm("Reject this transfer?")) return;
    try {
      await api.rejectStaffTransfer(id);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleReverse(id: number) {
    if (!confirm("Reverse this transfer?")) return;
    try {
      await api.reverseStaffTransfer(id);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function badgeClass(status: string) {
    if (status === "completed") return "completed";
    if (status === "pending") return "pending";
    return "inactive"; // rejected / reversed
  }

  return (
    <AppShell title="Staff Transfers" subtitle="Move money between staff wallets">
      <a href="/more" className="back-link md:hidden">&larr; More</a>

      {pendingForMe.length > 0 && (
        <div className="card mb-6 border-amber-200 bg-amber-50">
          <h2 className="text-sm font-semibold text-amber-800 mb-3">Awaiting your approval</h2>
          <div className="flex flex-col gap-2">
            {pendingForMe.map((t) => (
              <div key={t.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-amber-100">
                <div className="text-sm">
                  <strong>{t.sender_name}</strong> wants to send you {t.currency_symbol}{Number(t.amount).toLocaleString()}
                  {t.additional_notes && <div className="text-xs text-slate-400">{t.additional_notes}</div>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleAccept(t.id)} className="btn">Accept</button>
                  <button onClick={() => handleReject(t.id)} className="btn-ghost">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {me?.role !== "personnel" && (
      <>
      <form onSubmit={handleSend} className="card flex gap-3 flex-wrap items-end mb-6">
        {canActForOthers && (
          <div>
            <label className="label">Send as</label>
            <select value={senderId} onChange={(e) => setSenderId(e.target.value)} className="input">
              <option value="">Myself</option>
              {allStaff.filter((s) => s.id !== me?.id).map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.username})</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="label">Send to</label>
          <select value={receiverId} onChange={(e) => setReceiverId(e.target.value)} required className="input">
            <option value="">Select staff...</option>
            {(canActForOthers ? allStaff : staff).filter((s) => s.id !== Number(senderId || me?.id)).map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.username})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Currency</label>
          <div className="input flex items-center bg-slate-50 text-slate-600">
            {myCurrency ? `${myCurrency.currency_code} (${effectiveSender?.location || "unknown"})` : "Unknown — set location first"}
          </div>
        </div>
        {effectiveSender && (
          <div>
            <label className="label">Current balance</label>
            <div className="input flex items-center bg-slate-50 text-teal-700 font-semibold">
              {myCurrency?.symbol || ""} {Number(effectiveSender.wallet || 0).toLocaleString()}
            </div>
          </div>
        )}
        <div>
          <label className="label">Amount</label>
          <MoneyInput value={amount} onChange={setAmount} className="input w-36" required />
        </div>
        <div>
          <label className="label">Notes</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input" />
        </div>
        <button type="submit" disabled={submitting} className="btn">
          {submitting ? "Sending..." : "Send"}
        </button>
      </form>
      <p className="text-xs text-slate-400 -mt-4 mb-6">
        {canActForOthers && senderId
          ? "Transfers between two other staff members complete instantly."
          : me?.role === "personnel2" || me?.role === "cashier" || me?.role === "manager"
          ? "You can only send to staff within your own country. Transfers wait for the receiver to accept before any wallet balance moves."
          : "Non-admin transfers wait for the receiver to accept before any wallet balance moves."}
      </p>
      </>
      )}

      <SearchInput value={search} onChange={setSearch} placeholder="Search by sender or receiver..." />

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transfers.filter((t) => !search || t.sender_name?.toLowerCase().includes(search.toLowerCase()) || t.receiver_name?.toLowerCase().includes(search.toLowerCase())).map((t) => (
                <tr key={t.id}>
                  <td>{t.sender_name}</td>
                  <td>{t.receiver_name}</td>
                  <td className="font-medium">{t.currency_symbol}{Number(t.amount).toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-${badgeClass(t.status)}`}>{t.status}</span>
                  </td>
                  <td>{new Date(t.created_at).toLocaleDateString()}</td>
                  <td>
                    {t.status === "completed" && me?.role === "admin" && (
                      <button onClick={() => handleReverse(t.id)} className="btn-danger">Reverse</button>
                    )}
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && (
                <tr><td colSpan={6} className="text-center text-slate-400 py-8">No transfers yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
