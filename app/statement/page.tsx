"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import SearchInput from "@/components/SearchInput";
import { useLanguage } from "@/lib/i18n";

export default function StatementPage() {
  const { lang, t } = useLanguage();
  const [me, setMe] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [staffId, setStaffId] = useState<number | null>(null);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = me?.role === "admin";

  useEffect(() => {
    api.me().then((res) => {
      setMe(res.user);
      setStaffId(res.user.id);
    });
  }, []);

  useEffect(() => {
    if (isAdmin) {
      api.getStaff().then((res) => setStaffList(res.staff));
    }
  }, [isAdmin]);

  async function load() {
    if (!staffId) return;
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;
      if (search) params.search = search;
      const res = await api.getStaffStatements(staffId, params);
      setData(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (staffId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId]);

  useEffect(() => {
    if (!staffId) return;
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const rows = data?.statements?.data || data?.statements || [];

  const card = (label: string, value: any) => (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{Number(value || 0).toLocaleString()}</div>
    </div>
  );

  return (
    <AppShell title={isAdmin ? (lang === "ar" ? "كشوف حسابات الموظفين" : "Staff Statements") : (lang === "ar" ? "كشف حسابي" : "My Statement")} subtitle={lang === "ar" ? "نشاط المحفظة والرصيد الجاري" : "Wallet activity and running balance"}>
      <div className="flex gap-2 mb-6 items-end flex-wrap">
        {isAdmin && (
          <div>
            <label className="label">{lang === "ar" ? "الموظف" : "Staff member"}</label>
            <select
              value={staffId ?? ""}
              onChange={(e) => setStaffId(Number(e.target.value))}
              className="input"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="label">{lang === "ar" ? "من" : "From"}</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">{lang === "ar" ? "إلى" : "To"}</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" />
        </div>
        <button onClick={load} className="btn">{lang === "ar" ? "تطبيق" : "Apply"}</button>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <SearchInput value={search} onChange={setSearch} placeholder={lang === "ar" ? "بحث بالملاحظة أو الدولة أو المرجع..." : "Search by note, country, or reference..."} />

      {loading || !data ? (
        <p className="text-slate-400 text-sm">{t("loading")}</p>
      ) : (
        <>
          <div className="flex gap-3 mb-6 flex-wrap">
            {card(lang === "ar" ? "رصيد المحفظة الحالي" : "Current wallet balance", data.staff.wallet)}
            {card(lang === "ar" ? "إجمالي الوارد" : "Total in", data.totals.total_in)}
            {card(lang === "ar" ? "إجمالي الصادر" : "Total out", data.totals.total_out)}
            {card(lang === "ar" ? "إجمالي المسترد" : "Total refunded", data.totals.total_refunded)}
          </div>

          <div className="table-wrap">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="whitespace-nowrap">{lang === "ar" ? "التاريخ" : "Date"}</th>
                  <th>{lang === "ar" ? "التفاصيل" : "Details"}</th>
                  <th className="whitespace-nowrap">{lang === "ar" ? "دائن" : "Credit"}</th>
                  <th className="whitespace-nowrap">{lang === "ar" ? "مدين" : "Debit"}</th>
                  <th className="whitespace-nowrap">{lang === "ar" ? "الرصيد" : "Balance"}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="break-words max-w-0 w-full">{r.details}</td>
                    <td className="text-emerald-600 whitespace-nowrap">{Number(r.credit_amount) ? Number(r.credit_amount).toLocaleString() : "—"}</td>
                    <td className="text-red-600 whitespace-nowrap">{Number(r.debit_amount) ? Number(r.debit_amount).toLocaleString() : "—"}</td>
                    <td className="font-semibold whitespace-nowrap">{Number(r.balance).toLocaleString()}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-slate-400 py-8">{lang === "ar" ? "لا توجد قيود لهذه الفترة." : "No statement entries for this period."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppShell>
  );
}
