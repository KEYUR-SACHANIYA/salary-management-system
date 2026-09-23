const HOURS_PER_WEEK = 40;
const WEEKS_PER_YEAR = 52;
const HOURS_PER_YEAR = HOURS_PER_WEEK * WEEKS_PER_YEAR;
const MONEY_SCALE = 100n;

export const FX_RATE_DATE = "2026-09-23";

export const CURRENCIES = ["USD", "INR", "GBP", "EUR", "CAD", "SGD"] as const;
export const PAY_FREQUENCIES = ["ANNUALLY", "MONTHLY", "WEEKLY", "HOURLY"] as const;
export const CHANGE_REASONS = [
  "HIRE",
  "ANNUAL_REVIEW",
  "PROMOTION",
  "MARKET_ADJUSTMENT",
  "CORRECTION",
  "ROLE_CHANGE",
] as const;

export type Currency = (typeof CURRENCIES)[number];
export type PayFrequency = (typeof PAY_FREQUENCIES)[number];
export type ChangeReason = (typeof CHANGE_REASONS)[number];
export type CompensationStatus = "CURRENT" | "FUTURE" | "HISTORICAL";

export type CompensationInput = {
  amount: string;
  currency: string;
  payFrequency: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  changeReason?: string | null;
};

export type DatedCompensation = {
  effectiveFrom: string;
  effectiveTo: string | null;
};

export type ValidationResult = { valid: true } | { valid: false; errors: string[] };

/** Units of each currency per 1 USD, fixed on FX_RATE_DATE. */
export const FX_RATES_PER_USD: Record<Currency, string> = {
  USD: "1.00",
  INR: "95.72",
  GBP: "0.75",
  EUR: "0.88",
  CAD: "1.41",
  SGD: "1.28",
};

const FX_RATE_MINOR = {
  USD: parseMoney(FX_RATES_PER_USD.USD),
  INR: parseMoney(FX_RATES_PER_USD.INR),
  GBP: parseMoney(FX_RATES_PER_USD.GBP),
  EUR: parseMoney(FX_RATES_PER_USD.EUR),
  CAD: parseMoney(FX_RATES_PER_USD.CAD),
  SGD: parseMoney(FX_RATES_PER_USD.SGD),
} as const satisfies Record<Currency, bigint>;

const ANNUAL_FACTOR: Record<PayFrequency, bigint> = {
  ANNUALLY: 1n,
  MONTHLY: 12n,
  WEEKLY: BigInt(WEEKS_PER_YEAR),
  HOURLY: BigInt(HOURS_PER_YEAR),
};

export function annualize(amount: string, payFrequency: PayFrequency): string {
  return formatMinor(parseMoney(amount) * ANNUAL_FACTOR[payFrequency]);
}

export function convertCurrency(amount: string, sourceCurrency: Currency, targetCurrency: Currency): string {
  const converted = divideRound(
    parseMoney(amount) * FX_RATE_MINOR[targetCurrency],
    FX_RATE_MINOR[sourceCurrency],
  );
  return formatMinor(converted);
}

export function calculateReportingSalary(
  compensation: { amount: string; currency: Currency; payFrequency: PayFrequency },
  reportingCurrency: Currency,
): string {
  const annualAmount = annualize(compensation.amount, compensation.payFrequency);
  return convertCurrency(annualAmount, compensation.currency, reportingCurrency);
}

export function getCompensationStatus(compensation: DatedCompensation, today: string): CompensationStatus {
  if (compensation.effectiveFrom > today) return "FUTURE";
  if (compensation.effectiveTo !== null && compensation.effectiveTo < today) return "HISTORICAL";
  return "CURRENT";
}

export function validateCompensation(input: CompensationInput): ValidationResult {
  const errors: string[] = [];

  if (!isPositiveMoney(input.amount)) errors.push("Amount must be greater than zero.");
  if (!isCurrency(input.currency)) errors.push("Currency is not supported.");
  if (!isPayFrequency(input.payFrequency)) errors.push("Pay frequency is not supported.");
  if (!isIsoDate(input.effectiveFrom)) errors.push("Effective from must be a valid date.");
  if (input.effectiveTo != null && input.effectiveTo !== "" && !isIsoDate(input.effectiveTo)) {
    errors.push("Effective to must be a valid date.");
  }
  if (
    isIsoDate(input.effectiveFrom) &&
    input.effectiveTo != null &&
    input.effectiveTo !== "" &&
    isIsoDate(input.effectiveTo) &&
    input.effectiveTo < input.effectiveFrom
  ) {
    errors.push("Effective to cannot be before effective from.");
  }
  if (input.changeReason != null && input.changeReason !== "" && !isChangeReason(input.changeReason)) {
    errors.push("Change reason is not supported.");
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}

function isPayFrequency(value: string): value is PayFrequency {
  return (PAY_FREQUENCIES as readonly string[]).includes(value);
}

function isChangeReason(value: string): value is ChangeReason {
  return (CHANGE_REASONS as readonly string[]).includes(value);
}

function isPositiveMoney(amount: string): boolean {
  if (!/^\d+(\.\d{1,2})?$/.test(amount)) return false;
  return parseMoney(amount) > 0n;
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year!, (month ?? 1) - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === (month ?? 1) - 1 && date.getUTCDate() === day;
}

function parseMoney(amount: string): bigint {
  const [whole = "0", fraction = ""] = amount.split(".");
  const cents = (fraction + "00").slice(0, 2);
  return BigInt(whole) * MONEY_SCALE + BigInt(cents);
}

function formatMinor(minor: bigint): string {
  const whole = minor / MONEY_SCALE;
  const fraction = (minor % MONEY_SCALE).toString().padStart(2, "0");
  return `${whole}.${fraction}`;
}

function divideRound(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator / 2n) / denominator;
}
