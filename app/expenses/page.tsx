"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import SearchInput from "@/components/SearchInput";
import MoneyInput from "@/components/MoneyInput";

type Tab = "expenses" | "funding";

export default function ExpensesPage() {
  const [tab, setTab] = useState<Tab>("expenses");

  // Business expenses
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const [description, setDescription] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [qty, setQty] = useState("");
  const [operation, setOperation] = useState<"multiply" | "divide">("multiply");
  const [vat, setVat] = useState("0");
  const [location, setLocation] = useState("");

  // Live preview of the amount, matching the server's own calculation
  const previewAmount = (() => {
    const u = parseFloat(unitPrice) || 0;
    const q = parseFloat(qty) || 0;
    if (!u || !q) return null;
    if (operation === "divide") return q === 0 ? "Cannot divide by zero" : (u / q).toLocaleString(undefined, { maximumFractionDigits: 4 });
    return (u * q).toLocaleString(undefined, { maximumFractionDigits: 4 });
  })();

  // Staff wallet fund/expense
  const [myRole, setMyRole] = useState("");
  const [canAdjust, setCanAdjust] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [fundHistory, setFundHistory] = useState<any[]>([]);
  const [walletTargetId, setWalletTargetId] = useState("");
  const [walletAction, setWalletAction] = useState<"fund" | "expense">("fund");
  const [walletAmount, setWalletAmount] = useState("");
  const [walletRemark, setWalletRemark] = useState("");
  const [walletSubmitting, setWalletSubmitting] = useState(false);
  const [reversingId, setReversingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.getExpenses();
      setExpenses(res.expenses.data || res.expenses);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadWalletSection() {
    try {
      const me = await api.me();
      setMyRole(me.user.role);
      const adjust = me.user.role === "admin" || me.user.role === "manager";
      setCanAdjust(adjust);
      if (adjust) {
        const [staffRes, historyRes] = await Promise.all([api.getStaff(), api.getStaffFundHistory()]);
        setStaff(staffRes.staff);
        setFundHistory(historyRes.history.data || historyRes.history);
      }
    } catch {
      // silent — this section just won't show for roles without access
    }
  }

  useEffect(() => {
    load();
    loadWalletSection();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.createExpense({
        description,
        unit_price: parseFloat(unitPrice),
        qty: parseFloat(qty),
        operation,
        vat: parseFloat(vat) || 0,
        location,
      });
      setDescription("");
      setUnitPrice("");
      setQty("");
      setVat("0");
      setOperation("multiply");
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(id: number) {
    await api.approveExpense(id);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this expense?")) return;
    await api.deleteExpense(id);
    load();
  }

  async function handleWalletAdjust(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!walletTargetId || !walletAmount) return;
    setWalletSubmitting(true);
    try {
      const signedAmount = walletAction === "fund" ? parseFloat(walletAmount) : -parseFloat(walletAmount);
      await api.fundStaffWallet(Number(walletTargetId), { amount: signedAmount, remark: walletRemark || undefined });
      setWalletAmount("");
      setWalletRemark("");
      loadWalletSection();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setWalletSubmitting(false);
    }
  }

  async function handleReverseFund(id: number) {
    if (!confirm("Reverse this staff wallet entry? This cannot be undone.")) return;
    setReversingId(id);
    try {
      await api.reverseStaffFund(id);
      loadWalletSection();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setReversingId(null);
    }
  }

  const visibleExpenses = expenses.filter((e) => !search || e.description?.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell title="Expenses / Funding" subtitle="Business expenses and staff wallet funding — two separate things">
      <a href="/more" className="back-link md:hidden">&larr; More</a>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("expenses")} className={tab === "expenses" ? "btn" : "btn-ghost"}>
          Expenses
        </button>
        {canAdjust && (
          <button onClick={() => setTab("funding")} className={tab === "funding" ? "btn" : "btn-ghost"}>
            Staff Wallet Funding
          </button>
        )}
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {tab === "expenses" && (
        <>
          <form onSubmit={handleAdd} className="card flex gap-3 flex-wrap items-end mb-6">
            <div className="flex-1 min-w-[180px]">
              <label className="label">Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} required className="input w-full" />
            </div>
            <div>
              <label className="label">Operation</label>
              <select value={operation} onChange={(e) => setOperation(e.target.value as "multiply" | "divide")} className="input">
                <option value="multiply">Multiply (unit price × qty)</option>
                <option value="divide">Divide (unit price ÷ qty)</option>
              </select>
            </div>
            <div>
              <label className="label">Unit price</label>
              <MoneyInput value={unitPrice} onChange={setUnitPrice} className="input w-28" required />
            </div>
            <div>
              <label className="label">Qty</label>
              <MoneyInput value={qty} onChange={setQty} className="input w-20" required />
            </div>
            <div>
              <label className="label">VAT</label>
              <MoneyInput value={vat} onChange={setVat} className="input w-24" />
            </div>
            <div>
              <label className="label">Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} className="input w-32" />
            </div>
            <button type="submit" disabled={submitting} className="btn">
              {submitting ? "Adding..." : "Add"}
            </button>
            {previewAmount !== null && (
              <p className="text-xs text-slate-400 w-full">
                Amount will be: <strong className="text-slate-700">{previewAmount}</strong> {vat !== "0" && `+ ${vat} VAT`}
              </p>
            )}
          </form>

          <SearchInput value={search} onChange={setSearch} placeholder="Search by description..." />
          {loading ? (
            <p className="text-slate-400 text-sm">Loading...</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Operation</th>
                    <th>Unit price</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleExpenses.map((e) => (
                    <tr key={e.id}>
                      <td>{e.description}</td>
                      <td className="text-slate-400 text-xs capitalize">{e.operation || "multiply"}</td>
                      <td>{e.unit_price}</td>
                      <td>{e.qty}</td>
                      <td className="font-medium">{e.total}</td>
                      <td>
                        <span className={`badge badge-${e.status === "approved" ? "completed" : "pending"}`}>{e.status}</span>
                      </td>
                      <td className="flex gap-2">
                        {e.status !== "approved" && (
                          <button onClick={() => handleApprove(e.id)} className="btn-ghost">Approve</button>
                        )}
                        <button onClick={() => handleDelete(e.id)} className="btn-danger">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {visibleExpenses.length === 0 && (
                    <tr><td colSpan={7} className="text-center text-slate-400 py-8">No expenses recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "funding" && canAdjust && (
        <>
          <p className="text-xs text-slate-400 mb-3">
            Direct credit or debit to a staff member's own wallet — logged to their statement, no receipt.
            {myRole === "manager" && " Limited to staff in your own country."}
            {myRole === "admin" && " Only admin can reverse an entry."}
          </p>
          <form onSubmit={handleWalletAdjust} className="card flex gap-3 flex-wrap items-end mb-6">
            <div>
              <label className="label">Staff member</label>
              <select value={walletTargetId} onChange={(e) => setWalletTargetId(e.target.value)} required className="input">
                <option value="">Select staff...</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.username})</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setWalletAction("fund")}
                className={walletAction === "fund" ? "btn" : "btn-ghost"}
              >
                Fund (credit)
              </button>
              <button
                type="button"
                onClick={() => setWalletAction("expense")}
                className={walletAction === "expense" ? "btn" : "btn-ghost"}
              >
                Expense (debit)
              </button>
            </div>
            <div>
              <label className="label">Amount</label>
              <MoneyInput value={walletAmount} onChange={setWalletAmount} className="input w-32" required />
            </div>
            <div>
              <label className="label">Remark</label>
              <input value={walletRemark} onChange={(e) => setWalletRemark(e.target.value)} className="input" />
            </div>
            <button type="submit" disabled={walletSubmitting} className="btn-outline">
              {walletSubmitting ? "Saving..." : "Apply"}
            </button>
          </form>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Remark</th>
                  <th>By</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {fundHistory.map((h) => (
                  <tr key={h.id}>
                    <td>{h.staff_name}</td>
                    <td>
                      <span className={`badge ${Number(h.fund_wallet) > 0 ? "badge-completed" : "badge-inactive"}`}>
                        {Number(h.fund_wallet) > 0 ? "Fund" : "Expense"}
                      </span>
                    </td>
                    <td className={Number(h.fund_wallet) > 0 ? "text-emerald-600" : "text-red-600"}>
                      {Math.abs(Number(h.fund_wallet)).toLocaleString()}
                    </td>
                    <td className="text-slate-500">{h.remark || "—"}</td>
                    <td>{h.created_by_name}</td>
                    <td className="whitespace-nowrap text-xs text-slate-500">{new Date(h.created_at).toLocaleString()}</td>
                    <td>
                      {h.reversed_at ? (
                        <span className="badge badge-inactive">Reversed</span>
                      ) : (
                        <span className="badge badge-active">Active</span>
                      )}
                    </td>
                    <td>
                      {myRole === "admin" && !h.reversed_at && (
                        <button onClick={() => handleReverseFund(h.id)} disabled={reversingId === h.id} className="btn-danger">
                          {reversingId === h.id ? "..." : "Reverse"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {fundHistory.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-slate-400 py-8">No staff wallet entries yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppShell>
  );
}
