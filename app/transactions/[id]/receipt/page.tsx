"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import TransactionReceiptCard from "@/components/TransactionReceiptCard";
import ReceiptActions from "@/components/ReceiptActions";
import { Home } from "lucide-react";

export default function TransactionReceiptPage() {
  const params = useParams();
  const id = Number(params.id);
  const [transaction, setTransaction] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getReceiptData(id).then((res) => setTransaction(res.transaction)).catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <AppShell title="Receipt">
        <div className="flex flex-col items-center gap-3 py-16">
          <p className="text-red-600 text-sm">{error}</p>
          <Link href="/dashboard" className="btn-outline no-underline flex items-center gap-1.5">
            <Home size={15} /> Back to Dashboard
          </Link>
        </div>
      </AppShell>
    );
  }
  if (!transaction) {
    return (
      <AppShell title="Receipt">
        <p className="text-slate-400 text-sm">Loading...</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Receipt" subtitle={transaction.tranx_ref}>
      <div className="flex flex-col items-center py-4 px-4 gap-5">
        <div className="w-full max-w-md">
          <TransactionReceiptCard transaction={transaction} />
        </div>
        <div className="w-full max-w-md">
          <ReceiptActions targetId="receipt-card" filename={`receipt-${transaction.tranx_ref}.png`} shareTitle={`Receipt ${transaction.tranx_ref}`} />
        </div>
        <Link href="/dashboard" className="btn-outline no-underline flex items-center gap-1.5">
          <Home size={15} /> Back to Dashboard
        </Link>
      </div>
    </AppShell>
  );
}
