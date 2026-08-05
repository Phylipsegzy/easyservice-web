"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import TransactionReceiptCard from "@/components/TransactionReceiptCard";
import ReceiptActions from "@/components/ReceiptActions";

export default function TransactionReceiptPage() {
  const params = useParams();
  const id = Number(params.id);
  const [transaction, setTransaction] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getReceiptData(id).then((res) => setTransaction(res.transaction)).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600 text-sm">{error}</div>;
  if (!transaction) return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-10 px-4 gap-5">
      <div className="w-full max-w-md">
        <TransactionReceiptCard transaction={transaction} />
      </div>
      <div className="w-full max-w-md">
        <ReceiptActions targetId="receipt-card" filename={`receipt-${transaction.tranx_ref}.png`} shareTitle={`Receipt ${transaction.tranx_ref}`} />
      </div>
    </div>
  );
}
