"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import SearchInput from "@/components/SearchInput";
import { Pencil } from "lucide-react";

export default function CurrencyGroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [country1Id, setCountry1Id] = useState("");
  const [country2Id, setCountry2Id] = useState("");
  const [rate, setRate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRate, setEditRate] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [groupsRes, currenciesRes] = await Promise.all([api.getCurrencyGroups(), api.getCurrencies()]);
      setGroups(groupsRes.currency_groups);
      setCurrencies(currenciesRes.currencies);
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
    setError("");
    setSubmitting(true);
    try {
      await api.createCurrencyGroup({
        country1_id: Number(country1Id),
        country2_id: Number(country2Id),
        rate: parseFloat(rate),
      });
      setCountry1Id("");
      setCountry2Id("");
      setRate("");
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function saveRate(id: number) {
    await api.updateCurrencyGroup(id, { rate: parseFloat(editRate) });
    setEditingId(null);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this corridor?")) return;
    await api.deleteCurrencyGroup(id);
    load();
  }

  return (
    <AppShell title="Currency Corridors" subtitle="Sending → receiving country pairs and their rates">
      <form onSubmit={handleAdd} className="card flex gap-3 flex-wrap items-end mb-6">
        <div>
          <label className="label">Sending country</label>
          <select value={country1Id} onChange={(e) => setCountry1Id(e.target.value)} required className="input">
            <option value="">Select</option>
            {currencies.map((c) => (
              <option key={c.id} value={c.id}>{c.country} ({c.currency_code})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Receiving country</label>
          <select value={country2Id} onChange={(e) => setCountry2Id(e.target.value)} required className="input">
            <option value="">Select</option>
            {currencies.map((c) => (
              <option key={c.id} value={c.id}>{c.country} ({c.currency_code})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Rate</label>
          <input type="number" step="0.000001" value={rate} onChange={(e) => setRate(e.target.value)} required className="input w-36" placeholder="0.000000" />
        </div>
        <button type="submit" disabled={submitting} className="btn">
          {submitting ? "Adding..." : "Add corridor"}
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <SearchInput value={search} onChange={setSearch} placeholder="Search by country..." />
      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sending country</th>
                <th>Receiving country</th>
                <th>Rate</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {groups.filter((g) => !search || g.country1?.country?.toLowerCase().includes(search.toLowerCase()) || g.country2?.country?.toLowerCase().includes(search.toLowerCase())).map((g) => (
                <tr key={g.id}>
                  <td className="font-medium">{g.country1?.country} ({g.country1?.currency_code})</td>
                  <td>{g.country2?.country} ({g.country2?.currency_code})</td>
                  <td>
                    {editingId === g.id ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          step="0.000001"
                          value={editRate}
                          onChange={(e) => setEditRate(e.target.value)}
                          className="input w-32"
                          autoFocus
                        />
                        <button onClick={() => saveRate(g.id)} className="btn-ghost">Save</button>
                        <button onClick={() => setEditingId(null)} className="btn-ghost">Cancel</button>
                      </div>
                    ) : (
                      <span className="font-mono">{g.rate}</span>
                    )}
                  </td>
                  <td className="flex gap-2">
                    {editingId !== g.id && (
                      <button
                        onClick={() => {
                          setEditingId(g.id);
                          setEditRate(String(g.rate));
                        }}
                        className="btn-ghost flex items-center gap-1"
                      >
                        <Pencil size={13} /> Edit rate
                      </button>
                    )}
                    <button onClick={() => handleDelete(g.id)} className="btn-danger">Delete</button>
                  </td>
                </tr>
              ))}
              {groups.length === 0 && (
                <tr><td colSpan={4} className="text-center text-slate-400 py-8">No corridors set up yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
