"use client";

import { Check } from "lucide-react";

export default function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number; // 1-based
}) {
  return (
    <div className="flex items-center mb-6 max-w-xl">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                  done
                    ? "bg-teal-600 text-white"
                    : active
                    ? "bg-teal-600 text-white ring-4 ring-teal-100"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {done ? <Check size={15} strokeWidth={3} /> : stepNum}
              </div>
              <span className={`text-[11px] font-semibold whitespace-nowrap ${active ? "text-teal-600" : "text-slate-400"}`}>
                {label}
              </span>
            </div>
            {stepNum < steps.length && (
              <div className={`h-0.5 flex-1 mx-2 rounded transition-colors ${done ? "bg-teal-600" : "bg-slate-100"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
