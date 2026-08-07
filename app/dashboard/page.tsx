"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { useLanguage } from "@/lib/i18n";
import { ArrowLeftRight, Users, Coins, Send, Receipt, BarChart3, Wallet } from "lucide-react";

const shortcuts = [
  { href: "/transactions/new", labelKey: "new_transaction", icon: ArrowLeftRight, color: "from-teal-500 to-teal-600" },
  { href: "/customers", labelKey: "customers", icon: Users, color: "from-violet-500 to-violet-600", hiddenForRoles: ["personnel", "personnel2"] },
  { href: "/currencies", labelKey: "currencies", icon: Coins, color: "from-amber-500 to-amber-600", hiddenForRoles: ["personnel", "personnel2", "cashier"] },
  { href: "/staff-transfers", labelKey: "staff_transfers", icon: Send, color: "from-sky-500 to-sky-600" },
  { href: "/expenses", labelKey: "expenses", icon: Receipt, color: "from-rose-500 to-rose-600", hiddenForRoles: ["personnel", "personnel2", "cashier"] },
  { href: "/reports", labelKey: "reports", icon: BarChart3, color: "from-emerald-500 to-emerald-600", hiddenForRoles: ["personnel", "personnel2"] },
];

export default function DashboardPage() {
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .me()
      .then((res) => setUser(res.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppShell>
        <p className="text-slate-400 text-sm">{t("loading")}</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`${t("welcome")}, ${user?.name}`}
      subtitle={`${typeof user?.role === "string" ? user.role : user?.role?.name} · ${user?.location || "—"}`}
    >
      {user?.wallet !== undefined && (
        <div className="rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 text-white p-5 mb-6 shadow-lg shadow-teal-900/10 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <Wallet size={22} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-teal-100">{t("your_wallet_balance")}</div>
            <div className="text-2xl font-bold mt-0.5">{Number(user.wallet).toLocaleString()}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {shortcuts
          .filter((s) => !(s as any).hiddenForRoles?.includes(user?.role))
          .map((s) => {
            const Icon = s.icon;
            return (
              <a key={s.href} href={s.href} className="quick-link">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-sm`}>
                  <Icon size={20} strokeWidth={2.2} className="text-white" />
                </div>
                {t(s.labelKey)}
              </a>
            );
          })}
      </div>
    </AppShell>
  );
}
