"use client";

import { useRouter } from "next/navigation";
import { Field, selectClassName } from "@/components/ui/Field";
import { DEFAULT_REPORTING_CURRENCY, SUPPORTED_CURRENCIES, type Currency } from "@/lib/constants";

export function ReportingCurrencySelect({
  value,
}: {
  value: Currency;
}) {
  const router = useRouter();

  return (
    <Field id="reportingCurrency" label="Reporting currency">
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
        className={selectClassName("max-w-xs")}
      >
        {SUPPORTED_CURRENCIES.map((currency) => (
          <option key={currency} value={currency}>
            {currency}
          </option>
        ))}
      </select>
    </Field>
  );
}
