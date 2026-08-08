"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import SearchInput from "@/components/SearchInput";
import { useLanguage } from "@/lib/i18n";

export default function ChadRegionsPage() {
  const { t } = useLanguage();
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
    if (!confirm(t("confirm_delete_region"))) return;
    await api.deleteChadRegion(id);
    load();
  }

  return (
    <AppShell title={t("chad_regions_title")} subtitle={t("chad_regions_subtitle")}>
      <form onSubmit={handleAdd} className="card flex gap-3 items-end mb-6">
        <div>
          <label className="label">{t("region_name")}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="input" placeholder="e.g. N'Djamena" />
        </div>
        <button type="submit" disabled={submitting} className="btn">{submitting ? t("saving") : t("add_region")}</button>
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <SearchInput value={search} onChange={setSearch} placeholder={t("search_regions")} />
      {loading ? (
        <p className="text-slate-400 text-sm">{t("loading")}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("region")}</th>
                <th>{t("status")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {regions.filter((r) => !search || r.region?.toLowerCase().includes(search.toLowerCase())).map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.region}</td>
                  <td>
                    <button onClick={() => toggleStatus(r)} className={r.status === "active" ? "btn-ghost" : "btn-danger"}>
                      {r.status === "active" ? t("active") : t("inactive")}
                    </button>
                  </td>
                  <td>
                    <button onClick={() => handleDelete(r.id)} className="btn-danger">{t("delete")}</button>
                  </td>
                </tr>
              ))}
              {regions.length === 0 && (
                <tr><td colSpan={3} className="text-center text-slate-400 py-8">{t("no_regions_yet")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
