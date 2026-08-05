"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import SearchInput from "@/components/SearchInput";

export default function ChadRegionsPage() {
  const [regions, setRegions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await api.getChadRegions();
      setRegions(res.chad_regions);
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
      await api.createChadRegion(name);
      setName("");
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(r: any) {
    await api.updateChadRegion(r.id, { status: r.status === "active" ? "inactive" : "active" });
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this region?")) return;
    await api.deleteChadRegion(id);
    load();
  }

  return (
    <AppShell title="Chad Pickup Regions" subtitle="Specific pickup locations for transfers landing in Chad">
      <form onSubmit={handleAdd} className="card flex gap-3 items-end mb-6">
        <div>
          <label className="label">Region name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="input" placeholder="e.g. N'Djamena" />
        </div>
        <button type="submit" disabled={submitting} className="btn">{submitting ? "Adding..." : "Add region"}</button>
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <SearchInput value={search} onChange={setSearch} placeholder="Search regions..." />
      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Region</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {regions.filter((r) => !search || r.region?.toLowerCase().includes(search.toLowerCase())).map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.region}</td>
                  <td>
                    <button onClick={() => toggleStatus(r)} className={r.status === "active" ? "btn-ghost" : "btn-danger"}>
                      {r.status === "active" ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td>
                    <button onClick={() => handleDelete(r.id)} className="btn-danger">Delete</button>
                  </td>
                </tr>
              ))}
              {regions.length === 0 && (
                <tr><td colSpan={3} className="text-center text-slate-400 py-8">No regions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
