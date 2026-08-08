"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

export type CountryOption = { id: number; country: string; currency_code?: string };

export default function CountrySearchSelect({
  currencies,
  selectedId,
  onSelect,
  placeholder = "Search country...",
}: {
  currencies: CountryOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = currencies.find((c) => String(c.id) === selectedId);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const matches = currencies.filter((c) => c.country.toLowerCase().includes(query.toLowerCase())).slice(0, 8);

  return (
    <div className="relative" ref={wrapRef}>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={open ? query : selected?.country || ""}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          placeholder={placeholder}
          className="input w-full pl-8"
        />
      </div>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {matches.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onSelect(String(c.id));
                setOpen(false);
                setQuery("");
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b border-slate-50 last:border-0"
            >
              {c.country} {c.currency_code && <span className="text-slate-400">({c.currency_code})</span>}
            </button>
          ))}
          {matches.length === 0 && <p className="px-3 py-2 text-sm text-slate-400">No match found.</p>}
        </div>
      )}
    </div>
  );
}
