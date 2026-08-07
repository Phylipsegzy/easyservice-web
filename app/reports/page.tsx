"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { useLanguage } from "@/lib/i18n";
import { FileSpreadsheet, FileText, Search } from "lucide-react";

type Tab = "summary" | "country" | "transfers" | "customer" | "staff_statement" | "customer_funding" | "staff_funding";

export default function ReportsPage() {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<Tab>("summary");

  const [summary, setSummary] = useState<any>(null);
  const [countrySummary, setCountrySummary] = useState<any[] | null>(null);
  const [transfers, setTransfers] = useState<any[] | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  // Customer report tab
  const [isAdmin, setIsAdmin] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerReport, setCustomerReport] = useState<any>(null);
  const [customerReportError, setCustomerReportError] = useState("");
  const [customerReportLoading, setCustomerReportLoading] = useState(false);

  async function load(activeTab: Tab) {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;

      if (activeTab === "summary") {
        const res = await api.getReportSummary(params);
        setSummary(res.summary);
      } else if (activeTab === "country") {
        const res = await api.getCountrySummary();
        setCountrySummary(res.country_summary);
      } else if (activeTab === "transfers") {
        const res = await api.getTransferReport();
        setTransfers(res.transfers.data || res.transfers);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab !== "customer" && tab !== "staff_statement" && tab !== "customer_funding" && tab !== "staff_funding") load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    api.me().then((res) => setIsAdmin(res.user.role === "admin")).catch(() => {});
  }, []);

  useEffect(() => {
    if (!customerSearch.trim()) {
      setCustomerResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await api.getCustomers(customerSearch.trim(), { restrict_to_own_country: "1" });
      setCustomerResults(res.customers.data || res.customers);
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const [reportCurrencyId, setReportCurrencyId] = useState("");

  // Staff Statement tab
  const [myProfile, setMyProfile] = useState<any>(null);
  const [statementStaffList, setStatementStaffList] = useState<any[]>([]);
  const [statementStaffId, setStatementStaffId] = useState("");
  const [staffStatement, setStaffStatement] = useState<any>(null);
  const [staffStatementLoading, setStaffStatementLoading] = useState(false);
  const [staffStatementError, setStaffStatementError] = useState("");

  useEffect(() => {
    api.me().then(async (res) => {
      setMyProfile(res.user);
      if (res.user.role === "admin" || res.user.role === "manager") {
        const staffRes = await api.getStaff();
        const list = res.user.role === "admin"
          ? staffRes.staff
          : staffRes.staff.filter((s: any) => s.location?.toLowerCase() === res.user.location?.toLowerCase());
        setStatementStaffList(list);
      } else {
        setStatementStaffId(String(res.user.id));
      }
    }).catch(() => {});
  }, []);

  async function loadStaffStatement(staffId: number) {
    setStaffStatementLoading(true);
    setStaffStatementError("");
    try {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await api.getStaffStatements(staffId, params);
      setStaffStatement(res);
    } catch (err: any) {
      setStaffStatementError(err.message);
      setStaffStatement(null);
    } finally {
      setStaffStatementLoading(false);
    }
  }

  async function handleExportStaffStatementPdf() {
    if (!statementStaffId) return;
    setExporting("pdf");
    try {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const blob = await api.exportStaffStatementPdf(Number(statementStaffId), params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `staff-statement-${statementStaffId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setStaffStatementError(err.message);
    } finally {
      setExporting(null);
    }
  }

  function handleExportStaffStatementExcel() {
    if (!staffStatement) return;
    setExporting("excel");
    try {
      const rows = staffStatement.statements.data.map((r: any) => ({
        Details: r.details,
        Credit: r.credit_amount,
        Debit: r.debit_amount,
        Balance: r.balance,
        Date: new Date(r.created_at).toLocaleString(),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Statement");
      XLSX.writeFile(wb, `staff-statement-${staffStatement.staff.username}.xlsx`);
    } finally {
      setExporting(null);
    }
  }

  // Customer Funding/Expense tab
  const [fundingType, setFundingType] = useState<"all" | "fund" | "expense">("all");
  const [customerFundingSearch, setCustomerFundingSearch] = useState("");
  const [customerFunding, setCustomerFunding] = useState<any>(null);
  const [customerFundingLoading, setCustomerFundingLoading] = useState(false);
  const [customerFundingError, setCustomerFundingError] = useState("");

  async function loadCustomerFunding() {
    setCustomerFundingLoading(true);
    setCustomerFundingError("");
    try {
      const params: Record<string, string> = { type: fundingType };
      if (from) params.from = from;
      if (to) params.to = to;
      if (customerFundingSearch) params.customer_search = customerFundingSearch;
      const res = await api.getCustomerFundingReport(params);
      setCustomerFunding(res);
    } catch (err: any) {
      setCustomerFundingError(err.message);
      setCustomerFunding(null);
    } finally {
      setCustomerFundingLoading(false);
    }
  }

  // Live search — fires automatically 400ms after typing stops, once there
  // are at least 3 characters (or immediately when cleared back to empty).
  useEffect(() => {
    if (tab !== "customer_funding") return;
    if (customerFundingSearch.length > 0 && customerFundingSearch.length < 3) return;
    const timer = setTimeout(() => loadCustomerFunding(), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerFundingSearch]);

  function handleExportCustomerFundingExcel() {
    if (!customerFunding) return;
    setExporting("excel");
    try {
      const rows = customerFunding.rows.data.map((r: any) => ({
        Customer: r.customer_name,
        Country: r.customer_location,
        Type: r.description,
        Amount: r.amount,
        Currency: r.currency_code,
        Balance: r.customer_balance,
        Staff: r.staff_name,
        Remark: r.remark || "",
        Date: new Date(r.created_at).toLocaleString(),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Customer Funding");
      XLSX.writeFile(wb, `customer-funding-${fundingType}.xlsx`);
    } finally {
      setExporting(null);
    }
  }

  async function handleExportCustomerFundingPdf() {
    setExporting("pdf");
    try {
      const params: Record<string, string> = { type: fundingType };
      if (from) params.from = from;
      if (to) params.to = to;
      if (customerFundingSearch) params.customer_search = customerFundingSearch;
      const token = localStorage.getItem("easyservice_token");
      const qs = new URLSearchParams(params).toString();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiUrl}/reports/customer-funding-pdf?${qs}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "", "ngrok-skip-browser-warning": "true" },
      });
      if (!res.ok) throw new Error("Could not generate the report PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `customer-funding-${fundingType}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setCustomerFundingError(err.message);
    } finally {
      setExporting(null);
    }
  }

  // Staff Funding/Expense tab
  const [staffFundingType, setStaffFundingType] = useState<"all" | "fund" | "expense">("all");
  const [staffFundingSearch, setStaffFundingSearch] = useState("");
  const [staffFunding, setStaffFunding] = useState<any>(null);
  const [staffFundingLoading, setStaffFundingLoading] = useState(false);
  const [staffFundingError, setStaffFundingError] = useState("");

  async function loadStaffFunding() {
    setStaffFundingLoading(true);
    setStaffFundingError("");
    try {
      const params: Record<string, string> = { type: staffFundingType };
      if (from) params.from = from;
      if (to) params.to = to;
      if (staffFundingSearch) params.staff_search = staffFundingSearch;
      const res = await api.getStaffFundingReport(params);
      setStaffFunding(res);
    } catch (err: any) {
      setStaffFundingError(err.message);
      setStaffFunding(null);
    } finally {
      setStaffFundingLoading(false);
    }
  }

  useEffect(() => {
    if (tab !== "staff_funding") return;
    if (staffFundingSearch.length > 0 && staffFundingSearch.length < 3) return;
    const timer = setTimeout(() => loadStaffFunding(), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffFundingSearch]);

  function handleExportStaffFundingExcel() {
    if (!staffFunding) return;
    setExporting("excel");
    try {
      const rows = staffFunding.rows.data.map((r: any) => ({
        Staff: r.staff_name,
        Country: r.staff_location,
        Type: r.amount > 0 ? "Fund" : "Expense",
        Amount: Math.abs(r.amount),
        By: r.created_by_name,
        Remark: r.remark || "",
        Status: r.reversed_at ? "Reversed" : "Active",
        Date: new Date(r.created_at).toLocaleString(),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Staff Funding");
      XLSX.writeFile(wb, `staff-funding-${staffFundingType}.xlsx`);
    } finally {
      setExporting(null);
    }
  }

  async function handleExportStaffFundingPdf() {
    setExporting("pdf");
    try {
      const params: Record<string, string> = { type: staffFundingType };
      if (from) params.from = from;
      if (to) params.to = to;
      if (staffFundingSearch) params.staff_search = staffFundingSearch;
      const token = localStorage.getItem("easyservice_token");
      const qs = new URLSearchParams(params).toString();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiUrl}/reports/staff-funding-pdf?${qs}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "", "ngrok-skip-browser-warning": "true" },
      });
      if (!res.ok) throw new Error("Could not generate the report PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `staff-funding-${staffFundingType}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setStaffFundingError(err.message);
    } finally {
      setExporting(null);
    }
  }

  useEffect(() => {
    if (tab === "customer_funding") loadCustomerFunding();
    if (tab === "staff_funding") loadStaffFunding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function loadCustomerReport(customerId: number, currencyId?: string) {
    setCustomerReportLoading(true);
    setCustomerReportError("");
    try {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;
      if (currencyId) params.currency_id = currencyId;
      const res = await api.getCustomerMonthlyReport(customerId, params);
      setCustomerReport(res);
    } catch (err: any) {
      setCustomerReportError(err.message);
      setCustomerReport(null);
    } finally {
      setCustomerReportLoading(false);
    }
  }

  async function handleExportCustomerPdf() {
    if (!selectedCustomer) return;
    setExporting("pdf");
    try {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;
      if (reportCurrencyId) params.currency_id = reportCurrencyId;
      const blob = await api.exportCustomerMonthlyPdf(selectedCustomer.id, params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `customer-report-${selectedCustomer.customer_name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setCustomerReportError(err.message);
    } finally {
      setExporting(null);
    }
  }

  function handleExportCustomerExcel() {
    if (!customerReport) return;
    setExporting("excel");
    try {
      const rows = customerReport.rows.map((r: any, i: number) => ({
        "#": i + 1,
        Ref: r.ref,
        Sending: r.sending_country || "—",
        Receiving: r.receiving_country || "—",
        "Amt Sent (Debit)": r.debit_amount,
        Rate: r.rate,
        "Amt Received": r.total,
        "Wallet Fund (Credit)": r.credit_amount,
        "Wallet Bal": r.wallet_balance,
        Description: r.description || "—",
        Date: new Date(r.event_date).toLocaleString(),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Customer Report");
      XLSX.writeFile(wb, `customer-report-${selectedCustomer?.customer_name || "export"}.xlsx`);
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
      const blob = await api.exportReportPdf(tab, params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tab}-report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExporting(null);
    }
  }

  function handleExportExcel() {
    setExporting("excel");
    try {
      let rows: any[] = [];
      if (tab === "summary" && summary) {
        rows = summary.by_country.map((r: any) => ({
          Country: r.country,
          Transactions: r.tranx_count,
          "Total received": r.total_subtotal,
        }));
      } else if (tab === "country" && countrySummary) {
        rows = countrySummary.map((r: any) => ({
          Country: r.country,
          "Staff wallet holdings": r.total_wallet,
          "Pending payouts": r.total_pending,
          "Pending count": r.pending_count,
        }));
      } else if (tab === "transfers" && transfers) {
        rows = transfers.map((t: any) => ({
          Date: new Date(t.created_at).toLocaleString(),
          Sender: t.sender_name,
          Receiver: t.receiver_name,
          Amount: t.amount,
          Currency: t.currency_symbol,
          Status: t.status,
        }));
      }
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, tab);
      XLSX.writeFile(wb, `${tab}-report.xlsx`);
    } finally {
      setExporting(null);
    }
  }

  const card = (label: string, value: any) => (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value ?? 0}</div>
    </div>
  );

  const tabLabel: Record<Tab, string> = {
    summary: lang === "ar" ? "الملخص" : "Summary",
    country: lang === "ar" ? "ملخص الدولة" : "Country Summary",
    transfers: lang === "ar" ? "تقرير التحويلات" : "Transfer Report",
    customer: lang === "ar" ? "تقرير العميل" : "Customer Report",
    staff_statement: lang === "ar" ? "كشف حساب الموظف" : "Staff Statement",
    customer_funding: lang === "ar" ? "تمويل/مصروفات العملاء" : "Customer Funding/Expense",
    staff_funding: lang === "ar" ? "تمويل/مصروفات الموظفين" : "Staff Funding/Expense",
  };

  return (
    <AppShell title={lang === "ar" ? "التقارير" : "Reports"} subtitle={lang === "ar" ? "نظرة عامة على أداء الأعمال" : "Business performance overview"}>
      <div className="flex gap-2 mb-5 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(["summary", "country", "transfers", "customer", "staff_statement", "customer_funding", "staff_funding"] as Tab[]).map((tb) => (
            <button key={tb} onClick={() => setTab(tb)} className={tab === tb ? "btn" : "btn-ghost"}>
              {tabLabel[tb]}
            </button>
          ))}
        </div>
        {tab !== "customer" && tab !== "staff_statement" && tab !== "customer_funding" && tab !== "staff_funding" && (
          <div className="flex gap-2">
            <button onClick={handleExportExcel} disabled={exporting !== null} className="btn-outline flex items-center gap-1.5">
              <FileSpreadsheet size={15} /> {lang === "ar" ? "تصدير Excel" : "Export Excel"}
            </button>
            <button onClick={handleExportPdf} disabled={exporting !== null} className="btn-outline flex items-center gap-1.5">
              <FileText size={15} /> {exporting === "pdf" ? (lang === "ar" ? "جارٍ الإنشاء..." : "Generating...") : lang === "ar" ? "تصدير PDF" : "Export PDF"}
            </button>
          </div>
        )}
      </div>

      {tab !== "country" && tab !== "customer" && tab !== "staff_statement" && tab !== "customer_funding" && tab !== "staff_funding" && (
        <div className="flex gap-2 mb-6 items-end flex-wrap">
          <div>
            <label className="label">{lang === "ar" ? "من" : "From"}</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">{lang === "ar" ? "إلى" : "To"}</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" />
          </div>
          <button onClick={() => load(tab)} className="btn">{lang === "ar" ? "تطبيق" : "Apply"}</button>
        </div>
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading ? (
        <p className="text-slate-400 text-sm">{t("loading")}</p>
      ) : (
        <>
          {tab === "summary" && summary && (
            <>
              <div className="flex gap-3 mb-3 flex-wrap">
                {card(lang === "ar" ? "المعاملات" : "Transactions", summary.totals.total_transactions)}
                {card(lang === "ar" ? "معلقة" : "Pending", summary.totals.pending_count)}
                {card(lang === "ar" ? "مكتملة" : "Completed", summary.totals.completed_count)}
              </div>
              <div className="flex gap-3 mb-8 flex-wrap">
                {card(lang === "ar" ? "إجمالي المبلغ المرسل" : "Total amount sent", Number(summary.totals.total_amount || 0).toLocaleString())}
                {card(lang === "ar" ? "العمولة المكتسبة" : "Commission earned", Number(summary.totals.total_benefit || 0).toLocaleString())}
                {card(lang === "ar" ? "إجمالي محافظ الموظفين" : "Total staff wallets", Number(summary.total_staff_wallets || 0).toLocaleString())}
                {card(lang === "ar" ? "التحويلات المعلقة" : "Pending transfers", summary.pending_transfers)}
              </div>

              <h2 className="text-base font-semibold mb-2">{lang === "ar" ? "حسب بلد الوجهة" : "By destination country"}</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{lang === "ar" ? "الدولة" : "Country"}</th>
                      <th>{lang === "ar" ? "المعاملات" : "Transactions"}</th>
                      <th>{lang === "ar" ? "إجمالي المستلم" : "Total received"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.by_country.map((row: any) => (
                      <tr key={row.country}>
                        <td className="font-medium">{row.country}</td>
                        <td>{row.tranx_count}</td>
                        <td>{Number(row.total_subtotal).toLocaleString()}</td>
                      </tr>
                    ))}
                    {summary.by_country.length === 0 && (
                      <tr><td colSpan={3} className="text-center text-slate-400 py-8">{lang === "ar" ? "لا توجد بيانات لهذه الفترة." : "No data for this period."}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "country" && countrySummary && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{lang === "ar" ? "الدولة" : "Country"}</th>
                    <th>{lang === "ar" ? "أرصدة محافظ الموظفين" : "Staff wallet holdings"}</th>
                    <th>{lang === "ar" ? "المدفوعات المعلقة" : "Pending payouts"}</th>
                    <th>{lang === "ar" ? "عدد المعلق" : "Pending count"}</th>
                  </tr>
                </thead>
                <tbody>
                  {countrySummary
                    .filter((r) => Number(r.total_wallet) !== 0 || Number(r.total_pending) !== 0)
                    .map((r) => (
                      <tr key={r.country}>
                        <td className="font-medium">{r.country}</td>
                        <td>{Number(r.total_wallet).toLocaleString()}</td>
                        <td>{Number(r.total_pending).toLocaleString()}</td>
                        <td>{r.pending_count}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "transfers" && transfers && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{lang === "ar" ? "التاريخ" : "Date"}</th>
                    <th>{lang === "ar" ? "المرسل" : "Sender"}</th>
                    <th>{lang === "ar" ? "المستلم" : "Receiver"}</th>
                    <th>{lang === "ar" ? "المبلغ" : "Amount"}</th>
                    <th>{t("status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((tr: any) => (
                    <tr key={tr.id}>
                      <td className="whitespace-nowrap text-xs text-slate-500">{new Date(tr.created_at).toLocaleString()}</td>
                      <td>{tr.sender_name}</td>
                      <td>{tr.receiver_name}</td>
                      <td>{Number(tr.amount).toLocaleString()} {tr.currency_symbol}</td>
                      <td><span className={`badge badge-${tr.status === "completed" ? "completed" : tr.status === "reversed" ? "inactive" : "pending"}`}>{tr.status}</span></td>
                    </tr>
                  ))}
                  {transfers.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-slate-400 py-8">{lang === "ar" ? "لا توجد تحويلات لهذه الفترة." : "No transfers for this period."}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "customer" && (
        <div>
          <p className="text-xs text-slate-400 mb-3">
            {isAdmin
              ? (lang === "ar" ? "يمكنك اختيار أي عميل." : "You can select any customer.")
              : (lang === "ar" ? "يمكنك فقط اختيار عملاء من نفس بلدك." : "You can only select customers in your own country.")}
          </p>

          {!selectedCustomer ? (
            <div className="relative max-w-sm mb-6">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder={lang === "ar" ? "بحث عن عميل بالاسم أو الهاتف..." : "Search customer by name or phone..."}
                className="input w-full pl-9"
              />
              {customerResults.length > 0 && (
                <div className="absolute z-20 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {customerResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCustomerSearch("");
                        setCustomerResults([]);
                        loadCustomerReport(c.id);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                    >
                      <div className="font-semibold text-sm">{c.customer_name}</div>
                      <div className="text-xs text-slate-400">{c.country_code} {c.phone} · {c.location || "—"}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 mb-6 max-w-sm">
              <div>
                <div className="font-semibold text-sm">{selectedCustomer.customer_name}</div>
                <div className="text-xs text-slate-500">{selectedCustomer.country_code} {selectedCustomer.phone}</div>
              </div>
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setCustomerReport(null);
                  setReportCurrencyId("");
                }}
                className="text-xs font-semibold text-teal-700"
              >
                {lang === "ar" ? "تغيير" : "Change"}
              </button>
            </div>
          )}

          {selectedCustomer && (
            <>
              <div className="flex gap-2 mb-6 items-end flex-wrap">
                {(selectedCustomer.wallets || []).length > 1 && (
                  <div>
                    <label className="label">{lang === "ar" ? "المحفظة" : "Wallet"}</label>
                    <select value={reportCurrencyId} onChange={(e) => setReportCurrencyId(e.target.value)} className="input">
                      <option value="">{lang === "ar" ? "كل المحافظ" : "All wallets"}</option>
                      {selectedCustomer.wallets.map((w: any) => (
                        <option key={w.currency_id} value={w.currency_id}>{w.currency?.country} ({w.currency?.currency_code})</option>
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
                <button onClick={() => loadCustomerReport(selectedCustomer.id, reportCurrencyId || undefined)} className="btn">
                  {lang === "ar" ? "تطبيق" : "Apply"}
                </button>
                <button onClick={handleExportCustomerExcel} disabled={exporting !== null || !customerReport} className="btn-outline flex items-center gap-1.5">
                  <FileSpreadsheet size={15} /> {lang === "ar" ? "تصدير Excel" : "Export Excel"}
                </button>
                <button onClick={handleExportCustomerPdf} disabled={exporting !== null} className="btn-outline flex items-center gap-1.5">
                  <FileText size={15} /> {exporting === "pdf" ? (lang === "ar" ? "جارٍ الإنشاء..." : "Generating...") : lang === "ar" ? "تصدير PDF" : "Export PDF"}
                </button>
              </div>

              {customerReportError && <p className="text-red-600 text-sm mb-4">{customerReportError}</p>}

              {customerReportLoading ? (
                <p className="text-slate-400 text-sm">{t("loading")}</p>
              ) : customerReport ? (
                <>
                  <div className="flex gap-3 mb-6 flex-wrap">
                    {card(lang === "ar" ? "الرصيد الحالي" : "Current Wallet Balance", Number(customerReport.totals.current_wallet_balance).toLocaleString())}
                    {card(lang === "ar" ? "إجمالي المرسل" : "Total Amt Sent", Number(customerReport.totals.total_amount_sent).toLocaleString())}
                    {card(lang === "ar" ? "إجمالي المستلم" : "Total Amt Received", Number(customerReport.totals.total_amount_received).toLocaleString())}
                    {card(lang === "ar" ? "المسترد" : "Total Reversed", Number(customerReport.totals.total_reversed).toLocaleString())}
                    {card(lang === "ar" ? "تمويل المحفظة" : "Total Wallet Funded", Number(customerReport.totals.total_wallet_funded).toLocaleString())}
                  </div>

                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Ref</th>
                          <th>{lang === "ar" ? "الممر" : "Corridor"}</th>
                          <th>{lang === "ar" ? "المبلغ المرسل (مدين)" : "Amt Sent (Debit)"}</th>
                          <th>{lang === "ar" ? "المبلغ المستلم" : "Amt Received"}</th>
                          <th>{lang === "ar" ? "تمويل المحفظة (دائن)" : "Wallet Fund (Credit)"}</th>
                          <th>{lang === "ar" ? "رصيد المحفظة" : "Wallet Bal"}</th>
                          <th>{lang === "ar" ? "الوصف" : "Description"}</th>
                          <th>{t("date")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerReport.rows.map((r: any, i: number) => (
                          <tr key={`${r.row_type}-${r.id}`}>
                            <td>{i + 1}</td>
                            <td className="font-mono text-xs">{r.ref}</td>
                            <td>{r.sending_country ? `${r.sending_country} → ${r.receiving_country}` : "—"}</td>
                            <td className="text-red-600">{r.debit_amount !== null ? Number(r.debit_amount).toLocaleString() : "—"}</td>
                            <td>{r.total !== null ? Number(r.total).toLocaleString() : "—"}</td>
                            <td className="text-emerald-600">{r.credit_amount !== null ? Number(r.credit_amount).toLocaleString() : "—"}</td>
                            <td>{r.wallet_balance !== null ? Number(r.wallet_balance).toLocaleString() : "—"}</td>
                            <td className="text-slate-500">{r.description || "—"}</td>
                            <td className="whitespace-nowrap text-xs text-slate-500">{new Date(r.event_date).toLocaleString()}</td>
                          </tr>
                        ))}
                        {customerReport.rows.length === 0 && (
                          <tr><td colSpan={9} className="text-center text-slate-400 py-8">{lang === "ar" ? "لا توجد سجلات لهذه الفترة." : "No records for this period."}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
      )}

      {tab === "staff_statement" && (
        <div>
          {(myProfile?.role === "admin" || myProfile?.role === "manager") && (
            <div className="flex gap-2 mb-6 items-end flex-wrap">
              <div>
                <label className="label">{lang === "ar" ? "الموظف" : "Staff member"}</label>
                <select value={statementStaffId} onChange={(e) => setStatementStaffId(e.target.value)} className="input">
                  <option value="">{lang === "ar" ? "اختر" : "Select"}</option>
                  {myProfile?.role === "manager" && (
                    <option value={myProfile.id}>{lang === "ar" ? "أنا" : "Myself"}</option>
                  )}
                  {statementStaffList.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.username})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{lang === "ar" ? "من" : "From"}</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">{lang === "ar" ? "إلى" : "To"}</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" />
              </div>
              <button onClick={() => statementStaffId && loadStaffStatement(Number(statementStaffId))} disabled={!statementStaffId} className="btn">
                {lang === "ar" ? "تطبيق" : "Apply"}
              </button>
              <button onClick={handleExportStaffStatementExcel} disabled={exporting !== null || !staffStatement} className="btn-outline flex items-center gap-1.5">
                <FileSpreadsheet size={15} /> {lang === "ar" ? "تصدير Excel" : "Export Excel"}
              </button>
              <button onClick={handleExportStaffStatementPdf} disabled={exporting !== null || !statementStaffId} className="btn-outline flex items-center gap-1.5">
                <FileText size={15} /> {exporting === "pdf" ? "..." : lang === "ar" ? "تصدير PDF" : "Export PDF"}
              </button>
            </div>
          )}

          {myProfile && myProfile.role !== "admin" && myProfile.role !== "manager" && (
            <div className="flex gap-2 mb-6 items-end flex-wrap">
              <div>
                <label className="label">{lang === "ar" ? "من" : "From"}</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">{lang === "ar" ? "إلى" : "To"}</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" />
              </div>
              <button onClick={() => loadStaffStatement(myProfile.id)} className="btn">{lang === "ar" ? "تطبيق" : "Apply"}</button>
              <button onClick={handleExportStaffStatementExcel} disabled={exporting !== null || !staffStatement} className="btn-outline flex items-center gap-1.5">
                <FileSpreadsheet size={15} /> {lang === "ar" ? "تصدير Excel" : "Export Excel"}
              </button>
              <button onClick={handleExportStaffStatementPdf} disabled={exporting !== null} className="btn-outline flex items-center gap-1.5">
                <FileText size={15} /> {exporting === "pdf" ? "..." : lang === "ar" ? "تصدير PDF" : "Export PDF"}
              </button>
            </div>
          )}

          {staffStatementError && <p className="text-red-600 text-sm mb-4">{staffStatementError}</p>}
          {staffStatementLoading ? (
            <p className="text-slate-400 text-sm">{t("loading")}</p>
          ) : staffStatement ? (
            <>
              <div className="flex gap-3 mb-6 flex-wrap">
                {card(lang === "ar" ? "الرصيد الحالي" : "Current wallet", Number(staffStatement.staff.wallet).toLocaleString())}
                {card(lang === "ar" ? "إجمالي الوارد" : "Total in", Number(staffStatement.totals.total_in).toLocaleString())}
                {card(lang === "ar" ? "إجمالي الصادر" : "Total out", Number(staffStatement.totals.total_out).toLocaleString())}
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{lang === "ar" ? "التفاصيل" : "Details"}</th>
                      <th>{lang === "ar" ? "دائن" : "Credit"}</th>
                      <th>{lang === "ar" ? "مدين" : "Debit"}</th>
                      <th>{lang === "ar" ? "الرصيد" : "Balance"}</th>
                      <th>{t("date")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffStatement.statements.data.map((r: any) => (
                      <tr key={r.id}>
                        <td>{r.details}</td>
                        <td className="text-emerald-600">{r.credit_amount > 0 ? Number(r.credit_amount).toLocaleString() : "—"}</td>
                        <td className="text-red-600">{r.debit_amount > 0 ? Number(r.debit_amount).toLocaleString() : "—"}</td>
                        <td>{Number(r.balance).toLocaleString()}</td>
                        <td className="whitespace-nowrap text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {staffStatement.statements.data.length === 0 && (
                      <tr><td colSpan={5} className="text-center text-slate-400 py-8">{lang === "ar" ? "لا توجد سجلات." : "No records."}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      )}

      {tab === "customer_funding" && (
        <div>
          <div className="flex gap-2 mb-6 items-end flex-wrap">
            <div>
              <label className="label">{lang === "ar" ? "بحث بالاسم أو الهاتف" : "Search name or phone"}</label>
              <input
                value={customerFundingSearch}
                onChange={(e) => setCustomerFundingSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadCustomerFunding()}
                placeholder={lang === "ar" ? "اسم العميل أو رقم الهاتف..." : "Customer name or phone..."}
                className="input w-56"
              />
            </div>
            <div>
              <label className="label">{lang === "ar" ? "النوع" : "Type"}</label>
              <select value={fundingType} onChange={(e) => setFundingType(e.target.value as "all" | "fund" | "expense")} className="input">
                <option value="all">{lang === "ar" ? "الكل" : "All"}</option>
                <option value="fund">{lang === "ar" ? "تمويل فقط" : "Funding only"}</option>
                <option value="expense">{lang === "ar" ? "مصروفات فقط" : "Expense only"}</option>
              </select>
            </div>
            <div>
              <label className="label">{lang === "ar" ? "من" : "From"}</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">{lang === "ar" ? "إلى" : "To"}</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" />
            </div>
            <button onClick={loadCustomerFunding} className="btn">{lang === "ar" ? "تطبيق" : "Apply"}</button>
            <button onClick={handleExportCustomerFundingExcel} disabled={exporting !== null || !customerFunding} className="btn-outline flex items-center gap-1.5">
              <FileSpreadsheet size={15} /> {lang === "ar" ? "تصدير Excel" : "Export Excel"}
            </button>
            <button onClick={handleExportCustomerFundingPdf} disabled={exporting !== null} className="btn-outline flex items-center gap-1.5">
              <FileText size={15} /> {exporting === "pdf" ? "..." : lang === "ar" ? "تصدير PDF" : "Export PDF"}
            </button>
          </div>

          {myProfile && myProfile.role !== "admin" && (
            <p className="text-xs text-slate-400 mb-4">
              {lang === "ar" ? "يظهر فقط عملاء بلدك." : "Only showing customers in your own country."}
            </p>
          )}

          {customerFundingError && <p className="text-red-600 text-sm mb-4">{customerFundingError}</p>}
          {customerFundingLoading ? (
            <p className="text-slate-400 text-sm">{t("loading")}</p>
          ) : customerFunding ? (
            <>
              <div className="flex gap-3 mb-6 flex-wrap">
                {card(lang === "ar" ? "إجمالي التمويل" : "Total funded", Number(customerFunding.totals.total_funded).toLocaleString())}
                {card(lang === "ar" ? "إجمالي المصروفات" : "Total expensed", Number(customerFunding.totals.total_expensed).toLocaleString())}
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t("customer")}</th>
                      <th>{lang === "ar" ? "البلد" : "Country"}</th>
                      <th>{lang === "ar" ? "النوع" : "Type"}</th>
                      <th>{t("amount")}</th>
                      <th>{lang === "ar" ? "الرصيد" : "Balance"}</th>
                      <th>{lang === "ar" ? "الموظف" : "Staff"}</th>
                      <th>{t("date")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerFunding.rows.data.map((r: any) => (
                      <tr key={r.id}>
                        <td className="font-medium">{r.customer_name}</td>
                        <td className="text-slate-500">{r.customer_location || "—"}</td>
                        <td>
                          <span className={`badge ${r.description === "Customer wallet funding" ? "badge-completed" : "badge-inactive"}`}>
                            {r.description === "Customer wallet funding" ? (lang === "ar" ? "تمويل" : "Fund") : (lang === "ar" ? "مصروف" : "Expense")}
                          </span>
                        </td>
                        <td className={Number(r.amount) > 0 ? "text-emerald-600" : "text-red-600"}>
                          {r.symbol} {Math.abs(Number(r.amount)).toLocaleString()}
                        </td>
                        <td>{r.symbol} {Number(r.customer_balance).toLocaleString()}</td>
                        <td className="text-slate-500">{r.staff_name || "—"}</td>
                        <td className="whitespace-nowrap text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {customerFunding.rows.data.length === 0 && (
                      <tr><td colSpan={7} className="text-center text-slate-400 py-8">{lang === "ar" ? "لا توجد سجلات لهذه الفترة." : "No records for this period."}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      )}

      {tab === "staff_funding" && (
        <div>
          <div className="flex gap-2 mb-6 items-end flex-wrap">
            <div>
              <label className="label">{lang === "ar" ? "بحث بالاسم" : "Search staff"}</label>
              <input
                value={staffFundingSearch}
                onChange={(e) => setStaffFundingSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadStaffFunding()}
                placeholder={lang === "ar" ? "اسم الموظف أو اسم المستخدم..." : "Staff name or username..."}
                className="input w-56"
              />
            </div>
            <div>
              <label className="label">{lang === "ar" ? "النوع" : "Type"}</label>
              <select value={staffFundingType} onChange={(e) => setStaffFundingType(e.target.value as "all" | "fund" | "expense")} className="input">
                <option value="all">{lang === "ar" ? "الكل" : "All"}</option>
                <option value="fund">{lang === "ar" ? "تمويل فقط" : "Funding only"}</option>
                <option value="expense">{lang === "ar" ? "مصروفات فقط" : "Expense only"}</option>
              </select>
            </div>
            <div>
              <label className="label">{lang === "ar" ? "من" : "From"}</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">{lang === "ar" ? "إلى" : "To"}</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" />
            </div>
            <button onClick={loadStaffFunding} className="btn">{lang === "ar" ? "تطبيق" : "Apply"}</button>
            <button onClick={handleExportStaffFundingExcel} disabled={exporting !== null || !staffFunding} className="btn-outline flex items-center gap-1.5">
              <FileSpreadsheet size={15} /> {lang === "ar" ? "تصدير Excel" : "Export Excel"}
            </button>
            <button onClick={handleExportStaffFundingPdf} disabled={exporting !== null} className="btn-outline flex items-center gap-1.5">
              <FileText size={15} /> {exporting === "pdf" ? "..." : lang === "ar" ? "تصدير PDF" : "Export PDF"}
            </button>
          </div>

          {myProfile && myProfile.role !== "admin" && (
            <p className="text-xs text-slate-400 mb-4">
              {lang === "ar" ? "يظهر فقط موظفو بلدك." : "Only showing staff in your own country."}
            </p>
          )}

          {staffFundingError && <p className="text-red-600 text-sm mb-4">{staffFundingError}</p>}
          {staffFundingLoading ? (
            <p className="text-slate-400 text-sm">{t("loading")}</p>
          ) : staffFunding ? (
            <>
              <div className="flex gap-3 mb-6 flex-wrap">
                {card(lang === "ar" ? "إجمالي التمويل" : "Total funded", Number(staffFunding.totals.total_funded).toLocaleString())}
                {card(lang === "ar" ? "إجمالي المصروفات" : "Total expensed", Number(staffFunding.totals.total_expensed).toLocaleString())}
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{lang === "ar" ? "الموظف" : "Staff"}</th>
                      <th>{lang === "ar" ? "البلد" : "Country"}</th>
                      <th>{lang === "ar" ? "النوع" : "Type"}</th>
                      <th>{t("amount")}</th>
                      <th>{lang === "ar" ? "بواسطة" : "By"}</th>
                      <th>{lang === "ar" ? "الحالة" : "Status"}</th>
                      <th>{t("date")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffFunding.rows.data.map((r: any) => (
                      <tr key={r.id}>
                        <td className="font-medium">{r.staff_name}</td>
                        <td className="text-slate-500">{r.staff_location || "—"}</td>
                        <td>
                          <span className={`badge ${Number(r.amount) > 0 ? "badge-completed" : "badge-inactive"}`}>
                            {Number(r.amount) > 0 ? (lang === "ar" ? "تمويل" : "Fund") : (lang === "ar" ? "مصروف" : "Expense")}
                          </span>
                        </td>
                        <td className={Number(r.amount) > 0 ? "text-emerald-600" : "text-red-600"}>
                          {Math.abs(Number(r.amount)).toLocaleString()}
                        </td>
                        <td className="text-slate-500">{r.created_by_name || "—"}</td>
                        <td>
                          {r.reversed_at ? (
                            <span className="badge badge-inactive">{lang === "ar" ? "ملغى" : "Reversed"}</span>
                          ) : (
                            <span className="badge badge-active">{lang === "ar" ? "نشط" : "Active"}</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {staffFunding.rows.data.length === 0 && (
                      <tr><td colSpan={7} className="text-center text-slate-400 py-8">{lang === "ar" ? "لا توجد سجلات لهذه الفترة." : "No records for this period."}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}
