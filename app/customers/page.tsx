"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import PhoneInput from "@/components/PhoneInput";
import { useLanguage } from "@/lib/i18n";

export default function CustomersPage() {
  const { lang, t } = useLanguage();
  const [customers, setCustomers] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [phone, setPhone] = useState("");
  const [countryId, setCountryId] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load(searchTerm?: string) {
    setLoading(true);
    try {
      const res = await api.getCustomers(searchTerm);
      setCustomers(res.customers.data || res.customers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    api.getCurrencies().then((res) => setCurrencies(res.currencies));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.createCustomer({
        customer_name: name,
        phone,
        country_code: countryCode || undefined,
        country_id: countryId ? Number(countryId) : undefined,
        location,
      });
      setName("");
      setCountryCode("");
      setPhone("");
      setCountryId("");
      setLocation("");
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(search);
  }

  return (
    <AppShell title={t("customers")} subtitle={lang === "ar" ? "إدارة سجلات العملاء ومحافظهم" : "Manage customer records and wallets"}>
      <form onSubmit={handleAdd} className="card flex gap-3 flex-wrap items-end mb-4">
        <div>
          <label className="label">{lang === "ar" ? "اسم العميل" : "Customer name"}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
        </div>
        <div>
          <label className="label">{lang === "ar" ? "الهاتف" : "Phone"}</label>
          <PhoneInput countryCode={countryCode} phone={phone} onCountryCodeChange={setCountryCode} onPhoneChange={setPhone} required />
        </div>
        <div>
          <label className="label">{lang === "ar" ? "بلد الإقامة" : "Home country"}</label>
          <select value={countryId} onChange={(e) => setCountryId(e.target.value)} className="input">
            <option value="">{lang === "ar" ? "اختر (يُستخدم كبلد إرسال افتراضي)" : "Select (used as default sending country on invoices)"}</option>
            {currencies.map((c) => (
              <option key={c.id} value={c.id}>{c.country}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{lang === "ar" ? "الموقع (نص حر، اختياري)" : "Location (free text, optional)"}</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="input" />
        </div>
        <button type="submit" disabled={submitting} className="btn">
          {submitting ? (lang === "ar" ? "جارٍ الإضافة..." : "Adding...") : (lang === "ar" ? "إضافة عميل" : "Add customer")}
        </button>
      </form>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          placeholder={lang === "ar" ? "بحث بالاسم أو الهاتف" : "Search by name or phone"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input flex-1 md:w-72 md:flex-none"
        />
        <button type="submit" className="btn-outline">{lang === "ar" ? "بحث" : "Search"}</button>
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading ? (
        <p className="text-slate-400 text-sm">{t("loading")}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{lang === "ar" ? "الاسم" : "Name"}</th>
                <th>{lang === "ar" ? "الهاتف" : "Phone"}</th>
                <th>{lang === "ar" ? "الدولة" : "Country"}</th>
                <th>{t("status")}</th>
                <th>{lang === "ar" ? "المحافظ" : "Wallets"}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.customer_name}</td>
                  <td>{c.country_code} {c.phone}</td>
                  <td>{c.country?.country || c.location || "—"}</td>
                  <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                  <td>
                    {(c.wallets || [])
                      .map((w: any) => `${w.currency?.symbol || ""}${w.balance}`)
                      .join(", ") || "—"}
                  </td>
                  <td>
                    <Link href={`/customers/${c.id}`} className="font-semibold">{t("view")}</Link>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={6} className="text-center text-slate-400 py-8">{lang === "ar" ? "لا يوجد عملاء بعد." : "No customers yet."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
