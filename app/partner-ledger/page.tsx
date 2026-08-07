"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import SearchInput from "@/components/SearchInput";
import { useLanguage } from "@/lib/i18n";
import * as XLSX from "xlsx";
import { FileSpreadsheet, FileText } from "lucide-react";

type Partner = "nita";
const PARTNERS: { key: Partner; label: string }[] = [
  { key: "nita", label: "Nita" },
];

export default function PartnerLedgerPage() {
  const { lang, t } = useLanguage();
  const [partner, setPartner] = useState<Partner>("nita");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");

  const [entryType, setEntryType] = useState<"credit" | "debit">("credit");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryDescription, setEntryDescription] = useState("");
  const [entryRemarks, setEntryRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<number | null>(null);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  function handleExportExcel() {
    if (!data) return;
    setExporting("excel");
    try {
      const exportRows = (data.entries?.data || data.entries || []).map((r: any) => ({
        Description: r.description,
        Remarks: r.remarks || "",
        Credit: r.credit,
        Debit: r.debit,
        Balance: r.balance,
        Date: new Date(r.created_at).toLocaleString(),
      }));
      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, partner);
      XLSX.writeFile(wb, `${partner}-ledger.xlsx`);
    } finally {
      setExporting(null);
    }
  }

  async function handleExportPdf() {
    setExporting("pdf");
    try {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const token = localStorage.getItem("easyservice_token");
      const qs = new URLSearchParams(params).toString();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiUrl}/partner-ledger/${partner}/export-pdf?${qs}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "", "ngrok-skip-browser-warning": "true" },
      });
      if (!res.ok) throw new Error("Could not generate the ledger PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${partner}-ledger.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExporting(null);
    }
  }

  async function handleDownloadEntryReceipt(entryId: number) {
    setDownloadingReceiptId(entryId);
    try {
      const token = localStorage.getItem("easyservice_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiUrl}/partner-ledger/${partner}/${entryId}/receipt`, {
        headers: { Authorization: token ? `Bearer ${token}` : "", "ngrok-skip-browser-warning": "true" },
      });
      if (!res.ok) throw new Error("Could not generate the receipt");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${partner}-receipt-${entryId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDownloadingReceiptId(null);
    }
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await api.getPartnerLedger(partner, params);
      setData(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner]);

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.addPartnerLedgerEntry(partner, {
        [entryType]: parseFloat(entryAmount),
        description: entryDescription,
        remarks: entryRemarks || undefined,
      });
      setEntryAmount("");
      setEntryDescription("");
      setEntryRemarks("");
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const rows = (data?.entries?.data || data?.entries || []).filter(
    (r: any) => !search || r.description?.toLowerCase().includes(search.toLowerCase()) || r.remarks?.toLowerCase().includes(search.toLowerCase())
  );

  const card = (label: string, value: any) => (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{Number(value || 0).toLocaleString()}</div>
    </div>
  );

  return (
    <AppShell title={t("partner_ledgers")} subtitle={lang === "ar" ? "حسابات نيتا وأليزا وساكو الوسيطة" : "Nita, Aliza & Sacko pass-through accounts"}>
      <div className="flex gap-2 mb-5">
        {PARTNERS.map((p) => (
          <button key={p.key} onClick={() => setPartner(p.key)} className={partner === p.key ? "btn" : "btn-ghost"}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6 items-end flex-wrap">
        <div>
          <label className="label">{lang === "ar" ? "من" : "From"}</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">{lang === "ar" ? "إلى" : "To"}</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" />
        </div>
        <button onClick={load} className="btn">{lang === "ar" ? "تطبيق" : "Apply"}</button>
        <button onClick={handleExportExcel} disabled={exporting !== null || !data} className="btn-outline flex items-center gap-1.5">
          <FileSpreadsheet size={15} /> {lang === "ar" ? "تصدير Excel" : "Export Excel"}
        </button>
        <button onClick={handleExportPdf} disabled={exporting !== null} className="btn-outline flex items-center gap-1.5">
          <FileText size={15} /> {exporting === "pdf" ? "..." : lang === "ar" ? "تصدير PDF" : "Export PDF"}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading || !data ? (
        <p className="text-slate-400 text-sm">{t("loading")}</p>
      ) : (
        <>
          <div className="flex gap-3 mb-6 flex-wrap">
            {card(lang === "ar" ? "الرصيد الحالي" : "Current balance", data.current_balance)}
            {card(lang === "ar" ? "إجمالي الدائن" : "Total credit", data.totals.total_credit)}
            {card(lang === "ar" ? "إجمالي المدين" : "Total debit", data.totals.total_debit)}
          </div>

          <form onSubmit={handleAddEntry} className="card flex gap-3 flex-wrap items-end mb-6">
            <div>
              <label className="label">{lang === "ar" ? "النوع" : "Type"}</label>
              <select value={entryType} onChange={(e) => setEntryType(e.target.value as "credit" | "debit")} className="input">
                <option value="credit">{lang === "ar" ? "دائن" : "Credit"}</option>
                <option value="debit">{lang === "ar" ? "مدين" : "Debit"}</option>
              </select>
            </div>
            <div>
              <label className="label">{t("amount")}</label>
              <input type="number" step="0.0001" value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} required className="input w-36" />
            </div>
            <div>
              <label className="label">{lang === "ar" ? "الوصف" : "Description"}</label>
              <input value={entryDescription} onChange={(e) => setEntryDescription(e.target.value)} required className="input" placeholder={lang === "ar" ? "سبب هذا القيد" : "Reason for this entry"} />
            </div>
            <div>
              <label className="label">{lang === "ar" ? "ملاحظات" : "Remarks"}</label>
              <input value={entryRemarks} onChange={(e) => setEntryRemarks(e.target.value)} className="input" />
            </div>
            <button type="submit" disabled={submitting} className="btn">
              {submitting ? (lang === "ar" ? "جارٍ الإضافة..." : "Adding...") : (lang === "ar" ? "إضافة قيد" : "Add entry")}
            </button>
          </form>

          <SearchInput value={search} onChange={setSearch} placeholder={lang === "ar" ? "بحث في الوصف أو الملاحظات..." : "Search description or remarks..."} />

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("date")}</th>
                  <th>{lang === "ar" ? "الوصف" : "Description"}</th>
                  <th>{lang === "ar" ? "ملاحظات" : "Remarks"}</th>
                  <th>{lang === "ar" ? "دائن" : "Credit"}</th>
                  <th>{lang === "ar" ? "مدين" : "Debit"}</th>
                  <th>{lang === "ar" ? "الرصيد" : "Balance"}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
                    <td>{r.description}</td>
                    <td className="text-slate-400">{r.remarks || "—"}</td>
                    <td className="text-emerald-600">{Number(r.credit) ? Number(r.credit).toLocaleString() : "—"}</td>
                    <td className="text-red-600">{Number(r.debit) ? Number(r.debit).toLocaleString() : "—"}</td>
                    <td className="font-semibold">{Number(r.balance).toLocaleString()}</td>
                    <td>
                      <button onClick={() => handleDownloadEntryReceipt(r.id)} disabled={downloadingReceiptId === r.id} className="btn-ghost">
                        {downloadingReceiptId === r.id ? "..." : lang === "ar" ? "إيصال" : "Receipt"}
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-slate-400 py-8">{lang === "ar" ? "لا توجد قيود لهذه الفترة." : "No ledger entries for this period."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppShell>
  );
}
