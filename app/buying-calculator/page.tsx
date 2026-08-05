"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { useLanguage } from "@/lib/i18n";

export default function BuyingCalculatorPage() {
  const { lang } = useLanguage();
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [country1Id, setCountry1Id] = useState("");
  const [country2Id, setCountry2Id] = useState("");

  const [quantity, setQuantity] = useState(""); // amount in country1's currency
  const [dollarAmount, setDollarAmount] = useState(""); // bridging USD amount
  const [amount2, setAmount2] = useState(""); // amount in country2's currency

  useEffect(() => {
    api.getCurrencies().then((res) => setCurrencies(res.currencies));
  }, []);

  const country1 = currencies.find((c) => String(c.id) === country1Id);
  const country2 = currencies.find((c) => String(c.id) === country2Id);
  const rate1 = Number(country1?.rate_to_dollar || 0);
  const rate2 = Number(country2?.rate_to_dollar || 0);

  // Typing the amount you HAVE in country1's currency — works out the USD
  // bridge and how much that becomes in country2's currency.
  function handleQuantityChange(value: string) {
    setQuantity(value);
    if (!rate1 || !rate2 || !value) {
      setDollarAmount("");
      setAmount2("");
      return;
    }
    const usd = parseFloat(value) / rate1;
    setDollarAmount(usd.toFixed(4));
    setAmount2((usd * rate2).toFixed(4));
  }

  // Typing how much you want the RECEIVER to get in country2's currency —
  // works out the USD bridge and how much of country1's currency is needed.
  function handleAmount2Change(value: string) {
    setAmount2(value);
    if (!rate1 || !rate2 || !value) {
      setDollarAmount("");
      setQuantity("");
      return;
    }
    const usd = parseFloat(value) / rate2;
    setDollarAmount(usd.toFixed(4));
    setQuantity((usd * rate1).toFixed(4));
  }

  function handleSwap() {
    setCountry1Id(country2Id);
    setCountry2Id(country1Id);
    setQuantity(amount2);
    setAmount2(quantity);
  }

  return (
    <AppShell
      title={lang === "ar" ? "حاسبة الشراء" : "Buying Calculator"}
      subtitle={lang === "ar" ? "احسب المبلغ بين عملتين عبر الدولار" : "Work out an amount between two currencies via USD"}
    >
      <div className="card max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
          {/* Country 1 */}
          <div className="flex flex-col gap-3">
            <div>
              <label className="label">{lang === "ar" ? "البلد 1 (لديك)" : "Country 1 (you have)"}</label>
              <select value={country1Id} onChange={(e) => setCountry1Id(e.target.value)} className="input w-full">
                <option value="">{lang === "ar" ? "اختر" : "Select"}</option>
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>{c.country} ({c.currency_code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{lang === "ar" ? "سعر الصرف مقابل الدولار" : "Rate to dollar"}</label>
              <div className="input bg-slate-50 text-slate-500">{rate1 || "—"}</div>
            </div>
            <div>
              <label className="label">{lang === "ar" ? "الكمية" : "Quantity"}</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                placeholder="0.00"
                className="input w-full font-semibold"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSwap}
            className="hidden md:flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 text-slate-400 hover:text-teal-600 hover:border-teal-300 mt-8 self-center"
            title={lang === "ar" ? "تبديل" : "Swap"}
          >
            ⇄
          </button>

          {/* Country 2 */}
          <div className="flex flex-col gap-3">
            <div>
              <label className="label">{lang === "ar" ? "البلد 2 (يستلم)" : "Country 2 (receiving)"}</label>
              <select value={country2Id} onChange={(e) => setCountry2Id(e.target.value)} className="input w-full">
                <option value="">{lang === "ar" ? "اختر" : "Select"}</option>
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>{c.country} ({c.currency_code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{lang === "ar" ? "سعر الصرف مقابل الدولار" : "Rate to dollar"}</label>
              <div className="input bg-slate-50 text-slate-500">{rate2 || "—"}</div>
            </div>
            <div>
              <label className="label">{lang === "ar" ? "المبلغ" : "Amount"}</label>
              <input
                type="number"
                value={amount2}
                onChange={(e) => handleAmount2Change(e.target.value)}
                placeholder="0.00"
                className="input w-full font-semibold"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase">
            {lang === "ar" ? "المبلغ بالدولار" : "Dollar amount"}
          </span>
          <span className="text-lg font-bold text-teal-700">{dollarAmount ? `$${Number(dollarAmount).toLocaleString()}` : "—"}</span>
        </div>

        <p className="text-xs text-slate-400 mt-3">
          {lang === "ar"
            ? "اكتب في أي جانب — سيتم حساب الجانب الآخر تلقائيًا عبر الدولار الأمريكي."
            : "Type into either side — the other side (and the USD bridge) fills in automatically."}
        </p>
      </div>
    </AppShell>
  );
}
