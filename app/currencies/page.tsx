"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { useLanguage } from "@/lib/i18n";

export default function CurrenciesPage() {
  const { t } = useLanguage();
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [country, setCountry] = useState("");
  const [symbol, setSymbol] = useState("");
  const [currencyCode, setCurrencyCode] = useState("");
  const [rateToDollar, setRateToDollar] = useState("");
  const [rateToDollarSell, setRateToDollarSell] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.getCurrencies();
      setCurrencies(res.currencies);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.createCurrency({
        country,
        symbol,
        currency_code: currencyCode,
        rate_to_dollar: parseFloat(rateToDollar),
        rate_to_dollar_sell: rateToDollarSell ? parseFloat(rateToDollarSell) : undefined,
      });
      setCountry("");
      setSymbol("");
      setCurrencyCode("");
      setRateToDollar("");
      setRateToDollarSell("");
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(currency: any, field: "is_sending_active" | "is_receiving_active") {
    await api.updateCurrency(currency.id, { [field]: !currency[field] });
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm(t("confirm_delete_currency"))) return;
    await api.deleteCurrency(id);
    load();
  }

  return (
    <AppShell title={t("currencies_title")} subtitle={t("currencies_subtitle")}>
      <form onSubmit={handleAdd} className="card flex gap-3 flex-wrap items-end mb-6">
        <div>
          <label className="label">{t("country_col")}</label>
          <input placeholder="e.g. USA" value={country} onChange={(e) => setCountry(e.target.value)} required className="input" />
        </div>
        <div>
          <label className="label">{t("symbol")}</label>
          <input placeholder="$" value={symbol} onChange={(e) => setSymbol(e.target.value)} className="input w-20" />
        </div>
        <div>
          <label className="label">{t("code")}</label>
          <input placeholder="USD" value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} className="input w-28" />
        </div>
        <div>
          <label className="label">{t("buying_rate")}</label>
          <input type="number" step="0.0001" placeholder="1.0000" value={rateToDollar} onChange={(e) => setRateToDollar(e.target.value)} required className="input w-36" />
        </div>
        <div>
          <label className="label">{t("selling_rate")}</label>
          <input type="number" step="0.0001" placeholder={t("optional")} value={rateToDollarSell} onChange={(e) => setRateToDollarSell(e.target.value)} className="input w-36" />
        </div>
        <button type="submit" disabled={submitting} className="btn">
          {submitting ? t("saving") : t("add_currency")}
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading ? (
        <p className="text-slate-400 text-sm">{t("loading")}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("country_col")}</th>
                <th>{t("symbol")}</th>
                <th>{t("code")}</th>
                <th>{t("buy_rate")}</th>
                <th>{t("sell_rate")}</th>
                <th>{t("sending")}</th>
                <th>{t("receiving")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {currencies.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.country}</td>
                  <td>{c.symbol}</td>
                  <td>{c.currency_code}</td>
                  <td>
                    <input
                      type="number"
                      step="0.0001"
                      defaultValue={c.rate_to_dollar}
                      onBlur={(e) => api.updateCurrency(c.id, { rate_to_dollar: parseFloat(e.target.value) }).then(load)}
                      className="input w-24 py-1"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.0001"
                      defaultValue={c.rate_to_dollar_sell || ""}
                      placeholder="—"
                      onBlur={(e) => api.updateCurrency(c.id, { rate_to_dollar_sell: e.target.value ? parseFloat(e.target.value) : null }).then(load)}
                      className="input w-24 py-1"
                    />
                  </td>
                  <td>
                    <button onClick={() => handleToggle(c, "is_sending_active")} className={c.is_sending_active ? "btn-ghost" : "btn-danger"}>
                      {c.is_sending_active ? t("on") : t("off")}
                    </button>
                  </td>
                  <td>
                    <button onClick={() => handleToggle(c, "is_receiving_active")} className={c.is_receiving_active ? "btn-ghost" : "btn-danger"}>
                      {c.is_receiving_active ? t("on") : t("off")}
                    </button>
                  </td>
                  <td>
                    <button onClick={() => handleDelete(c.id)} className="btn-danger">{t("delete")}</button>
                  </td>
                </tr>
              ))}
              {currencies.length === 0 && (
                <tr><td colSpan={8} className="text-center text-slate-400 py-8">{t("no_currencies_yet")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
