"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import SearchInput from "@/components/SearchInput";
import { Download } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

type Direction = "in" | "out";

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CashMovementPage() {
  const { lang, t } = useLanguage();
  const [me, setMe] = useState<any>(null);
  const [direction, setDirection] = useState<Direction>("in");
  const [movements, setMovements] = useState<any[]>([]);
  const [location, setLocation] = useState("");
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const isAdmin = me?.role === "admin";

  useEffect(() => {
    api.me().then((res) => setMe(res.user));
    api.getCurrencies().then((res) => setCurrencies(res.currencies));
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { direction };
      if (from) params.from = from;
      if (to) params.to = to;
      if (isAdmin && location) params.location = location;
      const res = await api.getCashMovement(params);
      setMovements(res.movements);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (me) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, direction]);

  const total = movements.reduce((sum, m) => sum + Number(direction === "in" ? m.amount : m.total || 0), 0);
  const visibleMovements = movements.filter((m) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      m.customer_name?.toLowerCase().includes(s) ||
      m.receiver_name?.toLowerCase().includes(s) ||
      m.tranx_ref?.toLowerCase().includes(s) ||
      m.sales_rep?.toLowerCase().includes(s)
    );
  });

  function handleExport() {
    if (direction === "in") {
      downloadCsv(
        `cash-in-${Date.now()}.csv`,
        ["Customer", "Phone", "Sent from", "Currency", "Sales rep", "Amount sent", "Date"],
        movements.map((m) => [
          m.customer_name,
          `${m.country_code || ""} ${m.phone}`,
          m.country_name,
          m.currency_code,
          m.sales_rep,
          m.amount,
          new Date(m.created_at).toLocaleString(),
        ])
      );
    } else {
      downloadCsv(
        `cash-out-${Date.now()}.csv`,
        ["Ref", "Receiver", "Receiver phone", "Country", "Currency", "Sales rep", "Payout by", "Amount received", "Date"],
        movements.map((m) => [
          m.tranx_ref,
          m.receiver_name,
          m.receiver_phone,
          m.country_name,
          m.currency_code,
          m.sales_rep,
          m.payout_by_name || "—",
          m.total,
          new Date(m.created_at).toLocaleString(),
        ])
      );
    }
  }

  return (
    <AppShell title={t("cash_movement")} subtitle={lang === "ar" ? "النقد المُحصَّل والمدفوع، حسب الموقع" : "Cash collected in and paid out, by location"}>
      <div className="flex gap-2 mb-5">
        <button onClick={() => setDirection("in")} className={direction === "in" ? "btn" : "btn-ghost"}>{lang === "ar" ? "النقد الوارد" : "Cash In"}</button>
        <button onClick={() => setDirection("out")} className={direction === "out" ? "btn" : "btn-ghost"}>{lang === "ar" ? "النقد الصادر" : "Cash Out"}</button>
      </div>

      <div className="flex gap-2 mb-6 items-end flex-wrap">
        {isAdmin && (
          <div>
            <label className="label">{lang === "ar" ? "الموقع" : "Location"}</label>
            <select value={location} onChange={(e) => setLocation(e.target.value)} className="input">
              <option value="">{lang === "ar" ? "كل المواقع" : "All locations"}</option>
              {currencies.map((c) => (
                <option key={c.id} value={c.country}>{c.country}</option>
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
        <button onClick={handleExport} disabled={movements.length === 0} className="btn-outline flex items-center gap-1.5">
          <Download size={15} /> {lang === "ar" ? "تصدير CSV" : "Export CSV"}
        </button>
      </div>

      {!isAdmin && me?.location && (
        <p className="text-xs text-slate-400 mb-4">{lang === "ar" ? `عرض ${me.location} فقط.` : `Showing ${me.location} only.`}</p>
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <SearchInput value={search} onChange={setSearch} placeholder={lang === "ar" ? "بحث بالعميل أو المستلم أو المندوب أو المرجع..." : "Search by customer, receiver, rep, or reference..."} />

      <div className="stat-card mb-6 inline-block">
        <div className="stat-label">{lang === "ar" ? `الإجمالي ${direction === "in" ? "المُحصَّل" : "المدفوع"}` : `Total ${direction === "in" ? "collected" : "paid out"}`}</div>
        <div className="stat-value">{total.toLocaleString()}</div>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">{t("loading")}</p>
      ) : direction === "in" ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("customer")}</th>
                <th>{lang === "ar" ? "الهاتف" : "Phone"}</th>
                <th>{lang === "ar" ? "أُرسل من" : "Sent from"}</th>
                <th>{lang === "ar" ? "المندوب" : "Sales rep"}</th>
                <th>{lang === "ar" ? "المبلغ المرسل" : "Amount sent"}</th>
                <th>{t("date")}</th>
              </tr>
            </thead>
            <tbody>
              {visibleMovements.map((m) => (
                <tr key={m.id}>
                  <td className="font-medium">{m.customer_name}</td>
                  <td>{m.country_code} {m.phone}</td>
                  <td>{m.country_name} ({m.currency_code})</td>
                  <td>{m.sales_rep}</td>
                  <td>{Number(m.amount).toLocaleString()}</td>
                  <td className="whitespace-nowrap text-xs text-slate-500">{new Date(m.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {visibleMovements.length === 0 && (
                <tr><td colSpan={6} className="text-center text-slate-400 py-8">{lang === "ar" ? "لا يوجد نقد وارد لهذه الفترة." : "No cash-in for this period."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{lang === "ar" ? "المرجع" : "Ref"}</th>
                <th>{lang === "ar" ? "المستلم" : "Receiver"}</th>
                <th>{lang === "ar" ? "الدولة" : "Country"}</th>
                <th>{lang === "ar" ? "المندوب" : "Sales rep"}</th>
                <th>{lang === "ar" ? "دفع بواسطة" : "Payout by"}</th>
                <th>{lang === "ar" ? "المبلغ المستلم" : "Amount received"}</th>
                <th>{t("date")}</th>
              </tr>
            </thead>
            <tbody>
              {visibleMovements.map((m) => (
                <tr key={m.id}>
                  <td className="font-mono text-xs">{m.tranx_ref}</td>
                  <td>
                    <div className="font-medium">{m.receiver_name}</div>
                    <div className="text-xs text-slate-400">{m.receiver_phone}</div>
                  </td>
                  <td>{m.country_name} ({m.currency_code})</td>
                  <td>{m.sales_rep}</td>
                  <td>{m.payout_by_name || "—"}</td>
                  <td>{Number(m.total).toLocaleString()}</td>
                  <td className="whitespace-nowrap text-xs text-slate-500">{new Date(m.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {visibleMovements.length === 0 && (
                <tr><td colSpan={7} className="text-center text-slate-400 py-8">{lang === "ar" ? "لا يوجد نقد صادر لهذه الفترة." : "No cash-out for this period."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
