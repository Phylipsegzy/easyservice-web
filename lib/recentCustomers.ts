"use client";

import { PickedCustomer } from "@/components/CustomerPicker";

const MAX_RECENT = 5;

function storageKey(userId: number) {
  return `recent_customers_${userId}`;
}

export function getRecentCustomers(userId: number): PickedCustomer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentCustomer(userId: number, customer: PickedCustomer) {
  if (typeof window === "undefined") return;
  const existing = getRecentCustomers(userId).filter((c) => c.id !== customer.id);
  const next = [customer, ...existing].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    // storage full or unavailable — recent customers is a convenience, not critical
  }
}
