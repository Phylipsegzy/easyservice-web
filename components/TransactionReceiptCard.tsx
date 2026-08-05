"use client";

export default function TransactionReceiptCard({ transaction }: { transaction: any }) {
  const completed = transaction.payment_status === "completed";

  return (
    <div id="receipt-card" className="bg-white rounded-2xl shadow-lg w-full p-6" style={{ fontFamily: "system-ui, sans-serif" }}>
      <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
        <div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-bold text-sm mb-2">ES</div>
          <h1 className="text-lg font-bold text-slate-900">EasyService</h1>
          <p className="text-xs text-slate-400">Transaction Receipt</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm font-bold">{transaction.tranx_ref}</p>
          <p className="text-xs text-slate-400">{new Date(transaction.created_at).toLocaleString()}</p>
          <span className={`inline-block mt-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${completed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {completed ? "COMPLETED" : "PENDING"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <div className="text-[11px] font-semibold uppercase text-slate-400">Sender</div>
          <div className="font-medium">{transaction.customer_name}</div>
          <div className="text-xs text-slate-400">{transaction.country_code} {transaction.phone}</div>
        </div>
        {transaction.receiver_name && (
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Receiver</div>
            <div className="font-medium">{transaction.receiver_name}</div>
            <div className="text-xs text-slate-400">{transaction.receiver_phone}</div>
          </div>
        )}
      </div>

      {[
        ["Sending country", `${transaction.country1?.country || "—"} (${transaction.country1?.currency_code || ""})`],
        ["Receiving country", `${transaction.country2?.country || "—"} (${transaction.country2?.currency_code || ""})`],
        ["Amount sent", Number(transaction.amount).toLocaleString()],
        ["Rate applied", transaction.rate],
        ["Amount receiver gets", Number(transaction.total).toLocaleString()],
        ["Advance paid", Number(transaction.advance).toLocaleString()],
      ].map(([label, value]) => (
        <div key={label} className="flex justify-between py-1.5 text-sm border-b border-slate-50">
          <span className="text-slate-500">{label}</span>
          <strong className="text-slate-900">{value}</strong>
        </div>
      ))}
      <div className="flex justify-between py-2 text-sm mt-1">
        <span className="font-bold text-slate-900">Balance outstanding</span>
        <strong className="text-teal-700">{Number(transaction.balance).toLocaleString()}</strong>
      </div>

      {transaction.notes && (
        <p className="text-xs text-slate-400 italic mt-3">Note: {transaction.notes}</p>
      )}

      <p className="text-center text-[11px] text-slate-400 mt-6 pt-4 border-t border-slate-100">
        System-generated receipt — EasyService
      </p>
    </div>
  );
}
