"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Search, UserPlus, X } from "lucide-react";

export type PickedCustomer = {
  id: number;
  customer_name: string;
  phone: string;
  country_code: string | null;
  country_id: number | null;
  country?: { id: number; country: string; currency_code: string } | null;
};

export default function CustomerPicker({
  selected,
  onSelect,
  onCreateNew,
}: {
  selected: PickedCustomer | null;
  onSelect: (customer: PickedCustomer) => void;
  onCreateNew: (typedName: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickedCustomer[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.getCustomers(query.trim());
        setResults(res.customers.data || res.customers);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  if (selected) {
    return (
      <div className="input w-full flex items-center justify-between gap-2 bg-teal-50 border-teal-200">
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 truncate">{selected.customer_name}</div>
          <div className="text-xs text-slate-500">
            {selected.country_code} {selected.phone}
            {selected.country?.country ? ` · ${selected.country.country}` : ""}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null as any)}
          className="text-slate-400 hover:text-slate-700 flex-shrink-0"
          aria-label="Clear customer"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search customer by name or phone..."
          className="input w-full pl-9"
        />
      </div>

      {open && query.trim() && (
        <div className="absolute z-20 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
          {loading && <div className="px-4 py-3 text-sm text-slate-400">Searching...</div>}

          {!loading &&
            results.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => {
                  onSelect(c);
                  setOpen(false);
                  setQuery("");
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-0"
              >
                <div className="font-semibold text-sm text-slate-900">{c.customer_name}</div>
                <div className="text-xs text-slate-500">
                  {c.country_code} {c.phone}
                  {c.country?.country ? ` · ${c.country.country}` : ""}
                </div>
              </button>
            ))}

          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-400">No matching customers.</div>
          )}

          <button
            type="button"
            onClick={() => {
              onCreateNew(query.trim());
              setOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 hover:bg-teal-50 flex items-center gap-2 text-teal-600 font-semibold text-sm"
          >
            <UserPlus size={15} /> Add "{query.trim()}" as a new customer
          </button>
        </div>
      )}
    </div>
  );
}
