export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export const SUPPORTED_CURRENCIES = [
  "USD",
  "INR",
  "GBP",
  "EUR",
  "CAD",
  "SGD",
] as const;

export const PAY_FREQUENCIES = [
  "ANNUALLY",
  "MONTHLY",
  "WEEKLY",
  "HOURLY",
] as const;

export const CHANGE_REASONS = [
  "HIRE",
  "ANNUAL_REVIEW",
  "PROMOTION",
  "MARKET_ADJUSTMENT",
  "CORRECTION",
  "ROLE_CHANGE",
] as const;

export const COMPENSATION_STATUSES = [
  "CURRENT",
  "FUTURE",
  "HISTORICAL",
] as const;

export const EMPLOYEE_SORT_FIELDS = [
  "name",
  "employeeCode",
  "salary",
] as const;

export const COUNTRIES = [
  "Canada",
  "Germany",
  "India",
  "Singapore",
  "United Kingdom",
  "United States",
] as const;

export const DEPARTMENTS = [
  "Customer Support",
  "Engineering",
  "Finance",
  "Marketing",
  "Operations",
  "People",
  "Product",
  "Sales",
] as const;

export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_SORT_BY = "employeeCode";
export const DEFAULT_SORT_ORDER = "asc";
export const DEFAULT_REPORTING_CURRENCY = "USD";

export const FX_RATE_DATE = "2026-09-23";

/** Units of each currency per 1 USD, fixed on FX_RATE_DATE. */
export const FX_RATES_PER_USD: Record<Currency, string> = {
  USD: "1.00",
  INR: "95.72",
  GBP: "0.75",
  EUR: "0.88",
  CAD: "1.41",
  SGD: "1.28",
};

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];
export type PayFrequency = (typeof PAY_FREQUENCIES)[number];
export type ChangeReason = (typeof CHANGE_REASONS)[number];
export type CompensationStatus = (typeof COMPENSATION_STATUSES)[number];
export type EmployeeSortField = (typeof EMPLOYEE_SORT_FIELDS)[number];
export type Country = (typeof COUNTRIES)[number];
export type Department = (typeof DEPARTMENTS)[number];
export type SortOrder = "asc" | "desc";
