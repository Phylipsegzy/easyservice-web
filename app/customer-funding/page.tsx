"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import CustomerPicker, { PickedCustomer } from "@/components/CustomerPicker";
import MoneyInput from "@/components/MoneyInput";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default function CustomerFundingPage() {
  const [customer, setCustomer] = useState<PickedCustomer | null>(null);
  const [fullCustomer, setFullCustomer] = useState<any>(null);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [fundCurrencyId, setFundCurrencyId] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [fundRemark, setFundRemark] = useState("");
  const [fundSubmitting, setFundSubmitting] = useState(false);

  const [expCurrencyId, setExpCurrencyId] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expRemark, setExpRemark] = useState("");
  const [expSubmitting, setExpSubmitting] = useState(false);

  useEffect(() => {
    api.getCurrencies().then((res) => setCurrencies(res.currencies)).catch(() => {});
  }, []);

  async function loadFullCustomer(id: number) {
    setLoading(true);
    setError("");
    try {
      const res = await api.getCustomer(id);
      setFullCustomer(res.customer);
    } catch (err: any) {
      setError(err.message);
      setFullCustomer(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (customer?.id) {
      loadFullCustomer(customer.id);
      setFundAmount("");
      setFundRemark("");
      setExpAmount("");
      setExpRemark("");
      setSuccess("");
    } else {
      setFullCustomer(null);
    }
  }, [customer]);

  // If the customer has exactly one wallet, use it automatically.
  useEffect(() => {
    const wallets = fullCustomer?.wallets || [];
    if (wallets.length === 1) {
      setFundCurrencyId(String(wallets[0].currency_id));
      setExpCurrencyId(String(wallets[0].currency_id));
    }
  }, [fullCustomer]);

  async function handleFund(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFundSubmitting(true);
    try {
      await api.fundCustomerWallet(customer!.id, {
        currency_id: Number(fundCurrencyId),
        amount: parseFloat(fundAmount),
        remark: fundRemark || undefined,
      });
      setSuccess(`Wallet funded for ${customer!.customer_name}.`);
      setFundAmount("");
      setFundRemark("");
      loadFullCustomer(customer!.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFundSubmitting(false);
    }
  }

  async function handleExpense(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setExpSubmitting(true);
    try {
      await api.expenseCustomerWallet(customer!.id, {
        currency_id: Number(expCurrencyId),
        amount: parseFloat(expAmount),
        remark: expRemark || undefined,
      });
      setSuccess(`Expense charged to ${customer!.customer_name}.`);
      setExpAmount("");
      setExpRemark("");
      loadFullCustomer(customer!.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExpSubmitting(false);
    }
  }

  return (
    <AppShell title="Customer Funding / Expense" subtitle="Fund or debit a customer's wallet directly, without opening their full profile">
      <a href="/more" className="back-link md:hidden">&larr; More</a>

      <div className="max-w-xl mb-6">
        <label className="label">Customer</label>
        <CustomerPicker
          selected={customer}
          onSelect={setCustomer}
          onCreateNew={() => setError("Customer not found — create them first from the Customers page, then come back here to fund their wallet.")}
        />
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {success && <p className="text-emerald-600 text-sm mb-4">{success}</p>}

      {loading && <p className="text-slate-400 text-sm">Loading customer...</p>}

      {fullCustomer && (
        <>
          <div className="card mb-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">{fullCustomer.customer_name}</p>
              <p className="text-xs text-slate-400">{fullCustomer.phone} · {fullCustomer.location || "—"}</p>
            </div>
            <Link href={`/customers/${fullCustomer.id}`} className="btn-ghost flex items-center gap-1.5 no-underline">
              View full profile <ExternalLink size={14} />
            </Link>
          </div>

          {(fullCustomer.wallets || []).length > 0 && (
            <div className="flex gap-3 mb-6 flex-wrap">
              {fullCustomer.wallets.map((w: any) => (
                <div key={w.currency_id} className="stat-card">
                  <div className="stat-label">{w.currency?.country} balance</div>
                  <div className="stat-value">
                    {w.currency?.symbol} {Number(w.balance).toLocaleString()} {w.currency?.currency_code}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Fund wallet</h3>
              <form onSubmit={handleFund} className="card flex flex-col gap-3">
                {(fullCustomer.wallets || []).length === 1 ? (
                  <div className="input bg-slate-50 text-slate-500 text-sm flex items-center">
                    {fullCustomer.wallets[0].currency?.country} ({fullCustomer.wallets[0].currency?.currency_code}) — their only wallet
                  </div>
                ) : (fullCustomer.wallets || []).length > 1 ? (
                  <select value={fundCurrencyId} onChange={(e) => setFundCurrencyId(e.target.value)} required className="input">
                    <option value="">Select wallet</option>
                    {fullCustomer.wallets.map((w: any) => (
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
                <MoneyInput value={fundAmount} onChange={setFundAmount} placeholder="Amount" className="input" required />
                <input value={fundRemark} onChange={(e) => setFundRemark(e.target.value)} placeholder="Remark (optional)" className="input" />
                <button type="submit" disabled={fundSubmitting} className="btn self-start">
                  {fundSubmitting ? "Saving..." : "Fund wallet"}
                </button>
              </form>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Customer expense (debit)</h3>
              <form onSubmit={handleExpense} className="card flex flex-col gap-3">
                {(fullCustomer.wallets || []).length === 1 ? (
                  <div className="input bg-slate-50 text-slate-500 text-sm flex items-center">
                    {fullCustomer.wallets[0].currency?.country} ({fullCustomer.wallets[0].currency?.currency_code}) — their only wallet
                  </div>
                ) : (fullCustomer.wallets || []).length > 1 ? (
                  <select value={expCurrencyId} onChange={(e) => setExpCurrencyId(e.target.value)} required className="input">
                    <option value="">Select wallet</option>
                    {fullCustomer.wallets.map((w: any) => (
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
                <MoneyInput value={expAmount} onChange={setExpAmount} placeholder="Amount" className="input" required />
                <input value={expRemark} onChange={(e) => setExpRemark(e.target.value)} placeholder="What's this for?" className="input" />
                <button type="submit" disabled={expSubmitting} className="btn-outline self-start">
                  {expSubmitting ? "Saving..." : "Charge expense"}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
