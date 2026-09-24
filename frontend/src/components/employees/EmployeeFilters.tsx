"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  COUNTRIES,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_REPORTING_CURRENCY,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
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

const SEARCH_DEBOUNCE_MS = 300;

type DirectoryQuery = ReturnType<typeof parseDirectorySearchParams>;

/* -------------------------------------------------------------------------- */
/*  Presentational pieces (UI only)                                           */
/* -------------------------------------------------------------------------- */

function ChevronDown() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M5.25 7.5 10 12.25 14.75 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="h-[18px] w-[18px]"
    >
      <circle
        cx="8.5"
        cy="8.5"
        r="5.75"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m13 13 4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="h-[18px] w-[18px] animate-spin motion-reduce:animate-none"
    >
      <circle
        cx="10"
        cy="10"
        r="7.25"
        stroke="currentColor"
        strokeWidth="1.75"
        className="opacity-20"
      />
      <path
        d="M17.25 10A7.25 7.25 0 0 0 10 2.75"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="m6 6 8 8M14 6l-8 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FilterSelect({
  id,
  name,
  label,
  value,
  onChange,
  active = false,
  children,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Highlights the field when it is narrowing the results. */
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className={`mb-1.5 flex items-center gap-1.5 text-xs font-medium transition-colors duration-150 ${
          active ? "text-teal-700" : "text-slate-500"
        }`}
      >
        {active ? (
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-teal-500"
          />
        ) : null}
        {label}
      </label>

      <div className="relative">
        <select
          id={id}
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`h-11 w-full appearance-none rounded-lg border pl-3 pr-9 text-sm font-medium shadow-sm outline-none transition-colors duration-150 focus:ring-4 sm:h-10 ${
            active
              ? "border-teal-500/60 bg-teal-50 text-teal-900 hover:border-teal-600 focus:border-teal-600 focus:ring-teal-100"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 focus:border-slate-400 focus:ring-slate-200/70"
          }`}
        >
          {children}
        </select>

        <span
          className={`pointer-events-none absolute inset-y-0 right-3 flex items-center transition-colors duration-150 ${
            active ? "text-teal-700" : "text-slate-400"
          }`}
        >
          <ChevronDown />
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function EmployeeFilters({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const router = useRouter();
  const current = parseDirectorySearchParams(searchParams);

  /**
   * Single source of truth = the URL.
   *
   * `search` is only a local *draft* of the URL's search value so the input
   * stays instantly responsive while typing. The draft is pushed to the URL
   * (which is what the server/API reads) after a debounce, and the URL is
   * always pushed back into the draft once navigation has settled.
   *
   * `isPending` is true for as long as a router navigation is in flight, so we
   * never let an older, stale URL overwrite what the user is typing.
   */
  const [search, setSearch] = useState(current.search ?? "");
  const [isPending, startTransition] = useTransition();

  const currentRef = useRef<DirectoryQuery>(current);
  const searchRef = useRef(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Keep the latest URL state available to callbacks / timers.
  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  function cancelDebounce() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }

  function setDraft(value: string) {
    setSearch(value);
    searchRef.current = value;
  }

  /**
   * The ONLY place that navigates. Always goes through a transition so we know
   * when navigation is in flight (`isPending`).
   */
  function navigate(next: DirectoryQuery) {
    startTransition(() => {
      router.replace(directoryHref(next), { scroll: false });
    });
  }

  /**
   * URL -> input.
   *
   * Runs when the URL search changes or when a navigation settles. It is
   * skipped while:
   *  - a debounce is waiting (user is still typing), or
   *  - a navigation is in flight (URL is stale compared to what we pushed).
   *
   * Once everything is settled, the input is forced to match the URL, which is
   * what guarantees input === URL === API query.
   */
  useEffect(() => {
    if (debounceRef.current || isPending) {
      return;
    }

    const urlSearch = current.search ?? "";

    // Compare trimmed so a trailing space the user is typing is not stripped.
    if (urlSearch !== searchRef.current.trim()) {
      setDraft(urlSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.search, isPending]);

  // Cleanup pending debounce on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  /**
   * Search input -> URL -> API.
   *
   * The input updates immediately; only the latest value is committed after
   * the debounce. An empty value is committed as "no search" so clearing the
   * input clears the URL param and the API filter as well.
   */
  function handleSearchChange(value: string) {
    setDraft(value);
    cancelDebounce();

    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;

      const nextSearch = searchRef.current.trim();

      const next = applyDirectoryUpdates(
        currentRef.current,
        { search: nextSearch },
        { resetPage: true },
      );

      // Explicitly force the search value so it can never fall back to the
      // previous URL value, no matter how applyDirectoryUpdates treats
      // empty / undefined values.
      navigate({ ...next, search: nextSearch || undefined });
    }, SEARCH_DEBOUNCE_MS);
  }

  /**
   * Any other filter change.
   *
   * Flushes the pending search draft so the URL / API always receives the
   * same search value that is visible in the input.
   */
  function update(
    updates: Parameters<typeof applyDirectoryUpdates>[1],
    resetPage = true,
  ) {
    cancelDebounce();

    const draftSearch = searchRef.current.trim();

    const next = applyDirectoryUpdates(currentRef.current, updates, {
      resetPage,
    });

    navigate({ ...next, search: draftSearch || undefined });
  }

  const hasActiveFilters =
    Boolean(search.trim()) ||
    Boolean(current.search) ||
    Boolean(current.country) ||
    Boolean(current.department) ||
    Boolean(current.currency) ||
    Boolean(current.payFrequency) ||
    current.pageSize !== DEFAULT_PAGE_SIZE ||
    current.page !== DEFAULT_PAGE ||
    current.sortBy !== DEFAULT_SORT_BY ||
    current.sortOrder !== DEFAULT_SORT_ORDER;

  /** Number of filters currently narrowing the list (shown on Clear all). */
  const activeCount = [
    search.trim() || current.search,
    current.country,
    current.department,
    current.currency,
    current.payFrequency,
  ].filter(Boolean).length;

  /**
   * Clear all directory filters/search.
   *
   * Cancels any pending search debounce first so an older search value cannot
   * fire after Clear all, then resets input and URL together.
   */
  function clearAll() {
    cancelDebounce();

    if (!hasActiveFilters) {
      return;
    }

    setDraft("");

    navigate({
      page: DEFAULT_PAGE,
      pageSize: DEFAULT_PAGE_SIZE,
      search: undefined,
      country: undefined,
      department: undefined,
      currency: undefined,
      payFrequency: undefined,
      sortBy: DEFAULT_SORT_BY,
      sortOrder: DEFAULT_SORT_ORDER,
      reportingCurrency:
        currentRef.current.reportingCurrency ?? DEFAULT_REPORTING_CURRENCY,
    });
  }

  return (
    <section
      role="search"
      aria-label="Employee directory filters"
      aria-busy={isPending}
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-20px_rgba(15,23,42,0.28)]"
    >
      {/* Loading line: visible only while a navigation is in flight */}
      <div
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-0.5 bg-teal-500 transition-opacity duration-200 ${
          isPending
            ? "animate-pulse opacity-100 motion-reduce:animate-none"
            : "opacity-0"
        }`}
      />

      {/* Search */}
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="relative w-full min-w-0 sm:max-w-xl">
          <label htmlFor="employee-search" className="sr-only">
            Search employees
          </label>

          <span
            className={`pointer-events-none absolute inset-y-0 left-4 flex items-center transition-colors duration-150 ${
              isPending ? "text-teal-600" : "text-slate-400"
            }`}
          >
            {isPending ? <Spinner /> : <SearchIcon />}
          </span>

          <input
            ref={inputRef}
            id="employee-search"
            type="search"
            name="search"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search by name or employee code"
            autoComplete="off"
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-11 text-sm font-medium text-slate-900 transition-colors duration-150 placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-100 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
          />

          {search ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                handleSearchChange("");
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/70 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
            >
              <CloseIcon />
            </button>
          ) : null}
        </div>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 sm:self-auto"
          >
            <CloseIcon className="h-3.5 w-3.5 text-slate-400" />
            Clear all
            {activeCount > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-600 px-1.5 text-[11px] font-semibold leading-none text-white">
                {activeCount}
              </span>
            ) : null}
          </button>
        ) : null}
      </div>

      {/* Filters */}
      <div className="border-t border-slate-200 bg-slate-50/70 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <FilterSelect
            id="country-filter"
            name="country"
            label="Country"
            value={current.country ?? ""}
            active={Boolean(current.country)}
            onChange={(value) => update({ country: value })}
          >
            <option value="">All countries</option>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            id="department-filter"
            name="department"
            label="Department"
            value={current.department ?? ""}
            active={Boolean(current.department)}
            onChange={(value) => update({ department: value })}
          >
            <option value="">All departments</option>
            {DEPARTMENTS.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            id="currency-filter"
            name="currency"
            label="Native currency"
            value={current.currency ?? ""}
            active={Boolean(current.currency)}
            onChange={(value) =>
              update({
                currency: value as (typeof SUPPORTED_CURRENCIES)[number] | "",
              })
            }
          >
            <option value="">All currencies</option>
            {SUPPORTED_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            id="pay-frequency-filter"
            name="payFrequency"
            label="Pay frequency"
            value={current.payFrequency ?? ""}
            active={Boolean(current.payFrequency)}
            onChange={(value) =>
              update({
                payFrequency: value as (typeof PAY_FREQUENCIES)[number] | "",
              })
            }
          >
            <option value="">All frequencies</option>
            {PAY_FREQUENCIES.map((frequency) => (
              <option key={frequency} value={frequency}>
                {formatPayFrequency(frequency)}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            id="page-size-filter"
            name="pageSize"
            label="Rows per page"
            value={String(current.pageSize ?? DEFAULT_PAGE_SIZE)}
            onChange={(value) => update({ pageSize: Number(value) })}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </FilterSelect>
        </div>
      </div>
    </section>
  );
}
