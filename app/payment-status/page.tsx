"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import SearchInput from "@/components/SearchInput";
import { useLanguage } from "@/lib/i18n";

export default function PaymentStatusPage() {
  const { lang, t } = useLanguage();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [partRowId, setPartRowId] = useState<number | null>(null);
  const [partAmount, setPartAmount] = useState("");

  async function load(status: string, searchValue?: string) {
    setLoading(true);
    try {
      const params: Record<string, string> = { scope: "payout" };
      if (status) params.payment_status = status;
      if (searchValue) params.search = searchValue;
      const res = await api.getTransactions(params);
      setTransactions(res.transactions.data || res.transactions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => load(statusFilter, search || undefined), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleFullPayout(id: number) {
    setCompletingId(id);
    setError("");
    try {
      await api.recordPayout(id, { payment_type: "full" });
      load(statusFilter, search || undefined);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCompletingId(null);
    }
  }

  async function handlePartPayout(id: number) {
    if (!partAmount) return;
    setCompletingId(id);
    setError("");
    try {
      await api.recordPayout(id, { payment_type: "part", amount: parseFloat(partAmount) });
      setPartRowId(null);
      setPartAmount("");
      load(statusFilter, search || undefined);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCompletingId(null);
    }
  }

  const totalOwed = transactions.reduce((sum, tx) => sum + Number(tx.balance || 0), 0);

  return (
    <AppShell title={t("payment_status")} subtitle={lang === "ar" ? "حالة الدفع — هل استلم المستفيد المبلغ فعليًا؟" : "Payout status — has the receiver actually been paid?"}>
      <div className="flex gap-2 mb-5">
        {["pending", "part paid", "completed", ""].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={statusFilter === s ? "btn" : "btn-ghost"}>
            {s === "" ? (lang === "ar" ? "الكل" : "All") : s === "pending" ? (lang === "ar" ? "بانتظار الدفع" : "Awaiting payout") : s === "part paid" ? (lang === "ar" ? "مدفوع جزئيًا" : "Part paid") : (lang === "ar" ? "تم الدفع" : "Paid out")}
          </button>
        ))}
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder={lang === "ar" ? "بحث بالعميل أو المستلم أو المرجع..." : "Search by customer, receiver, or reference..."} />

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="stat-card">
          <div className="stat-label">{lang === "ar" ? "الفواتير المعروضة" : "Invoices shown"}</div>
          <div className="stat-value">{transactions.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{lang === "ar" ? "إجمالي المستحق على العملاء (من هذه)" : "Total still owed by customers (of these)"}</div>
          <div className="stat-value">{totalOwed.toLocaleString()}</div>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading ? (
        <p className="text-slate-400 text-sm">{t("loading")}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{lang === "ar" ? "المرجع" : "Ref"}</th>
                <th>{t("customer")}</th>
                <th>{lang === "ar" ? "الممر" : "Corridor"}</th>
                <th>{lang === "ar" ? "الإجمالي (يستلمه المستفيد)" : "Total (receiver gets)"}</th>
                <th>{lang === "ar" ? "الرصيد المستحق" : "Balance owed"}</th>
                <th>{lang === "ar" ? "ملاحظات" : "Notes"}</th>
                <th>{lang === "ar" ? "حالة الدفع" : "Payout status"}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="font-mono text-xs">{tx.tranx_ref}</td>
                  <td>{tx.customer_name}</td>
                  <td>{tx.country1?.country || "—"} &rarr; {tx.country2?.country || "—"}</td>
                  <td>{Number(tx.total).toLocaleString()}</td>
                  <td className={Number(tx.balance) > 0 ? "font-semibold text-amber-700" : "text-slate-400"}>
                    {Number(tx.balance).toLocaleString()}
                  </td>
                  <td className="text-slate-500 text-xs max-w-[220px] whitespace-normal break-words">{tx.notes || "—"}</td>
                  <td><span className={`badge badge-${tx.payment_status2?.replace(" ", "-") || tx.payment_status?.replace(" ", "-")}`}>{tx.payment_status2 || tx.payment_status}</span></td>
                  <td>
                    <div className="flex gap-2 items-center flex-wrap">
                      <Link href={`/transactions/${tx.id}`} className="font-semibold">{t("view")}</Link>
                      {tx.payment_status2 !== "completed" && partRowId !== tx.id && (
                        <>
                          <button
                            onClick={() => handleFullPayout(tx.id)}
                            disabled={completingId === tx.id}
                            className="btn-ghost"
                          >
                            {completingId === tx.id ? (lang === "ar" ? "جارٍ..." : "...") : (lang === "ar" ? "دفع كامل" : "Pay out in full")}
                          </button>
                          <button onClick={() => setPartRowId(tx.id)} className="btn-ghost">
                            {lang === "ar" ? "دفع جزئي" : "Part payment"}
                          </button>
                        </>
                      )}
                      {partRowId === tx.id && (
                        <>
                          <input
                            type="number"
                            step="0.0001"
                            value={partAmount}
                            onChange={(e) => setPartAmount(e.target.value)}
                            placeholder={lang === "ar" ? "المبلغ" : "Amount"}
                            className="input w-24 py-1"
                            autoFocus
                          />
                          <button
                            onClick={() => handlePartPayout(tx.id)}
                            disabled={completingId === tx.id || !partAmount}
                            className="btn-ghost"
                          >
                            {lang === "ar" ? "تأكيد" : "Confirm"}
                          </button>
                          <button
                            onClick={() => { setPartRowId(null); setPartAmount(""); }}
                            className="text-xs text-slate-400"
                          >
                            {t("cancel")}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={7} className="text-center text-slate-400 py-8">{lang === "ar" ? "لا يوجد شيء هنا." : "Nothing here."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
