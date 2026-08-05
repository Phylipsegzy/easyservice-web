"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Download } from "lucide-react";

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = Number(params.id);

  const [customer, setCustomer] = useState<any>(null);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myRole, setMyRole] = useState("");

  const [fundCurrencyId, setFundCurrencyId] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [fundRemark, setFundRemark] = useState("");
  const [fundSubmitting, setFundSubmitting] = useState(false);

  const [expCurrencyId, setExpCurrencyId] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expRemark, setExpRemark] = useState("");
  const [expSubmitting, setExpSubmitting] = useState(false);

  const [newWalletCurrencyId, setNewWalletCurrencyId] = useState("");
  const [addingWallet, setAddingWallet] = useState(false);

  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [reversingId, setReversingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [customerRes, currenciesRes, statementRes] = await Promise.all([
        api.getCustomer(customerId),
        api.getCurrencies(),
        api.getCustomerStatement(customerId),
      ]);
      setCustomer(customerRes.customer);
      setCurrencies(currenciesRes.currencies);
      setTransactions(statementRes.transactions);
      setPayments(statementRes.payments || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    api.me().then((res) => setMyRole(res.user.role)).catch(() => {});
  }, [customerId]);

  // If the customer has exactly one wallet, use it automatically for
  // fund/expense — no need to make staff pick a currency every time.
  useEffect(() => {
    const wallets = customer?.wallets || [];
    if (wallets.length === 1) {
      setFundCurrencyId(String(wallets[0].currency_id));
      setExpCurrencyId(String(wallets[0].currency_id));
    }
  }, [customer]);

  async function handleAddWallet(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setAddingWallet(true);
    try {
      await api.addCustomerWallet(customerId, Number(newWalletCurrencyId));
      setNewWalletCurrencyId("");
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingWallet(false);
    }
  }

  async function handleFund(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFundSubmitting(true);
    try {
      await api.fundCustomerWallet(customerId, {
        currency_id: Number(fundCurrencyId),
        amount: parseFloat(fundAmount),
        remark: fundRemark || undefined,
      });
      setFundAmount("");
      setFundRemark("");
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFundSubmitting(false);
    }
  }

  async function handleExpense(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setExpSubmitting(true);
    try {
      await api.expenseCustomerWallet(customerId, {
        currency_id: Number(expCurrencyId),
        amount: parseFloat(expAmount),
        remark: expRemark || undefined,
      });
      setExpAmount("");
      setExpRemark("");
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExpSubmitting(false);
    }
  }

  function handleDownloadReceipt(paymentId: number) {
    window.open(`/payments/${paymentId}/receipt`, "_blank");
  }

  async function handleReverse(payment: any) {
    if (!confirm("Reverse this transaction? This cannot be undone.")) return;
    setReversingId(payment.id);
    try {
      if (payment.description === "Customer wallet funding") {
        await api.reverseFunding(payment.id);
      } else {
        await api.reverseExpense(payment.id);
      }
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setReversingId(null);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <a href="/customers" className="back-link">&larr; Customers</a>
        <p className="text-slate-400 text-sm">Loading...</p>
      </AppShell>
    );
  }
  if (!customer) {
    return (
      <AppShell>
        <a href="/customers" className="back-link">&larr; Customers</a>
        <p className="text-slate-400 text-sm">Customer not found.</p>
      </AppShell>
    );
  }

  return (
    <AppShell title={customer.customer_name} subtitle={customer.phone}>
      <a href="/customers" className="back-link">&larr; Customers</a>

      <div className="card mb-6 grid grid-cols-3 gap-4 text-sm">
        <div><div className="stat-label">Phone</div><div className="font-medium mt-1">{customer.phone}</div></div>
        <div><div className="stat-label">Location</div><div className="font-medium mt-1">{customer.location || "—"}</div></div>
        <div><div className="stat-label">Status</div><span className={`badge badge-${customer.status} mt-1`}>{customer.status}</span></div>
      </div>

      <h2 className="text-base font-semibold mb-2">Wallets</h2>
      <div className="table-wrap mb-6">
        <table>
          <thead>
            <tr><th>Currency</th><th>Balance</th></tr>
          </thead>
          <tbody>
            {(customer.wallets || []).map((w: any) => (
              <tr key={w.id}>
                <td>{w.currency?.country} ({w.currency?.currency_code})</td>
                <td className="font-medium">{w.currency?.symbol}{w.balance}</td>
              </tr>
            ))}
            {(!customer.wallets || customer.wallets.length === 0) && (
              <tr><td colSpan={2} className="text-center text-slate-400 py-6">No wallets yet — fund one below.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div>
          <h3 className="text-sm font-semibold mb-2">Fund wallet</h3>
          <form onSubmit={handleFund} className="card flex flex-col gap-3">
            {(customer.wallets || []).length === 1 ? (
              <div className="input bg-slate-50 text-slate-500 text-sm flex items-center">
                {customer.wallets[0].currency?.country} ({customer.wallets[0].currency?.currency_code}) — their only wallet
              </div>
            ) : (customer.wallets || []).length > 1 ? (
              <select value={fundCurrencyId} onChange={(e) => setFundCurrencyId(e.target.value)} required className="input">
                <option value="">Select wallet</option>
                {customer.wallets.map((w: any) => (
                  <option key={w.currency_id} value={w.currency_id}>{w.currency?.country} ({w.currency?.currency_code})</option>
                ))}
              </select>
            ) : (
              <select value={fundCurrencyId} onChange={(e) => setFundCurrencyId(e.target.value)} required className="input">
                <option value="">Select currency (creates their first wallet)</option>
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>{c.country} ({c.currency_code})</option>
                ))}
              </select>
            )}
            <input type="number" step="0.0001" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} required placeholder="Amount" className="input" />
            <input value={fundRemark} onChange={(e) => setFundRemark(e.target.value)} placeholder="Remark (optional)" className="input" />
            <button type="submit" disabled={fundSubmitting} className="btn self-start">
              {fundSubmitting ? "Saving..." : "Fund wallet"}
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Customer expense (debit)</h3>
          <form onSubmit={handleExpense} className="card flex flex-col gap-3">
            {(customer.wallets || []).length === 1 ? (
              <div className="input bg-slate-50 text-slate-500 text-sm flex items-center">
                {customer.wallets[0].currency?.country} ({customer.wallets[0].currency?.currency_code}) — their only wallet
              </div>
            ) : (customer.wallets || []).length > 1 ? (
              <select value={expCurrencyId} onChange={(e) => setExpCurrencyId(e.target.value)} required className="input">
                <option value="">Select wallet</option>
                {customer.wallets.map((w: any) => (
                  <option key={w.currency_id} value={w.currency_id}>{w.currency?.country} ({w.currency?.currency_code})</option>
                ))}
              </select>
            ) : (
              <select value={expCurrencyId} onChange={(e) => setExpCurrencyId(e.target.value)} required className="input">
                <option value="">Select currency (creates their first wallet)</option>
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>{c.country} ({c.currency_code})</option>
                ))}
              </select>
            )}
            <input type="number" step="0.0001" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} required placeholder="Amount" className="input" />
            <input value={expRemark} onChange={(e) => setExpRemark(e.target.value)} placeholder="What's this for?" className="input" />
            <button type="submit" disabled={expSubmitting} className="btn-outline self-start">
              {expSubmitting ? "Saving..." : "Charge expense"}
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Add another wallet</h3>
          <form onSubmit={handleAddWallet} className="card flex flex-col gap-3">
            <p className="text-xs text-slate-400 -mt-1">
              For customers who transact from more than one country — e.g. they already have a Nigeria wallet and now also send from China.
            </p>
            <select value={newWalletCurrencyId} onChange={(e) => setNewWalletCurrencyId(e.target.value)} required className="input">
              <option value="">Select currency</option>
              {currencies
                .filter((c) => !(customer.wallets || []).some((w: any) => w.currency_id === c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.country} ({c.currency_code})</option>
                ))}
            </select>
            <button type="submit" disabled={addingWallet || !newWalletCurrencyId} className="btn-outline self-start">
              {addingWallet ? "Adding..." : "Add wallet"}
            </button>
          </form>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <h2 className="text-base font-semibold mb-2">Funding & expense history</h2>
      <div className="table-wrap mb-8">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Amount</th>
              <th>Balance after</th>
              <th>Remark</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p: any) => {
              const isReversal = p.description?.startsWith("Refund");
              const canReverse = myRole === "admin" && !isReversal && p.refund_status !== "refunded" &&
                (p.description === "Customer wallet funding" || p.description === "Customer Expenses");
              return (
                <tr key={p.id}>
                  <td>
                    {p.description}
                    {p.refund_status === "refunded" && !isReversal && (
                      <span className="badge badge-inactive ml-2">reversed</span>
                    )}
                  </td>
                  <td className={Number(p.amount) < 0 ? "text-red-600" : "text-emerald-600"}>
                    {p.currency_symbol}{Number(p.amount).toLocaleString()}
                  </td>
                  <td>{p.currency_symbol}{Number(p.customer_balance).toLocaleString()}</td>
                  <td className="text-slate-500">{p.remark || "—"}</td>
                  <td className="whitespace-nowrap text-xs text-slate-500">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="flex gap-2 items-center">
                    {!isReversal && (
                      <button onClick={() => handleDownloadReceipt(p.id)} className="btn-ghost flex items-center gap-1">
                        <Download size={13} /> Receipt
                      </button>
                    )}
                    {canReverse && (
                      <button onClick={() => handleReverse(p)} disabled={reversingId === p.id} className="btn-danger">
                        {reversingId === p.id ? "..." : "Reverse"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {payments.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-400 py-8">No funding or expense history yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="text-base font-semibold mb-2">Transaction history</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ref</th>
              <th>Amount</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t: any) => (
              <tr key={t.id}>
                <td className="font-mono text-xs">{t.tranx_ref}</td>
                <td>{Number(t.amount).toLocaleString()}</td>
                <td>{Number(t.total).toLocaleString()}</td>
                <td><span className={`badge badge-${t.payment_status?.replace(" ", "-")}`}>{t.payment_status}</span></td>
                <td className="whitespace-nowrap text-xs text-slate-500">{new Date(t.created_at).toLocaleDateString()}</td>
                <td><a href={`/transactions/${t.id}`} className="font-semibold">View</a></td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-400 py-8">No transactions yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
