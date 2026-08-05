"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import {
  Coins, Send, Receipt, Shuffle, RotateCcw, Wallet,
  Landmark, UserCog, Percent, MapPin, KeyRound, Users, BarChart3, Search, Calculator,
} from "lucide-react";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  adminOnly?: boolean;
  hiddenForRoles?: string[];
};

const items: Item[] = [
  { href: "/account", label: "My Account", icon: KeyRound },
  { href: "/track", label: "Track Invoice", icon: Search },
  { href: "/buying-calculator", label: "Buying Calculator", icon: Calculator },
  { href: "/staff-transfers", label: "Staff Transfers", icon: Send },
  { href: "/customers", label: "Customers", icon: Users, hiddenForRoles: ["personnel", "personnel2"] },
  { href: "/reports", label: "Reports", icon: BarChart3, hiddenForRoles: ["personnel", "personnel2"] },
  { href: "/cash-movement", label: "Cash Movement", icon: Wallet, adminOnly: true },
  { href: "/refunds", label: "Refunds", icon: RotateCcw, hiddenForRoles: ["personnel", "personnel2", "cashier"] },
  { href: "/currencies", label: "Currencies", icon: Coins, hiddenForRoles: ["personnel", "personnel2", "cashier"] },
  { href: "/currency-groups", label: "Currency Corridors", icon: Shuffle, hiddenForRoles: ["personnel", "personnel2", "cashier"] },
  { href: "/special-rates", label: "Special Rates", icon: Percent, adminOnly: true },
  { href: "/chad-regions", label: "Chad Regions", icon: MapPin, adminOnly: true },
  { href: "/partner-ledger", label: "Partner Ledgers", icon: Landmark, adminOnly: true },
  { href: "/expenses", label: "Expenses / Funding", icon: Receipt, hiddenForRoles: ["personnel", "personnel2", "cashier"] },
  { href: "/staff", label: "Staff", icon: UserCog, adminOnly: true },
];

export default function MorePage() {
  const [myRole, setMyRole] = useState<string | null>(null); // null = not known yet

  useEffect(() => {
    api.me().then((res) => setMyRole(res.user.role)).catch(() => {});
  }, []);

  const roleLoaded = myRole !== null;
  const isAdmin = myRole === "admin";

  function isVisible(item: Item): boolean {
    if (!item.adminOnly && !item.hiddenForRoles) return true;
    if (!roleLoaded) return false;
    if (item.adminOnly && !isAdmin) return false;
    if (item.hiddenForRoles && myRole && item.hiddenForRoles.includes(myRole)) return false;
    return true;
  }

  const visible = items.filter(isVisible);

  return (
    <AppShell title="More" subtitle="Everything else in one place">
      <div className="grid grid-cols-2 gap-3">
        {visible.map((item) => {
          const Icon = item.icon;
          return (
            <a key={item.href} href={item.href} className="quick-link">
              <Icon size={22} strokeWidth={2} className="text-teal-600" />
              {item.label}
            </a>
          );
        })}
      </div>
    </AppShell>
  );
}
