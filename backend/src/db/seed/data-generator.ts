// Reference day for "today". A fixed date keeps the same seed stable across runs.
const REFERENCE_DATE = "2026-09-24";
const FULL_TIME_HOURS_PER_YEAR = 40 * 52;

export type Currency = "USD" | "INR" | "GBP" | "EUR" | "CAD" | "SGD";
export type PayFrequency = "ANNUALLY" | "MONTHLY" | "WEEKLY" | "HOURLY";
export type ChangeReason =
  | "HIRE"
  | "ANNUAL_REVIEW"
  | "PROMOTION"
  | "MARKET_ADJUSTMENT"
  | "CORRECTION"
  | "ROLE_CHANGE";

export type GeneratedEmployee = {
  id: string;
  employeeCode: string;
  name: string;
  country: string;
  department: string;
  role: string;
};

export type GeneratedCompensation = {
  id: string;
  employeeId: string;
  amount: string;
  currency: Currency;
  payFrequency: PayFrequency;
  effectiveFrom: string;
  effectiveTo: string | null;
  changeReason: ChangeReason;
};

export type GeneratedDataset = {
  employees: GeneratedEmployee[];
  compensations: GeneratedCompensation[];
};

type CountryProfile = {
  country: string;
  currency: Currency;
  annualMin: number;
  annualMax: number;
};

type PayStep = {
  reason: ChangeReason;
  startOffset: number;
  endOffset: number | null;
};

const COUNTRIES: CountryProfile[] = [
  { country: "India", currency: "INR", annualMin: 600_000, annualMax: 4_500_000 },
  { country: "United States", currency: "USD", annualMin: 55_000, annualMax: 220_000 },
  { country: "United Kingdom", currency: "GBP", annualMin: 35_000, annualMax: 140_000 },
  { country: "Germany", currency: "EUR", annualMin: 45_000, annualMax: 130_000 },
  { country: "Canada", currency: "CAD", annualMin: 55_000, annualMax: 160_000 },
  { country: "Singapore", currency: "SGD", annualMin: 48_000, annualMax: 180_000 },
];

const ROLES_BY_DEPARTMENT: Record<string, string[]> = {
  Engineering: ["Software Engineer", "Senior Software Engineer", "Engineering Manager"],
  Product: ["Product Manager", "Designer"],
  Sales: ["Account Executive", "Sales Manager"],
  Marketing: ["Marketing Specialist", "Marketing Manager"],
  People: ["HR Specialist", "HR Manager"],
  Finance: ["Accountant", "Finance Manager"],
  Operations: ["Operations Associate", "Operations Manager"],
  "Customer Support": ["Support Associate", "Support Lead"],
};

const DEPARTMENTS = Object.keys(ROLES_BY_DEPARTMENT);

const GIVEN_NAMES = ["Aarav", "Diya", "Maya", "Noah", "Olivia", "Liam", "Sofia", "Ethan", "Nora", "Kabir", "Leila", "Owen"];
const FAMILY_NAMES = ["Sharma", "Patel", "Garcia", "Nguyen", "Khan", "Brown", "Keller", "Rossi", "Tan", "Murphy", "Silva", "Ibrahim"];

const SCENARIOS: PayStep[][] = [
  [{ reason: "HIRE", startOffset: -180, endOffset: null }],
  [
    { reason: "HIRE", startOffset: -600, endOffset: -201 },
    { reason: "ANNUAL_REVIEW", startOffset: -200, endOffset: null },
  ],
  [
    { reason: "HIRE", startOffset: -900, endOffset: -501 },
    { reason: "ANNUAL_REVIEW", startOffset: -500, endOffset: -151 },
    { reason: "PROMOTION", startOffset: -150, endOffset: null },
  ],
  [
    { reason: "HIRE", startOffset: -400, endOffset: -101 },
    { reason: "PROMOTION", startOffset: -100, endOffset: null },
  ],
  [
    { reason: "HIRE", startOffset: -370, endOffset: -91 },
    { reason: "ANNUAL_REVIEW", startOffset: -90, endOffset: null },
  ],
  [
    { reason: "HIRE", startOffset: -300, endOffset: -61 },
    { reason: "MARKET_ADJUSTMENT", startOffset: -60, endOffset: null },
  ],
  [
    { reason: "HIRE", startOffset: -250, endOffset: -41 },
    { reason: "ROLE_CHANGE", startOffset: -40, endOffset: null },
  ],
  [
    { reason: "HIRE", startOffset: -100, endOffset: -81 },
    { reason: "CORRECTION", startOffset: -80, endOffset: null },
  ],
  [
    { reason: "HIRE", startOffset: -200, endOffset: 39 },
    { reason: "PROMOTION", startOffset: 40, endOffset: null },
  ],
];

