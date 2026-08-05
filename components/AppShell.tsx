"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, clearToken } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import NotificationBell from "@/components/NotificationBell";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  BarChart3,
  Grid2x2,
  Coins,
  Send,
  Receipt,
  LogOut,
  FileText,
  Shuffle,
  RotateCcw,
  DollarSign,
  Wallet,
  Landmark,
  UserCog,
  Percent,
  MapPin,
  KeyRound,
  Search,
  Calculator,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  key?: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  adminOnly?: boolean;
  hiddenForRoles?: string[];
};

const mobileNavItems: NavItem[] = [
  { href: "/dashboard", label: "Home", key: "dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transact", key: "transactions", icon: ArrowLeftRight },
  { href: "/payment-status", label: "Payments", key: "payment_status", icon: DollarSign },
  { href: "/statement", label: "Statement", key: "statements", icon: FileText },
  { href: "/more", label: "More", icon: Grid2x2 },
];

const desktopNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", key: "transactions", icon: ArrowLeftRight },
  { href: "/payment-status", label: "Payment Status", key: "payment_status", icon: DollarSign },
  { href: "/statement", label: "Statements", key: "statements", icon: FileText },
  { href: "/track", label: "Track Invoice", key: "track_invoice", icon: Search },
  { href: "/buying-calculator", label: "Buying Calculator", key: "buying_calculator", icon: Calculator },
  { href: "/account", label: "My Account", key: "my_account", icon: KeyRound },
  { href: "/cash-movement", label: "Cash Movement", key: "cash_movement", icon: Wallet, adminOnly: true },
  { href: "/refunds", label: "Refunds", key: "refunds", icon: RotateCcw, hiddenForRoles: ["personnel", "personnel2", "cashier"] },
  { href: "/customers", label: "Customers", key: "customers", icon: Users, hiddenForRoles: ["personnel", "personnel2"] },
  { href: "/currencies", label: "Currencies", key: "currencies", icon: Coins, hiddenForRoles: ["personnel", "personnel2", "cashier"] },
  { href: "/currency-groups", label: "Currency Corridors", key: "currency_corridors", icon: Shuffle, hiddenForRoles: ["personnel", "personnel2", "cashier"] },
  { href: "/special-rates", label: "Special Rates", key: "special_rates", icon: Percent, adminOnly: true },
  { href: "/chad-regions", label: "Chad Regions", key: "chad_regions", icon: MapPin, adminOnly: true },
  { href: "/staff-transfers", label: "Staff Transfers", key: "staff_transfers", icon: Send },
  { href: "/partner-ledger", label: "Partner Ledgers", key: "partner_ledgers", icon: Landmark, adminOnly: true },
  { href: "/expenses", label: "Expenses / Funding", key: "expenses", icon: Receipt, hiddenForRoles: ["personnel", "personnel2", "cashier"] },
  { href: "/reports", label: "Reports", key: "reports", icon: BarChart3, hiddenForRoles: ["personnel", "personnel2"] },
  { href: "/staff", label: "Staff", key: "staff", icon: UserCog, adminOnly: true },
];

export default function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [myRole, setMyRole] = useState<string | null>(null); // null = not known yet
  const { t, setLang, dir } = useLanguage();

  useEffect(() => {
    api.me().then((res) => {
      setMyRole(res.user.role);
      if (res.user.language === "ar" || res.user.language === "en") setLang(res.user.language);
    }).catch(() => {});
  }, [setLang]);

  const isAdmin = myRole === "admin";
  const roleLoaded = myRole !== null;

  // Items with no restrictions show immediately (no flash — they're the same for
  // everyone). Restricted items only appear once the role is actually confirmed —
  // never shown-then-hidden, never hidden-then-shown, for any role.
  function isVisible(item: NavItem): boolean {
    if (!item.adminOnly && !item.hiddenForRoles) return true;
    if (!roleLoaded) return false;
    if (item.adminOnly && !isAdmin) return false;
    if (item.hiddenForRoles && myRole && item.hiddenForRoles.includes(myRole)) return false;
    return true;
  }

  const visibleDesktopNav = desktopNavItems.filter(isVisible);
  const visibleMobileNav = mobileNavItems.filter(isVisible);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  // Real flexbox two-column layout (sidebar + content as true siblings) instead of
  // fixed-position + padding-left — that combo was the root cause of the sidebar/
  // content overlap: any drift between the sidebar's actual width and the content's
  // padding-left (or a stray z-index) let them collide. Flexbox can't drift.
  return (
    <div className="min-h-screen flex bg-slate-50" dir={dir}>
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex md:flex-col md:w-64 md:h-screen md:sticky md:top-0 md:flex-shrink-0 bg-white border-slate-200 px-3 py-6 ${dir === "rtl" ? "border-l" : "border-r"}`}>
        <div className="flex items-center justify-between px-3 mb-8 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-bold text-sm shadow-sm">ES</div>
            <span className="font-bold text-slate-900 tracking-tight">EasyService</span>
          </div>
          <NotificationBell />
        </div>
        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto min-h-0">
          {visibleDesktopNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors no-underline ${
                  active
                    ? "bg-gradient-to-r from-teal-50 to-teal-50/40 text-teal-700 shadow-[inset_2px_0_0_theme(colors.teal.600)]"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon size={18} strokeWidth={2.2} />
                {item.key ? t(item.key) : item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="flex-shrink-0 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} strokeWidth={2.2} />
          {t("log_out")}
        </button>
      </aside>

      {/* Content column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-bold text-xs">ES</div>
            <span className="font-bold text-slate-900 text-sm">EasyService</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button onClick={handleLogout} className="text-slate-400 p-1">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 min-w-0 px-4 py-5 md:px-8 md:py-8 pb-24 md:pb-8 w-full max-w-7xl mx-auto">
          {title && (
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-0.5">{title}</h1>
                {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
              </div>
              {actions && <div className="flex-shrink-0">{actions}</div>}
            </div>
          )}
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-slate-200 flex justify-around pt-1.5 pb-[calc(env(safe-area-inset-bottom)+6px)]">
          {visibleMobileNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href === "/more" && ["/currencies", "/staff-transfers", "/expenses"].includes(pathname));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold no-underline ${
                  active ? "text-teal-600" : "text-slate-400"
                }`}
              >
                <Icon size={21} strokeWidth={2.2} />
                {item.key ? t(item.key) : item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
