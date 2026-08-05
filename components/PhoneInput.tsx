"use client";

import { countryCodes } from "@/lib/countryCodes";

export default function PhoneInput({
  countryCode,
  phone,
  onCountryCodeChange,
  onPhoneChange,
  required = false,
}: {
  countryCode: string;
  phone: string;
  onCountryCodeChange: (dial: string) => void;
  onPhoneChange: (phone: string) => void;
  required?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <select
        value={countryCode}
        onChange={(e) => onCountryCodeChange(e.target.value)}
        className="input"
        style={{ maxWidth: 110, flexShrink: 0 }}
        aria-label="Country code"
      >
        <option value="">Code</option>
        {countryCodes.map((c) => (
          <option key={`${c.iso2}-${c.dial}`} value={c.dial}>
            {c.flag} {c.dial}
          </option>
        ))}
      </select>
      <input
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value.replace(/[^\d\s-]/g, ""))}
        placeholder="Phone number"
        required={required}
        className="input w-full"
        inputMode="tel"
      />
    </div>
  );
}
