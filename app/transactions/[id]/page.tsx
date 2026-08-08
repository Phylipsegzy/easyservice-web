"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import VoiceRecorder from "@/components/VoiceRecorder";
import { Download } from "lucide-react";

export default function TransactionDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const [transaction, setTransaction] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(false);

  const [evidenceNote, setEvidenceNote] = useState("");
  const [evidenceImage, setEvidenceImage] = useState<File | null>(null);
  const [evidenceVoice, setEvidenceVoice] = useState<File | null>(null);
  const [evidenceVideo, setEvidenceVideo] = useState<File | null>(null);
  const [voiceRecorderKey, setVoiceRecorderKey] = useState(0);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [showPartPayout, setShowPartPayout] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [myRole, setMyRole] = useState("");
  const [myLocation, setMyLocation] = useState("");
  const [staffList, setStaffList] = useState<any[]>([]);
  const [collectorId, setCollectorId] = useState("");
  const [paymentRemark, setPaymentRemark] = useState("");
  const [payingSubmitting, setPayingSubmitting] = useState(false);

  const [refundSubmitting, setRefundSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [txRes, paymentsRes, refundsRes, evidenceRes] = await Promise.all([
        api.getTransaction(id),
        api.getTransactionPayments(id),
        api.getRefunds({ transaction_id: String(id) }),
        api.getEvidence(id),
      ]);
      setTransaction(txRes.transaction);
      setPayments(paymentsRes.payments);
      setRefunds(refundsRes.refunds.data || refundsRes.refunds);
      setEvidence(evidenceRes.evidence);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    api.me().then((res) => {
      setMyRole(res.user.role);
      setMyLocation(res.user.location);
      if (res.user.role === "admin") {
        setIsAdmin(true);
        api.getStaff().then((r) => setStaffList(r.staff));
      }
    });
  }, [id]);

  async function handlePayoutFull() {
    setCompleting(true);
    try {
      await api.recordPayout(id, { payment_type: "full", staff_id: isAdmin && collectorId ? Number(collectorId) : undefined });
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCompleting(false);
    }
  }

  async function handlePayoutPart(e: React.FormEvent) {
    e.preventDefault();
    setCompleting(true);
    try {
      await api.recordPayout(id, {
        payment_type: "part",
        amount: parseFloat(payoutAmount),
        staff_id: isAdmin && collectorId ? Number(collectorId) : undefined,
      });
      setPayoutAmount("");
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCompleting(false);
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPayingSubmitting(true);
    try {
      await api.addTransactionPayment(id, {
        amount: parseFloat(paymentAmount),
        remark: paymentRemark || undefined,
        staff_id: isAdmin && collectorId ? Number(collectorId) : undefined,
      });
      setPaymentAmount("");
      setPaymentRemark("");
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPayingSubmitting(false);
    }
  }

  async function handleIssueFullRefund() {
    setError("");
    setRefundSubmitting(true);
    try {
      await api.createRefund(id, {});
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRefundSubmitting(false);
    }
  }

  async function handleCompleteRefund(refundId: number) {
    try {
      await api.completeRefund(refundId);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleUploadEvidence(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setUploadingEvidence(true);
    try {
      const form = new FormData();
      if (evidenceNote) form.append("note", evidenceNote);
      if (evidenceImage) form.append("image", evidenceImage);
      if (evidenceVoice) form.append("voice", evidenceVoice);
      if (evidenceVideo) form.append("video", evidenceVideo);
      await api.uploadEvidence(id, form);
      setEvidenceNote("");
      setEvidenceImage(null);
      setEvidenceVoice(null);
      setEvidenceVideo(null);
      setVoiceRecorderKey((k) => k + 1);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingEvidence(false);
    }
  }

  function handleDownloadReceipt() {
    window.open(`/transactions/${id}/receipt`, "_blank");
  }

  if (loading) {
    return (
      <AppShell>
        <a href="/transactions" className="back-link">&larr; Transactions</a>
        <p className="text-slate-400 text-sm">Loading...</p>
      </AppShell>
    );
  }
  if (!transaction) {
    return (
      <AppShell>
        <a href="/transactions" className="back-link">&larr; Transactions</a>
        <p className="text-slate-400 text-sm">Transaction not found.</p>
      </AppShell>
    );
  }

  const row = (label: string, value: any) => (
    <div className="flex justify-between py-2.5 border-b border-slate-100 last:border-0 text-sm">
      <span className="text-slate-500">{label}</span>
      <strong className="text-slate-900 text-right">{value}</strong>
    </div>
  );

  return (
    <AppShell
      title={transaction.tranx_ref}
      actions={<span className={`badge badge-${transaction.payment_status?.replace(" ", "-")}`}>{transaction.payment_status}</span>}
    >
      <a href="/transactions" className="back-link">&larr; Transactions</a>

      <div className="max-w-xl space-y-5">
        <div>
          <h2 className="text-base font-semibold mb-2">Parties</h2>
          <div className="card">
            {row("Customer", `${transaction.customer_name} (${transaction.country_code || ""} ${transaction.phone})`)}
            {transaction.receiver_name && row("Receiver", `${transaction.receiver_name} (${transaction.receiver_phone || "—"})`)}
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2">Corridor</h2>
          <div className="card">
            {row("Sending country", transaction.country1 ? `${transaction.country1.country} (${transaction.country1.currency_code})` : "—")}
            {row("Receiving country", transaction.country2 ? `${transaction.country2.country} (${transaction.country2.currency_code})` : "—")}
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2">Amounts</h2>
          <div className="card">
            {row("Amount sent", transaction.amount)}
            {row("Rate", transaction.rate)}
            {row("Total (receiver gets)", transaction.total)}
            {row("Advance received", transaction.advance)}
            {row("Balance owed by customer", transaction.balance)}
            {row("Paid out to receiver so far", transaction.part_payment || 0)}
            {row("Remaining to pay out", Number(transaction.total) - Number(transaction.part_payment || 0))}
            {row("Payout status", transaction.payment_status2 || "—")}
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2">Payments</h2>
          <div className="card">
            {payments.length > 0 ? (
              <div className="flex flex-col divide-y divide-slate-100 mb-4">
                {payments.map((p) => (
                  <div key={p.id} className="flex justify-between py-2 text-sm">
                    <span className="text-slate-500">
                      {new Date(p.created_at).toLocaleDateString()} — {p.remark || p.description}
                    </span>
                    <strong>{Number(p.amount).toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm mb-4">No additional payments recorded yet.</p>
            )}

            {Number(transaction.balance) > 0 && (
              <form onSubmit={handleRecordPayment} className="flex gap-2 flex-wrap items-end pt-3 border-t border-slate-100">
                <div>
                  <label className="label">Record payment</label>
                  <input
                    type="number"
                    step="0.0001"
                    max={transaction.balance}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder={`Up to ${transaction.balance}`}
                    required
                    className="input w-36"
                  />
                </div>
                <div>
                  <label className="label">Remark</label>
                  <input value={paymentRemark} onChange={(e) => setPaymentRemark(e.target.value)} className="input" />
                </div>
                {isAdmin && (
                  <div>
                    <label className="label">Collected by</label>
                    <select value={collectorId} onChange={(e) => setCollectorId(e.target.value)} className="input">
                      <option value="">Myself</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <button type="submit" disabled={payingSubmitting} className="btn">
                  {payingSubmitting ? "Recording..." : "Record"}
                </button>
              </form>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2">Refunds</h2>
          <div className="card">
            {refunds.length > 0 ? (
              <div className="flex flex-col divide-y divide-slate-100 mb-4">
                {refunds.map((r) => (
                  <div key={r.id} className="flex justify-between items-center py-2 text-sm">
                    <span className="text-slate-500">{new Date(r.created_at).toLocaleDateString()}</span>
                    <strong>{Number(r.amount).toLocaleString()}</strong>
                    <span className={`badge badge-${r.payment_status === "completed" ? "completed" : "pending"}`}>
                      {r.payment_status}
                    </span>
                    {r.payment_status === "pending" && (
                      <button onClick={() => handleCompleteRefund(r.id)} className="btn-ghost">Mark paid out</button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm mb-4">No refunds issued yet.</p>
            )}

            {Number(transaction.advance) > 0 && myRole === "admin" && (
              <div className="pt-3 border-t border-slate-100">
                <button type="button" onClick={handleIssueFullRefund} disabled={refundSubmitting} className="btn-outline">
                  {refundSubmitting ? "Issuing..." : `Refund in full (${transaction.advance})`}
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2">Payment Evidence</h2>
          <div className="card">
            {evidence.length > 0 ? (
              <div className="flex flex-col divide-y divide-slate-100 mb-4">
                {evidence.map((ev) => (
                  <div key={ev.id} className="py-3 text-sm">
                    <div className="flex justify-between">
                      <strong>{ev.staff_name}</strong>
                      <span className="text-xs text-slate-400">{new Date(ev.created_at).toLocaleString()}</span>
                    </div>
                    {ev.note && <p className="text-slate-500 mt-1">{ev.note}</p>}
                    <div className="flex flex-col gap-2 mt-2">
                      {ev.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ev.image_url} alt="Payment evidence" className="max-w-xs rounded-lg border border-slate-100" />
                      )}
                      {ev.voice_url && (
                        <audio src={ev.voice_url} controls className="max-w-xs h-9" />
                      )}
                      {ev.video_url && (
                        <video src={ev.video_url} controls className="max-w-xs rounded-lg border border-slate-100" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm mb-4">No evidence uploaded yet.</p>
            )}

            <form onSubmit={handleUploadEvidence} className="flex flex-col gap-3 pt-3 border-t border-slate-100">
              <div className="flex gap-2 flex-wrap items-end">
                <div className="flex-1 min-w-[160px]">
                  <label className="label">Note</label>
                  <input value={evidenceNote} onChange={(e) => setEvidenceNote(e.target.value)} className="input w-full" />
                </div>
              </div>
              <div className="flex gap-4 flex-wrap items-end">
                <div>
                  <label className="label">Photo</label>
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => setEvidenceImage(e.target.files?.[0] || null)} className="text-sm" />
                </div>
                <div>
                  <label className="label">Video</label>
                  <input type="file" accept="video/*" capture="environment" onChange={(e) => setEvidenceVideo(e.target.files?.[0] || null)} className="text-sm" />
                </div>
                <VoiceRecorder key={voiceRecorderKey} onRecorded={setEvidenceVoice} />
                <button type="submit" disabled={uploadingEvidence} className="btn">
                  {uploadingEvidence ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2">Details</h2>
          <div className="card">
            {row("Location", transaction.location || "—")}
            {row("Notes", transaction.notes || "—")}
            {row("Created", new Date(transaction.created_at).toLocaleString())}
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 flex-wrap items-start">
          {transaction.payment_status2 !== "completed" && (
            (myRole !== "personnel" && myRole !== "personnel2") || transaction.country2?.country === myLocation
          ) && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 flex-wrap items-center">
                <button onClick={handlePayoutFull} disabled={completing} className="btn">
                  {completing ? "Recording..." : "Pay out in full"}
                </button>
                <button type="button" onClick={() => setShowPartPayout((v) => !v)} className="btn-outline">
                  Record part payout
                </button>
                {isAdmin && (
                  <select value={collectorId} onChange={(e) => setCollectorId(e.target.value)} className="input">
                    <option value="">Payout by: myself</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>Payout by: {s.name}</option>
                    ))}
                  </select>
                )}
              </div>
              {showPartPayout && (
                <form onSubmit={handlePayoutPart} className="flex gap-2 items-end">
                  <div>
                    <label className="label">Part payout amount</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      placeholder={`Less than ${Number(transaction.total) - Number(transaction.part_payment || 0)}`}
                      required
                      className="input w-48"
                    />
                  </div>
                  <button type="submit" disabled={completing} className="btn">
                    {completing ? "Recording..." : "Record"}
                  </button>
                </form>
              )}
            </div>
          )}
          <button onClick={handleDownloadReceipt} className="btn-outline flex items-center gap-1.5">
            <Download size={16} /> View / download receipt
          </button>
        </div>
      </div>
    </AppShell>
  );
}
