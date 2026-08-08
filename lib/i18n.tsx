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

  // Track Invoice
  track_subtitle: { en: "Look up a transfer by its reference number", ar: "ابحث عن تحويل باستخدام رقم المرجع" },
  ref_placeholder: { en: "e.g. 124", ar: "مثال: 124" },
  checking: { en: "Checking...", ar: "جارٍ التحقق..." },
  track: { en: "Track", ar: "تتبع" },
  no_transaction_found: { en: "No transaction found for that reference.", ar: "لم يتم العثور على معاملة بهذا المرجع." },
  paid_out: { en: "Paid out", ar: "تم الدفع" },
  pending: { en: "Pending", ar: "قيد الانتظار" },
  reference: { en: "Reference", ar: "المرجع" },
  receiving_country_label: { en: "Receiving country", ar: "بلد الاستلام" },
  sent_on: { en: "Sent on", ar: "تاريخ الإرسال" },
  paid_out_on: { en: "Paid out on", ar: "تاريخ الدفع" },
  paid_out_by: { en: "Paid out by", ar: "تم الدفع بواسطة" },
  view_transaction_detail: { en: "View transaction detail", ar: "عرض تفاصيل المعاملة" },

  // Staff page
  manage_staff_subtitle: { en: "Manage staff accounts and access", ar: "إدارة حسابات الموظفين وصلاحيات الوصول" },
  add_staff: { en: "Add staff", ar: "إضافة موظف" },
  search_name_username: { en: "Search by name or username...", ar: "بحث بالاسم أو اسم المستخدم..." },
  edit_staff_member: { en: "Edit staff member", ar: "تعديل بيانات الموظف" },
  new_staff_member: { en: "New staff member", ar: "موظف جديد" },
  full_name: { en: "Full name", ar: "الاسم الكامل" },
  email: { en: "Email", ar: "البريد الإلكتروني" },
  role: { en: "Role", ar: "الدور" },
  select: { en: "Select", ar: "اختر" },
  location: { en: "Location", ar: "الموقع" },
  saving: { en: "Saving...", ar: "جارٍ الحفظ..." },
  reset_password_for: { en: "Reset password for", ar: "إعادة تعيين كلمة المرور لـ" },
  reset: { en: "Reset", ar: "إعادة تعيين" },
  name: { en: "Name", ar: "الاسم" },
  username_col: { en: "Username", ar: "اسم المستخدم" },
  wallet: { en: "Wallet", ar: "المحفظة" },
  reset_password: { en: "Reset password", ar: "إعادة تعيين كلمة المرور" },
  no_staff_yet: { en: "No staff yet.", ar: "لا يوجد موظفون بعد." },

  // My Account
  account_subtitle: { en: "Preferences and password", ar: "التفضيلات وكلمة المرور" },
  country: { en: "Country", ar: "البلد" },
  wallet_balance: { en: "Wallet balance", ar: "رصيد المحفظة" },
  invoices_generated: { en: "Invoices generated", ar: "الفواتير المُنشأة" },
  this_month: { en: "This month", ar: "هذا الشهر" },
  total_amount_sent: { en: "Total amount sent", ar: "إجمالي المبلغ المرسل" },
  transfers_awaiting_you: { en: "Transfers awaiting you", ar: "تحويلات بانتظارك" },
  language_label: { en: "Language", ar: "اللغة" },
  push_notifications: { en: "Push notifications", ar: "الإشعارات الفورية" },
  push_unsupported: { en: "Not supported on this browser/device.", ar: "غير مدعوم على هذا المتصفح/الجهاز." },
  push_denied: { en: "Blocked in your browser settings. Enable notifications for this site in your browser to turn this back on.", ar: "محظور في إعدادات المتصفح. فعّل الإشعارات لهذا الموقع من متصفحك لإعادة تشغيلها." },
  push_enabled_device: { en: "Enabled on this device", ar: "مُفعّل على هذا الجهاز" },
  turn_off: { en: "Turn off", ar: "إيقاف" },
  push_promo: { en: "Get notified even when EasyService isn't open — new invoices, transfers, and payment updates.", ar: "احصل على إشعارات حتى عندما يكون التطبيق مغلقاً — فواتير جديدة، تحويلات، وتحديثات الدفع." },
  enabling: { en: "Enabling...", ar: "جارٍ التفعيل..." },
  enable_notifications: { en: "Enable notifications", ar: "تفعيل الإشعارات" },
  current_password: { en: "Current password", ar: "كلمة المرور الحالية" },
  new_password: { en: "New password", ar: "كلمة المرور الجديدة" },
  confirm_new_password: { en: "Confirm new password", ar: "تأكيد كلمة المرور الجديدة" },
  updating: { en: "Updating...", ar: "جارٍ التحديث..." },
  update_password: { en: "Update password", ar: "تحديث كلمة المرور" },
  passwords_no_match: { en: "New passwords don't match.", ar: "كلمتا المرور الجديدتان غير متطابقتين." },
  password_updated: { en: "Password updated.", ar: "تم تحديث كلمة المرور." },

  // Refunds
  refunds_subtitle: { en: "Money paid back out to customers", ar: "أموال أُعيدت للعملاء" },
  search_customer_ref: { en: "Search by customer or reference...", ar: "بحث بالعميل أو المرجع..." },
  all: { en: "All", ar: "الكل" },
  completed: { en: "Completed", ar: "مكتمل" },
  transaction: { en: "Transaction", ar: "المعاملة" },
  mark_paid_out: { en: "Mark paid out", ar: "تحديد كمدفوع" },
  no_refunds_yet: { en: "No refunds yet.", ar: "لا توجد مبالغ مستردة بعد." },

  // Special Rates
  special_rates_subtitle: { en: "Preferential rates for specific customers", ar: "أسعار تفضيلية لعملاء محددين" },
  name_optional: { en: "Name (optional)", ar: "الاسم (اختياري)" },
  rate_name_placeholder: { en: "e.g. VIP rate — above 1M", ar: "مثال: سعر كبار العملاء — فوق مليون" },
  special_rate_label: { en: "Special rate", ar: "السعر الخاص" },
  add_special_rate: { en: "Add special rate", ar: "إضافة سعر خاص" },
  search_by_customer: { en: "Search by customer...", ar: "بحث بالعميل..." },
  rate: { en: "Rate", ar: "السعر" },
  remove: { en: "Remove", ar: "إزالة" },
  no_special_rates: { en: "No special rates set.", ar: "لا توجد أسعار خاصة محددة." },
  confirm_remove_rate: { en: "Remove this special rate?", ar: "هل تريد إزالة هذا السعر الخاص؟" },

  // Chad Regions
  chad_regions_title: { en: "Chad Pickup Regions", ar: "مناطق الاستلام في تشاد" },
  chad_regions_subtitle: { en: "Specific pickup locations for transfers landing in Chad", ar: "مواقع استلام محددة للتحويلات الواردة إلى تشاد" },
  region_name: { en: "Region name", ar: "اسم المنطقة" },
  add_region: { en: "Add region", ar: "إضافة منطقة" },
  search_regions: { en: "Search regions...", ar: "بحث في المناطق..." },
  region: { en: "Region", ar: "المنطقة" },
  active: { en: "Active", ar: "نشط" },
  inactive: { en: "Inactive", ar: "غير نشط" },
  no_regions_yet: { en: "No regions yet.", ar: "لا توجد مناطق بعد." },
  confirm_delete_region: { en: "Delete this region?", ar: "هل تريد حذف هذه المنطقة؟" },

  // Currencies
  currencies_title: { en: "Currencies & Rates", ar: "العملات والأسعار" },
  currencies_subtitle: { en: "Manage exchange rates and sending/receiving status", ar: "إدارة أسعار الصرف وحالة الإرسال/الاستلام" },
  country_col: { en: "Country", ar: "البلد" },
  symbol: { en: "Symbol", ar: "الرمز" },
  code: { en: "Code", ar: "الرمز البريدي" },
  buying_rate: { en: "Buying rate (to $)", ar: "سعر الشراء (مقابل الدولار)" },
  selling_rate: { en: "Selling rate (to $)", ar: "سعر البيع (مقابل الدولار)" },
  optional: { en: "optional", ar: "اختياري" },
  add_currency: { en: "Add currency", ar: "إضافة عملة" },
  buy_rate: { en: "Buy rate", ar: "سعر الشراء" },
  sell_rate: { en: "Sell rate", ar: "سعر البيع" },
  sending: { en: "Sending", ar: "الإرسال" },
  receiving: { en: "Receiving", ar: "الاستلام" },
  on: { en: "On", ar: "مفعّل" },
  off: { en: "Off", ar: "معطّل" },
  no_currencies_yet: { en: "No currencies yet.", ar: "لا توجد عملات بعد." },
  confirm_delete_currency: { en: "Delete this currency?", ar: "هل تريد حذف هذه العملة؟" },
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
