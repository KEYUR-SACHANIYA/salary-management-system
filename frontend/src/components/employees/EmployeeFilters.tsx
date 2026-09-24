"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  COUNTRIES,
  DEPARTMENTS,
  PAGE_SIZE_OPTIONS,
  PAY_FREQUENCIES,
  SUPPORTED_CURRENCIES,
} from "@/lib/constants";
import {
  applyDirectoryUpdates,
  directoryHref,
  parseDirectorySearchParams,
} from "@/lib/employee-directory-query";
import { formatPayFrequency } from "@/lib/formatting";
import { Field, inputClassName, selectClassName } from "@/components/ui/Field";

export function EmployeeFilters({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const router = useRouter();
  const current = parseDirectorySearchParams(searchParams);
  const currentRef = useRef(current);
  const [search, setSearch] = useState(current.search ?? "");
  currentRef.current = current;

  useEffect(() => {
    setSearch(current.search ?? "");
  }, [current.search]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const latest = currentRef.current;
      const nextSearch = search.trim();
      if (nextSearch === (latest.search ?? "")) {
        return;
      }

      router.replace(
        directoryHref(
          applyDirectoryUpdates(latest, { search: nextSearch }, { resetPage: true }),
        ),
      );
    }, 300);

    return () => window.clearTimeout(handle);
  }, [search, router]);

  function update(
    updates: Parameters<typeof applyDirectoryUpdates>[1],
    resetPage = true,
  ) {
    router.replace(
      directoryHref(applyDirectoryUpdates(current, updates, { resetPage })),
    );
  }

  return (
    <form
      className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3"
      onSubmit={(event) => event.preventDefault()}
    >
      <Field id="employee-search" label="Search" hint="Name or employee code">
        <input
          id="employee-search"
          type="search"
          name="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or code"
          autoComplete="off"
          className={inputClassName()}
        />
      </Field>

      <Field id="country-filter" label="Country">
        <select
          id="country-filter"
          name="country"
          value={current.country ?? ""}
          onChange={(event) => update({ country: event.target.value })}
          className={selectClassName()}
        >
          <option value="">All countries</option>
          {COUNTRIES.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </Field>

      <Field id="department-filter" label="Department">
        <select
          id="department-filter"
          name="department"
          value={current.department ?? ""}
          onChange={(event) => update({ department: event.target.value })}
          className={selectClassName()}
        >
          <option value="">All departments</option>
          {DEPARTMENTS.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
      </Field>

      <Field id="currency-filter" label="Native currency">
        <select
          id="currency-filter"
          name="currency"
          value={current.currency ?? ""}
          onChange={(event) =>
            update({
              currency: event.target.value as (typeof SUPPORTED_CURRENCIES)[number] | "",
            })
          }
          className={selectClassName()}
        >
          <option value="">All currencies</option>
          {SUPPORTED_CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
      </Field>

      <Field id="pay-frequency-filter" label="Pay frequency">
        <select
          id="pay-frequency-filter"
          name="payFrequency"
          value={current.payFrequency ?? ""}
          onChange={(event) =>
            update({
              payFrequency: event.target.value as
                | (typeof PAY_FREQUENCIES)[number]
                | "",
            })
          }
          className={selectClassName()}
        >
          <option value="">All frequencies</option>
          {PAY_FREQUENCIES.map((frequency) => (
            <option key={frequency} value={frequency}>
              {formatPayFrequency(frequency)}
            </option>
          ))}
        </select>
      </Field>

      <Field id="page-size-filter" label="Rows per page">
        <select
          id="page-size-filter"
          name="pageSize"
          value={String(current.pageSize ?? 20)}
          onChange={(event) =>
            update({ pageSize: Number(event.target.value) })
          }
          className={selectClassName()}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </Field>
    </form>
  );
}
