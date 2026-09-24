"use client";

import { useRouter } from "next/navigation";
import { Field, selectClassName } from "@/components/ui/Field";
import {
  DEFAULT_REPORTING_CURRENCY,
  SUPPORTED_CURRENCIES,
  type Currency,
} from "@/lib/constants";

export function ReportingCurrencySelect({
  value,
}: {
  value: Currency;
}) {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
      <Field id="reportingCurrency" label="Reporting currency">
        <div className="relative mt-1.5">
          <select
            id="reportingCurrency"
            name="reportingCurrency"
            value={value}
            onChange={(event) => {
              const next = event.target.value as Currency;
              if (next === DEFAULT_REPORTING_CURRENCY) {
                router.replace("/");
                return;
              }
              router.replace(`/?reportingCurrency=${next}`);
            }}
            className={selectClassName("w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm font-medium text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-white focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200 active:border-slate-400")}
            aria-label="Reporting currency"
          >
            {SUPPORTED_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M5.25 7.5 10 12.25 14.75 7.5H5.25Z" />
            </svg>
          </span>
        </div>
      </Field>
    </div>
  );
}
