"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import SearchInput from "@/components/SearchInput";

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  async function load(status?: string) {
    setLoading(true);
    try {
      const res = await api.getRefunds(status ? { status } : undefined);
      setRefunds(res.refunds.data || res.refunds);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleFilter(status: string) {
    setStatusFilter(status);
    load(status || undefined);
  }

  async function handleComplete(id: number) {
    try {
      await api.completeRefund(id);
      load(statusFilter || undefined);
    } catch (err: any) {
      setError(err.message);
    }
  }

  const visibleRefunds = refunds.filter((r) =>
    !search || r.customer_name?.toLowerCase().includes(search.toLowerCase()) || r.tranx_ref?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell title="Refunds" subtitle="Money paid back out to customers">
      <SearchInput value={search} onChange={setSearch} placeholder="Search by customer or reference..." />
      <div className="flex gap-2 mb-6">
        {["", "pending", "completed"].map((s) => (
          <button key={s} onClick={() => handleFilter(s)} className={statusFilter === s ? "btn" : "btn-ghost"}>
            {s === "" ? "All" : s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Transaction</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visibleRefunds.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="font-mono text-xs">
                    <Link href={`/transactions/${r.transaction_id}`} className="font-semibold">{r.tranx_ref}</Link>
                  </td>
                  <td>{r.customer_name}</td>
                  <td>{Number(r.amount).toLocaleString()}</td>
                  <td><span className={`badge badge-${r.payment_status === "completed" ? "completed" : "pending"}`}>{r.payment_status}</span></td>
                  <td>
                    {r.payment_status === "pending" && (
                      <button onClick={() => handleComplete(r.id)} className="btn-ghost">Mark paid out</button>
                    )}
                  </td>
                </tr>
              ))}
              {visibleRefunds.length === 0 && (
                <tr><td colSpan={6} className="text-center text-slate-400 py-8">No refunds yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
