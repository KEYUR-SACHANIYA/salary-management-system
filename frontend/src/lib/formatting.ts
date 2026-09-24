import type { ChangeReason, CompensationStatus, PayFrequency } from "./constants";

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
