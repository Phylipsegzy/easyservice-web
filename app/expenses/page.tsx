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
  const [expenseStaffId, setExpenseStaffId] = useState("");
  const [expenseStaffSearch, setExpenseStaffSearch] = useState("");

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
  const [walletStaffSearch, setWalletStaffSearch] = useState("");
  const [currencies, setCurrencies] = useState<any[]>([]);
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
        const [staffRes, historyRes] = await Promise.all([api.getStaff({ scope: "fund" }), api.getStaffFundHistory()]);
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
    api.getCurrencies().then((res) => setCurrencies(res.currencies)).catch(() => {});
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!expenseStaffId) {
      setError("Select which staff member this expense is for.");
      return;
    }
    setSubmitting(true);
    try {
      await api.createExpense({
        description,
        unit_price: parseFloat(unitPrice),
        qty: parseFloat(qty),
        operation,
        vat: parseFloat(vat) || 0,
        location,
        staff_id: Number(expenseStaffId),
      });
      setDescription("");
      setUnitPrice("");
      setQty("");
      setVat("0");
      setOperation("multiply");
      setExpenseStaffId("");
      setExpenseStaffSearch("");
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

  async function handleFund(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!walletTargetId || !walletAmount) return;
    setWalletSubmitting(true);
    try {
      const signedAmount = parseFloat(walletAmount);
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
    <AppShell title="Expenses / Funding" subtitle="Staff expenses and staff wallet funding — two separate things">
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
            <div className="relative min-w-[220px]">
              <label className="label">Staff (required)</label>
              <input
                value={expenseStaffSearch}
                onChange={(e) => {
                  setExpenseStaffSearch(e.target.value);
                  setExpenseStaffId("");
                }}
                placeholder="Search staff by name or username..."
                className="input w-full"
              />
              {expenseStaffId && (
                <p className="text-xs text-teal-700 font-medium mt-1">
                  ✓ {staff.find((s) => String(s.id) === expenseStaffId)?.name}
                  <button type="button" onClick={() => { setExpenseStaffId(""); setExpenseStaffSearch(""); }} className="text-slate-400 ml-2 underline">
                    clear
                  </button>
                </p>
              )}
              {expenseStaffSearch && !expenseStaffId && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                  {staff
                    .filter((s) =>
                      s.name.toLowerCase().includes(expenseStaffSearch.toLowerCase()) ||
                      s.username.toLowerCase().includes(expenseStaffSearch.toLowerCase())
                    )
                    .slice(0, 8)
                    .map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setExpenseStaffId(String(s.id));
                          setExpenseStaffSearch(`${s.name} (${s.username})`);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b border-slate-50 last:border-0"
                      >
                        <span className="font-medium">{s.name}</span>{" "}
                        <span className="text-slate-400">({s.username})</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
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
            <button type="submit" disabled={submitting || !expenseStaffId} className="btn">
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
                    <th>Staff</th>
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
                      <td className="text-slate-500">{e.staff_name || e.staff?.name || "—"}</td>
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
                    <tr><td colSpan={8} className="text-center text-slate-400 py-8">No expenses recorded yet.</td></tr>
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
            Direct credit to a staff member's own wallet — logged to their statement, no receipt.
            {myRole === "manager" && " Limited to staff in your own country, or yourself."}
            {myRole === "admin" && " Only admin can reverse an entry."}
          </p>

          <div className="card mb-6">
            <label className="label">Search staff by name or username</label>
            <div className="relative">
              <input
                value={walletStaffSearch}
                onChange={(e) => {
                  setWalletStaffSearch(e.target.value);
                  setWalletTargetId("");
                }}
                placeholder="Start typing a name or username..."
                className="input w-full max-w-sm"
              />
              {walletStaffSearch && !walletTargetId && (
                <div className="absolute z-10 mt-1 w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                  {staff
                    .filter((s) =>
                      s.name.toLowerCase().includes(walletStaffSearch.toLowerCase()) ||
                      s.username.toLowerCase().includes(walletStaffSearch.toLowerCase())
                    )
                    .slice(0, 8)
                    .map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setWalletTargetId(String(s.id));
                          setWalletStaffSearch(`${s.name} (${s.username})`);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b border-slate-50 last:border-0"
                      >
                        <span className="font-medium">{s.name}</span>{" "}
                        <span className="text-slate-400">({s.username})</span>
                        {s.location && <span className="text-slate-400"> · {s.location}</span>}
                      </button>
                    ))}
                  {staff.filter((s) =>
                    s.name.toLowerCase().includes(walletStaffSearch.toLowerCase()) ||
                    s.username.toLowerCase().includes(walletStaffSearch.toLowerCase())
                  ).length === 0 && (
                    <p className="px-3 py-2 text-sm text-slate-400">No match found.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {walletTargetId && (() => {
            const selectedStaff = staff.find((s) => String(s.id) === walletTargetId);
            const staffCurrency = currencies.find((c) => c.country?.toLowerCase() === selectedStaff?.location?.toLowerCase());
            return (
              <>
                <div className="card mb-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{selectedStaff?.name}</p>
                    <p className="text-xs text-slate-400">{selectedStaff?.username} · {selectedStaff?.location || "—"} · {selectedStaff?.role?.label || selectedStaff?.role?.name || "—"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">Current balance</p>
                      <p className="font-bold text-teal-700">
                        {staffCurrency?.symbol || ""} {Number(selectedStaff?.wallet || 0).toLocaleString()} {staffCurrency?.currency_code || ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setWalletTargetId(""); setWalletStaffSearch(""); }}
                      className="btn-ghost"
                    >
                      Change staff
                    </button>
                  </div>
                </div>

                <div className="max-w-sm mb-6">
                  <h3 className="text-sm font-semibold mb-2">Fund wallet</h3>
                  <form onSubmit={handleFund} className="card flex flex-col gap-3">
                    <MoneyInput value={walletAmount} onChange={setWalletAmount} placeholder="Amount" className="input" required />
                    <input value={walletRemark} onChange={(e) => setWalletRemark(e.target.value)} placeholder="Remark (optional)" className="input" />
                    <button type="submit" disabled={walletSubmitting} className="btn self-start">
                      {walletSubmitting ? "Saving..." : "Fund wallet"}
                    </button>
                  </form>
                </div>
              </>
            );
          })()}

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
