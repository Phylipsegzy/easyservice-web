"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "en" | "ar";

// Translation dictionary. Covers navigation, shared UI chrome, and the invoice
// wizard as a full worked example — the same `t()` pattern extends to every
// other page by adding keys here and swapping hardcoded strings for t("key").
const dict: Record<string, { en: string; ar: string }> = {
  // Nav
  dashboard: { en: "Dashboard", ar: "لوحة التحكم" },
  transactions: { en: "Transactions", ar: "المعاملات" },
  payment_status: { en: "Payment Status", ar: "حالة الدفع" },
  statements: { en: "Statements", ar: "كشوف الحساب" },
  track_invoice: { en: "Track Invoice", ar: "تتبع الفاتورة" },
  my_account: { en: "My Account", ar: "حسابي" },
  cash_movement: { en: "Cash Movement", ar: "حركة النقد" },
  refunds: { en: "Refunds", ar: "المبالغ المستردة" },
  customers: { en: "Customers", ar: "العملاء" },
  currencies: { en: "Currencies", ar: "العملات" },
  currency_corridors: { en: "Currency Corridors", ar: "ممرات العملات" },
  special_rates: { en: "Special Rates", ar: "أسعار خاصة" },
  chad_regions: { en: "Chad Regions", ar: "مناطق تشاد" },
  staff_transfers: { en: "Staff Transfers", ar: "تحويلات الموظفين" },
  partner_ledgers: { en: "Partner Ledgers", ar: "دفاتر الشركاء" },
  expenses: { en: "Expenses", ar: "المصروفات" },
  reports: { en: "Reports", ar: "التقارير" },
  staff: { en: "Staff", ar: "الموظفون" },
  log_out: { en: "Log out", ar: "تسجيل الخروج" },

  // Common
  save: { en: "Save", ar: "حفظ" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  search: { en: "Search...", ar: "بحث..." },
  loading: { en: "Loading...", ar: "جارٍ التحميل..." },
  edit: { en: "Edit", ar: "تعديل" },
  delete: { en: "Delete", ar: "حذف" },
  submit: { en: "Submit", ar: "إرسال" },
  next: { en: "Next", ar: "التالي" },
  back: { en: "Back", ar: "رجوع" },
  view: { en: "View", ar: "عرض" },
  status: { en: "Status", ar: "الحالة" },
  amount: { en: "Amount", ar: "المبلغ" },
  date: { en: "Date", ar: "التاريخ" },
  customer: { en: "Customer", ar: "العميل" },

  // Invoice wizard (full worked example)
  new_invoice: { en: "New Invoice", ar: "فاتورة جديدة" },
  whos_sending: { en: "Who's sending?", ar: "من هو المرسل؟" },
  wheres_it_going: { en: "Where's it going?", ar: "إلى أين يذهب؟" },
  how_much: { en: "How much?", ar: "كم المبلغ؟" },
  review_confirm: { en: "Review & confirm", ar: "المراجعة والتأكيد" },
  sending_country: { en: "Sending country", ar: "بلد الإرسال" },
  receiving_country: { en: "Receiving country", ar: "بلد الاستلام" },
  generate_invoice: { en: "Generate invoice", ar: "إنشاء الفاتورة" },
  customer_pays: { en: "Customer pays", ar: "يدفع العميل" },
  recipient_gets: { en: "Recipient gets", ar: "يستلم المستفيد" },

  // Login
  sign_in_subtitle: { en: "Sign in to your account", ar: "سجّل الدخول إلى حسابك" },
  username: { en: "Username", ar: "اسم المستخدم" },
  password: { en: "Password", ar: "كلمة المرور" },
  logging_in: { en: "Logging in...", ar: "جارٍ تسجيل الدخول..." },
  log_in: { en: "Log in", ar: "تسجيل الدخول" },
  tracking_transfer: { en: "Tracking a transfer?", ar: "هل تتابع تحويلاً؟" },
  check_status: { en: "Check its status", ar: "تحقق من حالته" },
  login_failed: { en: "Login failed", ar: "فشل تسجيل الدخول" },

  // Dashboard
  welcome: { en: "Welcome", ar: "مرحباً" },
  your_wallet_balance: { en: "Your wallet balance", ar: "رصيد محفظتك" },
  new_transaction: { en: "New Transaction", ar: "معاملة جديدة" },
};

export function t(key: string, lang: Lang): string {
  return dict[key]?.[lang] ?? key;
}

type LanguageContextValue = {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  dir: "ltr",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("lang")) as Lang | null;
    if (stored === "ar" || stored === "en") applyLang(stored);
  }, []);

  function applyLang(next: Lang) {
    setLangState(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", next);
      document.documentElement.lang = next;
      document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    }
  }

  return (
    <LanguageContext.Provider
      value={{
        lang,
        dir: lang === "ar" ? "rtl" : "ltr",
        setLang: applyLang,
        t: (key) => t(key, lang),
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
