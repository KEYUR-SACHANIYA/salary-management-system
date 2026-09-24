import type { ChangeReason, CompensationStatus, PayFrequency } from "./constants";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
  GBP: "£",
  EUR: "€",
  CAD: "C$",
  SGD: "S$",
};

export function formatMoney(amount: string, currency: string): string {
  const trimmed = amount.trim();
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [wholeRaw = "0", fractionRaw = ""] = unsigned.split(".");
  const wholeDigits = (wholeRaw.replace(/\D/g, "") || "0").replace(/^0+(?=\d)/, "");
  const groupedWhole = wholeDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const cents = (fractionRaw.replace(/\D/g, "") + "00").slice(0, 2);

  return `${currency} ${negative ? "-" : ""}${groupedWhole}.${cents}`;
}

export function formatCurrencyAmount(amount: string, currency: string): string {
  const trimmed = amount.trim();
  const numeric = Number(trimmed);

  if (!Number.isFinite(numeric)) {
    return `${currency} 0.00`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

export function calculateAnnualizedAmount(
  amount: string,
  payFrequency: PayFrequency,
): number {
  const numeric = Number(amount);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  switch (payFrequency) {
    case "ANNUALLY":
      return numeric;
    case "MONTHLY":
      return numeric * 12;
    case "WEEKLY":
      return numeric * 52;
    case "HOURLY":
      return numeric * 40 * 52;
    default:
      return numeric;
  }
}

export function formatAnnualizedCompensation(
  amount: string,
  currency: string,
  payFrequency: PayFrequency,
): string {
  const annualized = calculateAnnualizedAmount(amount, payFrequency);

  if (annualized <= 0) {
    return "—";
  }

  return `${formatCurrencyAmount(annualized.toFixed(2), currency)} / year`;
}

export function formatCompactCurrency(amount: string, currency: string): string {
  const trimmed = amount.trim();
  const numeric = Number(trimmed);

  if (!Number.isFinite(numeric)) {
    return formatMoney(amount, currency);
  }

  const sign = numeric < 0 ? "-" : "";
  const absolute = Math.abs(numeric);
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;

  if (absolute >= 1_000_000_000) {
    return `${sign}${symbol}${(absolute / 1_000_000_000).toFixed(2).replace(/\.00$/, "")}B`;
  }

  if (absolute >= 1_000_000) {
    return `${sign}${symbol}${(absolute / 1_000_000).toFixed(2).replace(/\.00$/, "")}M`;
  }

  if (absolute >= 1_000) {
    return `${sign}${symbol}${(absolute / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }

  return formatMoney(amount, currency);
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPayFrequency(value: PayFrequency): string {
  switch (value) {
    case "ANNUALLY":
      return "Annually";
    case "MONTHLY":
      return "Monthly";
    case "WEEKLY":
      return "Weekly";
    case "HOURLY":
      return "Hourly";
  }
}

export function formatChangeReason(value: ChangeReason): string {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function formatCompensationStatus(value: CompensationStatus): string {
  switch (value) {
    case "CURRENT":
      return "Current";
    case "FUTURE":
      return "Future";
    case "HISTORICAL":
      return "Historical";
  }
}

export function formatIsoDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value;
  }

  const [year, month, day] = value.slice(0, 10).split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthIndex = Number(month) - 1;
  const monthLabel = months[monthIndex];

  if (!monthLabel || !day || !year) {
    return value;
  }

  return `${monthLabel} ${Number(day)}, ${year}`;
}