export function generateEmployees(count: number, seed: number): GeneratedDataset {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("count must be a positive integer");
  }

  const next = mulberry32(seed);
  const employees: GeneratedEmployee[] = [];
  const compensations: GeneratedCompensation[] = [];
  let compensationNumber = 0;

  for (let index = 0; index < count; index += 1) {
    const profile = COUNTRIES[index % COUNTRIES.length]!;
    const department = DEPARTMENTS[index % DEPARTMENTS.length]!;
    const role = roleFor(department, index, next);
    const employeeId = deterministicId(index + 1);

    employees.push({
      id: employeeId,
      employeeCode: `EMP${String(index + 1).padStart(6, "0")}`,
      name: `${GIVEN_NAMES[next() % GIVEN_NAMES.length]} ${FAMILY_NAMES[next() % FAMILY_NAMES.length]}`,
      country: profile.country,
      department,
      role,
    });

    const frequency = payFrequencyFor(department, role);
    const seniority = role.includes("Senior") || role.includes("Manager") || role.includes("Lead") ? 130 : 100;
    let annualMinor = annualAmountMinor(profile, seniority, next);
    const steps = SCENARIOS[index % SCENARIOS.length]!;

    for (const step of steps) {
      if (step.reason !== "HIRE") {
        annualMinor = adjustAnnualMinor(annualMinor, step.reason, next);
      }
      compensationNumber += 1;
      compensations.push({
        id: deterministicId(1_000_000_000 + compensationNumber),
        employeeId,
        amount: formatMinor(toContractMinor(annualMinor, frequency)),
        currency: profile.currency,
        payFrequency: frequency,
        effectiveFrom: addDays(REFERENCE_DATE, step.startOffset),
        effectiveTo: step.endOffset === null ? null : addDays(REFERENCE_DATE, step.endOffset),
        changeReason: step.reason,
      });
    }
  }

  return { employees, compensations };
}

function roleFor(department: string, index: number, next: () => number): string {
  const roles = ROLES_BY_DEPARTMENT[department]!;
  const firstPass = index < DEPARTMENTS.length;
  if (firstPass && department === "Customer Support") return "Support Associate";
  if (firstPass && department === "Operations") return "Operations Associate";
  return roles[next() % roles.length]!;
}

function payFrequencyFor(department: string, role: string): PayFrequency {
  if (department === "Customer Support" && role === "Support Associate") return "HOURLY";
  if (department === "Operations" && role === "Operations Associate") return "WEEKLY";
  if (department === "Sales" || department === "Marketing") return "MONTHLY";
  return "ANNUALLY";
}

function annualAmountMinor(profile: CountryProfile, seniorityPercent: number, next: () => number): number {
  const span = profile.annualMax - profile.annualMin;
  const major = profile.annualMin + (next() % (span + 1));
  return Math.floor((major * 100 * seniorityPercent) / 100);
}

function adjustAnnualMinor(annualMinor: number, reason: ChangeReason, next: () => number): number {
  if (reason === "CORRECTION") return Math.max(100, Math.floor((annualMinor * 97) / 100));
  const bump = reason === "PROMOTION" ? 12 + (next() % 9) : 5 + (next() % 6);
  return Math.floor((annualMinor * (100 + bump)) / 100);
}

function toContractMinor(annualMinor: number, frequency: PayFrequency): number {
  const divisor =
    frequency === "MONTHLY" ? 12 : frequency === "WEEKLY" ? 52 : frequency === "HOURLY" ? FULL_TIME_HOURS_PER_YEAR : 1;
  return Math.max(1, Math.round(annualMinor / divisor));
}

function formatMinor(minor: number): string {
  const whole = Math.trunc(minor / 100);
  const fraction = String(Math.abs(minor % 100)).padStart(2, "0");
  return `${whole}.${fraction}`;
}

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function deterministicId(n: number): string {
  const hex = n.toString(16).padStart(32, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return (value ^ (value >>> 14)) >>> 0;
  };
}
