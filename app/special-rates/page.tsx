"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import SearchInput from "@/components/SearchInput";
import CustomerPicker, { PickedCustomer } from "@/components/CustomerPicker";
import { useLanguage } from "@/lib/i18n";

export default function SpecialRatesPage() {
  const { t } = useLanguage();
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
    if (!confirm(t("confirm_remove_rate"))) return;
    await api.deleteSpecialRate(id);
    load();
  }

  return (
    <AppShell title={t("special_rates")} subtitle={t("special_rates_subtitle")}>
      <form onSubmit={handleAdd} className="card flex flex-col gap-3 mb-6 max-w-md">
        <div>
          <label className="label">{t("customer")}</label>
          <CustomerPicker selected={customer} onSelect={setCustomer} onCreateNew={() => {}} />
        </div>
        <div>
          <label className="label">{t("name_optional")}</label>
          <input value={rateName} onChange={(e) => setRateName(e.target.value)} placeholder={t("rate_name_placeholder")} className="input w-full" />
        </div>
        <div>
          <label className="label">{t("special_rate_label")}</label>
          <input type="number" step="0.0001" value={rate} onChange={(e) => setRate(e.target.value)} required className="input w-full" />
        </div>
        <button type="submit" disabled={submitting || !customer} className="btn self-start">
          {submitting ? t("saving") : t("add_special_rate")}
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <SearchInput value={search} onChange={setSearch} placeholder={t("search_by_customer")} />
      {loading ? (
        <p className="text-slate-400 text-sm">{t("loading")}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("customer")}</th>
                <th>{t("name")}</th>
                <th>{t("rate")}</th>
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
                    <button onClick={() => handleDelete(r.id)} className="btn-danger">{t("remove")}</button>
                  </td>
                </tr>
              ))}
              {rates.length === 0 && (
                <tr><td colSpan={4} className="text-center text-slate-400 py-8">{t("no_special_rates")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
