"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Search, PackageCheck, Clock } from "lucide-react";

export default function TrackPage() {
  const [ref, setRef] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!ref.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.trackInvoice(ref.trim());
      setResult(res.transaction);
    } catch (err: any) {
      setError(err.message || "No transaction found for that reference.");
    } finally {
      setLoading(false);
    }
  }

  const completed = result?.payment_status === "completed";

  return (
    <AppShell title="Track Invoice" subtitle="Look up a transfer by its reference number">
      <div className="max-w-md">
        <form onSubmit={handleSearch} className="card flex gap-2">
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="e.g. 124"
            className="input w-full"
            autoFocus
          />
          <button type="submit" disabled={loading} className="btn flex items-center gap-1.5 flex-shrink-0">
            <Search size={15} /> {loading ? "Checking..." : "Track"}
          </button>
        </form>

        {error && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}

        {result && (
          <div className="card mt-5">
            <div className="flex flex-col items-center text-center gap-1.5 pb-4 mb-4 border-b border-slate-100">
              {completed ? (
                <PackageCheck size={36} className="text-emerald-500" />
              ) : (
                <Clock size={36} className="text-amber-500" />
              )}
              <span className={`badge badge-${completed ? "completed" : "pending"}`}>
                {completed ? "Paid out" : "Pending"}
              </span>
            </div>

            {[
              ["Reference", result.tranx_ref],
              ["Receiving country", `${result.receiving_country} (${result.currency_code})`],
              ["Amount", Number(result.total).toLocaleString()],
              ["Sent on", new Date(result.created_at).toLocaleString()],
              ["Paid out on", result.date_complete ? new Date(result.date_complete).toLocaleString() : "—"],
              ["Paid out by", result.payout_by_name || "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2 text-sm">
                <span className="text-slate-500">{label}</span>
                <strong className="text-slate-900 text-right">{value}</strong>
              </div>
            ))}

            <a
              href={`/transactions/${result.id}`}
              className="btn w-full mt-4 flex justify-center no-underline"
            >
              View transaction detail
            </a>
          </div>
        )}
      </div>
    </AppShell>
  );
}
