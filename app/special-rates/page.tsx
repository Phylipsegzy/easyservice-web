"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import SearchInput from "@/components/SearchInput";
import CustomerPicker, { PickedCustomer } from "@/components/CustomerPicker";

export default function SpecialRatesPage() {
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customer, setCustomer] = useState<PickedCustomer | null>(null);
  const [rateName, setRateName] = useState("");
  const [rate, setRate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await api.getSpecialRates();
      setRates(res.special_rates);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;
    setError("");
    setSubmitting(true);
    try {
      await api.createSpecialRate({ customer_id: customer.id, name: rateName || undefined, customer_rate: parseFloat(rate) });
      setCustomer(null);
      setRateName("");
      setRate("");
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this special rate?")) return;
    await api.deleteSpecialRate(id);
    load();
  }

  return (
    <AppShell title="Special Rates" subtitle="Preferential rates for specific customers">
      <form onSubmit={handleAdd} className="card flex flex-col gap-3 mb-6 max-w-md">
        <div>
          <label className="label">Customer</label>
          <CustomerPicker selected={customer} onSelect={setCustomer} onCreateNew={() => {}} />
        </div>
        <div>
          <label className="label">Name (optional)</label>
          <input value={rateName} onChange={(e) => setRateName(e.target.value)} placeholder="e.g. VIP rate — above 1M" className="input w-full" />
        </div>
        <div>
          <label className="label">Special rate</label>
          <input type="number" step="0.0001" value={rate} onChange={(e) => setRate(e.target.value)} required className="input w-full" />
        </div>
        <button type="submit" disabled={submitting || !customer} className="btn self-start">
          {submitting ? "Adding..." : "Add special rate"}
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <SearchInput value={search} onChange={setSearch} placeholder="Search by customer..." />
      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Name</th>
                <th>Rate</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rates.filter((r) => !search || r.customer?.customer_name?.toLowerCase().includes(search.toLowerCase())).map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.customer?.customer_name}</td>
                  <td className="text-slate-500">{r.name || "—"}</td>
                  <td>{r.customer_rate}</td>
                  <td>
                    <button onClick={() => handleDelete(r.id)} className="btn-danger">Remove</button>
                  </td>
                </tr>
              ))}
              {rates.length === 0 && (
                <tr><td colSpan={4} className="text-center text-slate-400 py-8">No special rates set.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
