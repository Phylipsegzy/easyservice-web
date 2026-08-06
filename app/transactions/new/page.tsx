"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import CustomerPicker, { PickedCustomer } from "@/components/CustomerPicker";
import PhoneInput from "@/components/PhoneInput";
import StepIndicator from "@/components/StepIndicator";
import MoneyInput from "@/components/MoneyInput";
import { useLanguage } from "@/lib/i18n";
import { getRecentCustomers, addRecentCustomer } from "@/lib/recentCustomers";
import { ArrowLeft, ArrowRight, UserPlus } from "lucide-react";

type Currency = { id: number; country: string; currency_code: string };
type CurrencyGroupRow = {
  id: number;
  country1_id: number;
  country2_id: number;
  rate: string | number;
  country1: Currency;
  country2: Currency;
};

const STEPS = ["Customer", "Route", "Amount", "Review"];

export default function NewTransactionPage() {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const [step, setStep] = useState(1);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [corridors, setCorridors] = useState<CurrencyGroupRow[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // --- Customer ---
  const [customer, setCustomer] = useState<PickedCustomer | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canEditRate, setCanEditRate] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [ownerId, setOwnerId] = useState("");
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerCode, setNewCustomerCode] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);

  // --- Corridor ---
  const [sendingCountryId, setSendingCountryId] = useState("");
  const [receivingCountryId, setReceivingCountryId] = useState("");
  const [rate, setRate] = useState("");
  const [specialRates, setSpecialRates] = useState<any[]>([]);
  const [usingSpecialRateId, setUsingSpecialRateId] = useState<number | null>(null);

  // --- Amount (bidirectional) ---
  const [sendAmount, setSendAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [lastEdited, setLastEdited] = useState<"send" | "receive">("send");

  const [advance, setAdvance] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [chadRegions, setChadRegions] = useState<any[]>([]);
  const [chadRegion, setChadRegion] = useState("");
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [recentCustomers, setRecentCustomers] = useState<PickedCustomer[]>([]);

  useEffect(() => {
    api.getCurrencies().then((res) => setCurrencies(res.currencies));
    api.getChadRegions(true).then((res) => setChadRegions(res.chad_regions)).catch(() => {});
    api.me().then((res) => {
      setMyUserId(res.user.id);
      const localRecents = getRecentCustomers(res.user.id);
      setRecentCustomers(localRecents); // instant paint from local cache while server call is in flight
      api.getRecentCustomers().then((r) => {
        const serverRecents = r.customers as PickedCustomer[];
        const merged = [...serverRecents, ...localRecents.filter((c) => !serverRecents.some((s) => s.id === c.id))].slice(0, 5);
        setRecentCustomers(merged);
      }).catch(() => {});
      if (res.user.role === "admin") {
        setIsAdmin(true);
        api.getStaff().then((r) => setStaffList(r.staff));
      }
      setCanEditRate(!!res.user.can_edit_rate);
    });
  }, []);

  useEffect(() => {
    if (customer?.country_id) setSendingCountryId(String(customer.country_id));
    setUsingSpecialRateId(null);
    if (customer?.id) {
      api.getSpecialRates({ customer_id: String(customer.id) }).then((res) => setSpecialRates(res.special_rates)).catch(() => setSpecialRates([]));
    } else {
      setSpecialRates([]);
    }
  }, [customer]);

  useEffect(() => {
    setReceivingCountryId("");
    setRate("");
    if (!sendingCountryId) {
      setCorridors([]);
      return;
    }
    api.getCurrencyGroups({ country1_id: sendingCountryId }).then((res) => setCorridors(res.currency_groups));
  }, [sendingCountryId]);

  useEffect(() => {
    const match = corridors.find((c) => String(c.country2_id) === receivingCountryId);
    setRate(match ? String(match.rate) : "");
    setUsingSpecialRateId(null);
  }, [receivingCountryId, corridors]);

  useEffect(() => {
    const r = parseFloat(rate) || 0;
    if (!r) return;
    if (lastEdited === "send") {
      const send = parseFloat(sendAmount) || 0;
      setReceiveAmount(send ? (send * r).toFixed(4) : "");
    } else {
      const recv = parseFloat(receiveAmount) || 0;
      setSendAmount(recv ? (recv / r).toFixed(4) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rate]);

  function handleSendAmountChange(v: string) {
    setLastEdited("send");
    setSendAmount(v);
    const r = parseFloat(rate) || 0;
    const send = parseFloat(v) || 0;
    setReceiveAmount(r && send ? (send * r).toFixed(4) : "");
  }

  function handleReceiveAmountChange(v: string) {
    setLastEdited("receive");
    setReceiveAmount(v);
    const r = parseFloat(rate) || 0;
    const recv = parseFloat(v) || 0;
    setSendAmount(r && recv ? (recv / r).toFixed(4) : "");
  }

  function startCreateCustomer(typedName: string) {
    setNewCustomerName(typedName);
    setCreatingCustomer(true);
  }

  async function selectCustomer(c: PickedCustomer, advance = false) {
    // The cached "recent customer" snapshot is only reliable for display (name,
    // phone) — its country_id can go stale if the customer record or the whole
    // database gets re-imported since it was cached. Re-fetch the authoritative
    // record before using it to drive the sending-country auto-fill.
    let fresh = c;
    if (advance) {
      try {
        const res = await api.getCustomer(c.id);
        fresh = res.customer;
      } catch {
        setError(lang === "ar" ? "تعذر تحميل بيانات العميل — حاول البحث عنه مرة أخرى." : "Could not load this customer — try searching for them again.");
        return;
      }
    }
    setCustomer(fresh);
    if (myUserId) {
      addRecentCustomer(myUserId, fresh);
      setRecentCustomers(getRecentCustomers(myUserId));
    }
    if (advance) setStep(2);
  }

  async function handleSaveNewCustomer() {
    setError("");
    setSavingCustomer(true);
    try {
      const payload: Record<string, any> = {
        customer_name: newCustomerName,
        phone: newCustomerPhone,
        country_code: newCustomerCode,
      };
      if (sendingCountryId) payload.country_id = Number(sendingCountryId);
      const res = await api.createCustomer(payload);
      selectCustomer(res.customer);
      setCreatingCustomer(false);
      setNewCustomerName("");
      setNewCustomerCode("");
      setNewCustomerPhone("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingCustomer(false);
    }
  }

  const sendingCountry = currencies.find((c) => String(c.id) === sendingCountryId);
  const receivingCountry = currencies.find((c) => String(c.id) === receivingCountryId);
  const isChadDestination = !!receivingCountry?.country?.toLowerCase().includes("chad");

  const stepValid = useMemo(() => {
    if (step === 1) return !!customer;
    if (step === 2) return !!sendingCountryId && !!receivingCountryId && !!rate && (!isChadDestination || !!chadRegion);
    if (step === 3) return parseFloat(sendAmount) > 0 || parseFloat(receiveAmount) > 0;
    return true;
  }, [step, customer, sendingCountryId, receivingCountryId, rate, sendAmount, receiveAmount, isChadDestination, chadRegion]);

  function goNext() {
    setError("");
    if (!stepValid) return;
    setStep((s) => Math.min(s + 1, STEPS.length));
  }
  function goBack() {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleGenerate() {
    if (!customer) return;
    setError("");
    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        customer_id: customer.id,
        country1_id: Number(sendingCountryId),
        country2_id: Number(receivingCountryId),
        rate: parseFloat(rate),
        advance: advance ? parseFloat(advance) : undefined,
        location: location || undefined,
        notes: notes || undefined,
        chad_region: isChadDestination ? chadRegion : undefined,
        owner_id: isAdmin && ownerId ? Number(ownerId) : undefined,
      };
      if (lastEdited === "send") payload.amount = parseFloat(sendAmount);
      else payload.subtotal = parseFloat(receiveAmount);

      const res = await api.createTransaction(payload);
      router.push(`/transactions/${res.transaction.id}/receipt`);
      return; // skip further success-screen state — we're navigating away to the full receipt page
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setStep(1);
    setCustomer(null);
    setSendingCountryId("");
    setReceivingCountryId("");
    setRate("");
    setSendAmount("");
    setReceiveAmount("");
    setAdvance("");
    setLocation("");
    setNotes("");
    setError("");
  }

  // ------------------------------------------------------------------
  // Success screen (post-submit) — mirrors a typical send-money app's
  // confirmation screen: reference code front and center, then details.
  // ------------------------------------------------------------------

  return (
    <AppShell title={t("new_invoice")} subtitle={lang === "ar" ? "إنشاء فاتورة إرسال / استلام" : "Generate a send/receive invoice"}>
      <a href="/transactions" className="back-link">&larr; {t("transactions")}</a>

      <StepIndicator steps={lang === "ar" ? ["العميل", "المسار", "المبلغ", "المراجعة"] : STEPS} current={step} />

      <div className="card max-w-xl step-fade" key={step}>
        {/* Step 1 — Customer */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 mb-0.5">{t("whos_sending")}</h2>
              <p className="text-sm text-slate-400">{lang === "ar" ? "ابحث عن عميل حالي أو أضف عميلاً جديدًا." : "Search an existing customer or add a new one."}</p>
            </div>
            <CustomerPicker
              selected={customer}
              onSelect={(c) => (c ? selectCustomer(c) : setCustomer(null))}
              onCreateNew={startCreateCustomer}
            />

            {!customer && recentCustomers.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2">
                  {lang === "ar" ? "العملاء الأخيرون" : "Recent customers"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {recentCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCustomer(c, true)}
                      className="flex items-center gap-2 bg-slate-50 hover:bg-teal-50 hover:border-teal-200 border border-slate-200 rounded-xl px-3 py-2 text-left transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {c.customer_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 leading-tight">{c.customer_name}</div>
                        <div className="text-[11px] text-slate-400 leading-tight">{c.country_code} {c.phone}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {creatingCustomer && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <UserPlus size={15} /> {lang === "ar" ? "عميل جديد" : "New customer"}
                </div>
                <input
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder={lang === "ar" ? "الاسم الكامل" : "Full name"}
                  className="input w-full"
                />
                <PhoneInput
                  countryCode={newCustomerCode}
                  phone={newCustomerPhone}
                  onCountryCodeChange={setNewCustomerCode}
                  onPhoneChange={setNewCustomerPhone}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveNewCustomer}
                    disabled={savingCustomer || !newCustomerName || !newCustomerPhone}
                    className="btn"
                  >
                    {savingCustomer ? (lang === "ar" ? "جارٍ الحفظ..." : "Saving...") : (lang === "ar" ? "حفظ العميل" : "Save customer")}
                  </button>
                  <button type="button" onClick={() => setCreatingCustomer(false)} className="btn-ghost">
                    {t("cancel")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Route */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 mb-0.5">{t("wheres_it_going")}</h2>
              <p className="text-sm text-slate-400">Pick the sending and receiving country.</p>
            </div>
            <div>
              <label className="label">{t("sending_country")}</label>
              {(customer as any)?.wallets?.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {(customer as any).wallets.map((w: any) => (
                    <button
                      key={w.currency_id}
                      type="button"
                      onClick={() => setSendingCountryId(String(w.currency_id))}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                        String(w.currency_id) === sendingCountryId
                          ? "bg-teal-600 text-white border-teal-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
                      }`}
                    >
                      {w.currency?.country} ({w.currency?.currency_code})
                    </button>
                  ))}
                </div>
              )}
              <select value={sendingCountryId} onChange={(e) => setSendingCountryId(e.target.value)} className="input w-full">
                <option value="">Select</option>
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>{c.country} ({c.currency_code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t("receiving_country")}</label>
              <select
                value={receivingCountryId}
                onChange={(e) => setReceivingCountryId(e.target.value)}
                disabled={!sendingCountryId}
                className="input w-full"
              >
                <option value="">{sendingCountryId ? (lang === "ar" ? "اختر" : "Select") : (lang === "ar" ? "اختر بلد الإرسال أولاً" : "Choose sending country first")}</option>
                {corridors.map((c) => (
                  <option key={c.id} value={c.country2_id}>{c.country2.country} ({c.country2.currency_code})</option>
                ))}
              </select>
              {sendingCountryId && corridors.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">{lang === "ar" ? "لم يتم إعداد أي ممر عملة من هذا البلد بعد." : "No currency-group corridor set up from this country yet."}</p>
              )}
            </div>
            {rate && (
              canEditRate ? (
                <div>
                  <label className="label">Rate (editable — manager/admin)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={rate}
                    onChange={(e) => { setRate(e.target.value); setUsingSpecialRateId(null); }}
                    className="input w-full"
                  />
                </div>
              ) : (
                <div className="bg-teal-50 border border-teal-100 rounded-xl px-3.5 py-2.5 text-sm flex justify-between">
                  <span className="text-slate-500">Rate</span>
                  <strong>{rate}</strong>
                </div>
              )
            )}
            {specialRates.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1.5">
                  {lang === "ar" ? "أسعار خاصة لهذا العميل" : "Special rates for this customer"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {specialRates.map((sr) => (
                    <button
                      key={sr.id}
                      type="button"
                      onClick={() => {
                        setRate(String(sr.customer_rate));
                        setUsingSpecialRateId(sr.id);
                      }}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                        usingSpecialRateId === sr.id
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400"
                      }`}
                    >
                      {sr.name || "Special rate"} — {sr.customer_rate}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {isChadDestination && (
              <div>
                <label className="label">{lang === "ar" ? "منطقة الاستلام في تشاد" : "Pickup region in Chad"}</label>
                <select value={chadRegion} onChange={(e) => setChadRegion(e.target.value)} className="input w-full">
                  <option value="">Select a region</option>
                  {chadRegions.map((r) => (
                    <option key={r.id} value={r.region}>{r.region}</option>
                  ))}
                </select>
                {chadRegions.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No pickup regions set up yet — add one under Chad Pickup Regions.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Amount */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 mb-0.5">{t("how_much")}</h2>
              <p className="text-sm text-slate-400">{lang === "ar" ? "اكتب في أي جانب — سيتم تحديث الآخر تلقائيًا." : "Type into either side — the other updates from the rate."}</p>
            </div>
            <div>
              <label className="label">{t("customer_pays")} ({sendingCountry?.currency_code})</label>
              <MoneyInput
                value={sendAmount}
                onChange={handleSendAmountChange}
                className="input w-full text-2xl font-bold py-4"
              />
            </div>
            <div>
              <label className="label">{t("recipient_gets")} ({receivingCountry?.currency_code})</label>
              <MoneyInput
                value={receiveAmount}
                onChange={handleReceiveAmountChange}
                className="input w-full text-2xl font-bold py-4"
              />
            </div>
            <div>
              <label className="label">{lang === "ar" ? "الدفعة المقدمة المستلمة" : "Advance received"}</label>
              <MoneyInput
                value={advance}
                onChange={setAdvance}
                placeholder="defaults to full amount"
                className="input w-full"
              />
            </div>
          </div>
        )}

        {/* Step 4 — Review */}
        {step === 4 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 mb-0.5">{t("review_confirm")}</h2>
              <p className="text-sm text-slate-400">Double check before generating the invoice.</p>
            </div>

            {isAdmin && (
              <div>
                <label className="label">{lang === "ar" ? "إنشاء لموظف آخر (اختياري)" : "Generate for staff member (optional)"}</label>
                <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className="input w-full">
                  <option value="">{lang === "ar" ? "أنا نفسي" : "Myself"}</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">The cash collected will go into this staff member's wallet — they'll be notified.</p>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-200">
              {[
                [lang === "ar" ? "العميل" : "Customer", `${customer?.customer_name} (${customer?.country_code || ""} ${customer?.phone || ""})`],
                [lang === "ar" ? "المسار" : "Route", `${sendingCountry?.country || ""} → ${receivingCountry?.country || ""}`],
                ...(isChadDestination ? [[lang === "ar" ? "منطقة الاستلام" : "Pickup region", chadRegion || "—"]] : []),
                [t("customer_pays"), `${sendAmount} ${sendingCountry?.currency_code || ""}`],
                [t("recipient_gets"), `${receiveAmount} ${receivingCountry?.currency_code || ""}`],
                [lang === "ar" ? "الدفعة المقدمة المستلمة" : "Advance received", advance || (lang === "ar" ? "المبلغ كاملاً" : "Full amount")],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-500">{label}</span>
                  <strong className="text-slate-900 text-right">{value}</strong>
                </div>
              ))}
            </div>

            <div>
              <label className="label">{lang === "ar" ? "الموقع" : "Location"}</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} className="input w-full" />
            </div>
            <div>
              <label className="label">{lang === "ar" ? "ملاحظة" : "Note"}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input w-full"
                rows={3}
                placeholder={lang === "ar" ? "تفاصيل بنكية أو مرجع أو أي ملاحظة" : "Bank details, reference, or any other note for this invoice"}
              />
            </div>
          </div>
        )}

        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

        {/* Nav */}
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="btn-ghost flex items-center gap-1.5 disabled:opacity-0 disabled:pointer-events-none"
          >
            <ArrowLeft size={15} /> {t("back")}
          </button>

          {step < STEPS.length ? (
            <button type="button" onClick={goNext} disabled={!stepValid} className="btn flex items-center gap-1.5">
              {t("next")} <ArrowRight size={15} />
            </button>
          ) : (
            <button type="button" onClick={handleGenerate} disabled={submitting} className="btn">
              {submitting ? (lang === "ar" ? "جارٍ الإنشاء..." : "Generating...") : t("generate_invoice")}
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
