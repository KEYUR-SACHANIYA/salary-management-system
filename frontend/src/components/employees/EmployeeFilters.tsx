"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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

const controlSurface =
  "h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-sm font-medium text-slate-700 shadow-sm transition-all duration-150 hover:border-slate-300 hover:bg-white focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-200";

const SEARCH_DEBOUNCE_MS = 300;

type DirectoryQuery = ReturnType<typeof parseDirectorySearchParams>;

function ChevronDown() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="h-4 w-4 text-slate-500"
    >
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
    <section className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white via-slate-50 to-white p-4 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/80 sm:p-5">
      <div className="space-y-4">
        <div className="max-w-[860px]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="w-full max-w-[560px] min-w-0">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                    className="h-4 w-4"
                  >
                    <path
                      d="M8.5 14.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm0 0 6 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>

                <input
                  id="employee-search"
                  type="search"
                  name="search"
                  value={search}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder="Search by name or employee code"
                  autoComplete="off"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all duration-150 placeholder:text-slate-400 hover:border-slate-300 hover:bg-slate-50 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
                />
              </div>
            </div>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearAll}
                className="mt-0.5 inline-flex h-11 shrink-0 items-center justify-center self-start rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              >
                Clear all
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
            <div className="space-y-2">
              <label
                htmlFor="country-filter"
                className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600"
              >
                Country
              </label>

              <div className="relative">
                <select
                  id="country-filter"
                  name="country"
                  value={current.country ?? ""}
                  onChange={(event) => update({ country: event.target.value })}
                  className={`${controlSurface} appearance-none bg-slate-50`}
                >
                  <option value="">All countries</option>

                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>

                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
                  <ChevronDown />
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
            <div className="space-y-2">
              <label
                htmlFor="department-filter"
                className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600"
              >
                Department
              </label>

              <div className="relative">
                <select
                  id="department-filter"
                  name="department"
                  value={current.department ?? ""}
                  onChange={(event) =>
                    update({ department: event.target.value })
                  }
                  className={`${controlSurface} appearance-none bg-slate-50`}
                >
                  <option value="">All departments</option>

                  {DEPARTMENTS.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>

                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
                  <ChevronDown />
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
            <div className="space-y-2">
              <label
                htmlFor="currency-filter"
                className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600"
              >
                Native currency
              </label>

              <div className="relative">
                <select
                  id="currency-filter"
                  name="currency"
                  value={current.currency ?? ""}
                  onChange={(event) =>
                    update({
                      currency: event.target.value as
                        | (typeof SUPPORTED_CURRENCIES)[number]
                        | "",
                    })
                  }
                  className={`${controlSurface} appearance-none bg-slate-50`}
                >
                  <option value="">All currencies</option>

                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>

                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
                  <ChevronDown />
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
            <div className="space-y-2">
              <label
                htmlFor="pay-frequency-filter"
                className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600"
              >
                Pay frequency
              </label>

              <div className="relative">
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
                  className={`${controlSurface} appearance-none bg-slate-50`}
                >
                  <option value="">All frequencies</option>

                  {PAY_FREQUENCIES.map((frequency) => (
                    <option key={frequency} value={frequency}>
                      {formatPayFrequency(frequency)}
                    </option>
                  ))}
                </select>

                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
                  <ChevronDown />
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
            <div className="space-y-2">
              <label
                htmlFor="page-size-filter"
                className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600"
              >
                Rows per page
              </label>

              <div className="relative">
                <select
                  id="page-size-filter"
                  name="pageSize"
                  value={String(current.pageSize ?? DEFAULT_PAGE_SIZE)}
                  onChange={(event) =>
                    update({
                      pageSize: Number(event.target.value),
                    })
                  }
                  className={`${controlSurface} appearance-none bg-slate-50`}
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>

                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
                  <ChevronDown />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
