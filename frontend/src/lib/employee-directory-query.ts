import {
  COUNTRIES,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_REPORTING_CURRENCY,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
  DEPARTMENTS,
  EMPLOYEE_SORT_FIELDS,
  MAX_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  PAY_FREQUENCIES,
  SUPPORTED_CURRENCIES,
  type Currency,
  type EmployeeSortField,
  type PayFrequency,
  type SortOrder,
} from "./constants";
import type { EmployeeListParams } from "@/types/employees";

type SearchParamValue = string | string[] | undefined;
type SearchParamsRecord = Record<string, SearchParamValue>;

function firstValue(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function isOneOf<T extends string>(
  value: string,
  allowed: readonly T[],
): value is T {
  return (allowed as readonly string[]).includes(value);
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value || !/^[1-9]\d*$/.test(value)) {
    return fallback;
  }
  return Number(value);
}

export function parseDirectorySearchParams(
  searchParams: SearchParamsRecord,
): EmployeeListParams {
  const search = firstValue(searchParams.search)?.trim();
  const country = firstValue(searchParams.country);
  const department = firstValue(searchParams.department);
  const currency = firstValue(searchParams.currency);
  const payFrequency = firstValue(searchParams.payFrequency);
  const sortBy = firstValue(searchParams.sortBy);
  const sortOrder = firstValue(searchParams.sortOrder);
  const reportingCurrency = firstValue(searchParams.reportingCurrency);

  let pageSize = parsePositiveInt(
    firstValue(searchParams.pageSize),
    DEFAULT_PAGE_SIZE,
  );
  if (pageSize > MAX_PAGE_SIZE) {
    pageSize = MAX_PAGE_SIZE;
  }
  if (
    !PAGE_SIZE_OPTIONS.includes(
      pageSize as (typeof PAGE_SIZE_OPTIONS)[number],
    )
  ) {
    pageSize = DEFAULT_PAGE_SIZE;
  }

  return {
    page: parsePositiveInt(firstValue(searchParams.page), DEFAULT_PAGE),
    pageSize,
    search: search ? search : undefined,
    country:
      country && isOneOf(country, COUNTRIES) ? country : undefined,
    department:
      department && isOneOf(department, DEPARTMENTS)
        ? department
        : undefined,
    currency:
      currency && isOneOf(currency, SUPPORTED_CURRENCIES)
        ? currency
        : undefined,
    payFrequency:
      payFrequency && isOneOf(payFrequency, PAY_FREQUENCIES)
        ? payFrequency
        : undefined,
    sortBy:
      sortBy && isOneOf(sortBy, EMPLOYEE_SORT_FIELDS)
        ? sortBy
        : DEFAULT_SORT_BY,
    sortOrder:
      sortOrder === "asc" || sortOrder === "desc"
        ? sortOrder
        : DEFAULT_SORT_ORDER,
    reportingCurrency:
      reportingCurrency && isOneOf(reportingCurrency, SUPPORTED_CURRENCIES)
        ? reportingCurrency
        : DEFAULT_REPORTING_CURRENCY,
  };
}

export function toDirectoryQueryString(params: EmployeeListParams): string {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.country) searchParams.set("country", params.country);
  if (params.department) searchParams.set("department", params.department);
  if (params.currency) searchParams.set("currency", params.currency);
  if (params.payFrequency) {
    searchParams.set("payFrequency", params.payFrequency);
  }
  if (params.sortBy && params.sortBy !== DEFAULT_SORT_BY) {
    searchParams.set("sortBy", params.sortBy);
  }
  if (params.sortOrder && params.sortOrder !== DEFAULT_SORT_ORDER) {
    searchParams.set("sortOrder", params.sortOrder);
  }
  if (params.page && params.page !== DEFAULT_PAGE) {
    searchParams.set("page", String(params.page));
  }
  if (params.pageSize && params.pageSize !== DEFAULT_PAGE_SIZE) {
    searchParams.set("pageSize", String(params.pageSize));
  }
  if (
    params.reportingCurrency &&
    params.reportingCurrency !== DEFAULT_REPORTING_CURRENCY
  ) {
    searchParams.set("reportingCurrency", params.reportingCurrency);
  }

  return searchParams.toString();
}

export function applyDirectoryUpdates(
  current: EmployeeListParams,
  updates: {
    search?: string;
    country?: string;
    department?: string;
    currency?: Currency | "";
    payFrequency?: PayFrequency | "";
    sortBy?: EmployeeSortField | "";
    sortOrder?: SortOrder | "";
    page?: number;
    pageSize?: number;
  },
  options?: { resetPage?: boolean },
): EmployeeListParams {
  const next: EmployeeListParams = {
    ...current,
    ...updates,
    search:
      updates.search !== undefined
        ? updates.search.trim() || undefined
        : current.search,
    country:
      updates.country !== undefined
        ? updates.country || undefined
        : current.country,
    department:
      updates.department !== undefined
        ? updates.department || undefined
        : current.department,
    currency:
      updates.currency !== undefined
        ? updates.currency || undefined
        : current.currency,
    payFrequency:
      updates.payFrequency !== undefined
        ? updates.payFrequency || undefined
        : current.payFrequency,
    sortBy:
      updates.sortBy !== undefined
        ? updates.sortBy || DEFAULT_SORT_BY
        : current.sortBy,
    sortOrder:
      updates.sortOrder !== undefined
        ? updates.sortOrder || DEFAULT_SORT_ORDER
        : current.sortOrder,
  };

  if (options?.resetPage !== false && updates.page === undefined) {
    next.page = DEFAULT_PAGE;
  }

  if (updates.page !== undefined) {
    next.page = updates.page;
  }

  if (updates.pageSize !== undefined) {
    next.pageSize = updates.pageSize || DEFAULT_PAGE_SIZE;
  }

  return next;
}

export function directoryHref(params: EmployeeListParams): string {
  const query = toDirectoryQueryString(params);
  return query ? `/employees?${query}` : "/employees";
}

export function parseReportingCurrencyParam(
  value: SearchParamValue,
): Currency {
  const currency = firstValue(value);
  if (currency && isOneOf(currency, SUPPORTED_CURRENCIES)) {
    return currency;
  }
  return DEFAULT_REPORTING_CURRENCY;
}
