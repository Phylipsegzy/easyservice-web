"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppShell, { desktopNavItems, type NavItem } from "@/components/AppShell";

// Items already reachable from the mobile bottom bar don't need to appear
// here again — everything else in desktopNavItems does.
const bottomBarHrefs = new Set(["/dashboard", "/transactions", "/payment-status", "/statement"]);
const items: NavItem[] = desktopNavItems.filter((item) => !bottomBarHrefs.has(item.href));

export default function MorePage() {
  const [myRole, setMyRole] = useState<string | null>(null); // null = not known yet

  useEffect(() => {
    api.me().then((res) => setMyRole(res.user.role)).catch(() => {});
  }, []);

  const roleLoaded = myRole !== null;
  const isAdmin = myRole === "admin";

  function isVisible(item: NavItem): boolean {
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
