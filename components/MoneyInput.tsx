"use client";

import { useState, useEffect } from "react";

const formatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });

function clean(raw: string): string {
  // Keep digits and at most one decimal point — strips commas, letters, etc.
  const stripped = raw.replace(/[^\d.]/g, "");
  const parts = stripped.split(".");
  return parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : stripped;
}

function display(clean_value: string): string {
  if (!clean_value) return "";
  const [whole, decimal] = clean_value.split(".");
  const wholeFormatted = whole ? formatter.format(Number(whole)) : "0";
  return decimal !== undefined ? `${wholeFormatted}.${decimal}` : wholeFormatted;
}

export default function MoneyInput({
  value,
  onChange,
  placeholder = "0.00",
  className = "input",
  required,
  disabled,
}: {
  value: string;
  onChange: (rawValue: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(display(value));

  // Keep in sync if the parent resets/changes value externally (e.g. form reset).
  useEffect(() => {
    setDisplayValue(display(value));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cleaned = clean(e.target.value);
    setDisplayValue(display(cleaned));
    onChange(cleaned);
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      required={required}
      disabled={disabled}
    />
  );
}
