import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { PostgresAnalyticsRepository } from "../../src/modules/analytics/analytics.postgres-repository";
import { calculateReportingSalary, CURRENCIES } from "../../src/shared/pay-rules";
import { ValidationError } from "../../src/shared/errors";
import type { Currency, PayFrequency } from "../../src/shared/pay-rules";

const RUN = `Anl${Date.now().toString(36).slice(-7)}`;

function databaseUrl(): string {
  if (
    process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.startsWith("DATABASE_URL=")
  ) {
    return process.env.DATABASE_URL;
  }

  const file = fs.readFileSync(path.join(__dirname, "..", "..", ".env"), "utf8");
  const line = file
    .split(/\r?\n/)
    .find((entry) => entry.startsWith("DATABASE_URL="));
  if (!line) throw new Error("DATABASE_URL is required for repository tests");
  let value = line.slice("DATABASE_URL=".length).trim();
  if (value.startsWith("DATABASE_URL="))
    value = value.slice("DATABASE_URL=".length);
  return value;
}

function createPoolConfig(connectionString: string) {
  const hostname = new URL(connectionString).hostname;
  const usesRemoteDatabase = !["localhost", "127.0.0.1", "::1"].includes(hostname);

  return {
    connectionString,
    ...(usesRemoteDatabase ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}

describe("PostgresAnalyticsRepository", () => {
  jest.setTimeout(30_000);
  const pool = new Pool(createPoolConfig(databaseUrl()));
  const repository = new PostgresAnalyticsRepository(pool);

  afterAll(async () => {
    await pool.query("DELETE FROM employees WHERE employee_code LIKE $1", [
      `${RUN}%`,
    ]);

    await pool.end();
  });

  it("computes overview, country, and department totals for USD annual salaries", async () => {
    const country = `${RUN}Usd`;
    const department = `${RUN}Dept`;
    const before = await repository.getSalaryAnalytics("USD");

    await insertPay(pool, { country, department, amount: "100000.00" });
    await insertPay(pool, { country, department, amount: "50000.00" });
    await insertPay(pool, { country, department, amount: "25000.00" });

    const after = await repository.getSalaryAnalytics("USD");
    const group = after.byCountry.find((row) => row.country === country);
    const dept = after.byDepartment.find(
      (row) => row.department === department,
    );

    expect(after.overview.employeeCount).toBe(
      before.overview.employeeCount + 3,
    );
    expect(after.overview.totalAnnualCompensation).toBe(
      addMoney(before.overview.totalAnnualCompensation, "175000.00"),
    );
    expect(
      compareMoney(
        after.overview.lowestAnnualCompensation,
        after.overview.medianAnnualCompensation,
      ) <= 0,
    ).toBe(true);
    expect(
      compareMoney(
        after.overview.medianAnnualCompensation,
        after.overview.highestAnnualCompensation,
      ) <= 0,
    ).toBe(true);
    expect(group).toEqual({
      country,
      employeeCount: 3,
      totalAnnualCompensation: "175000.00",
      averageAnnualCompensation: "58333.33",
    });
    expect(dept).toEqual({
      department,
      employeeCount: 3,
      totalAnnualCompensation: "175000.00",
      averageAnnualCompensation: "58333.33",
    });
  });

  it("converts current pay into INR and GBP reporting currency", async () => {
    const country = `${RUN}Fx`;
    await insertPay(pool, {
      country,
      department: `${RUN}FxD`,
      amount: "100000.00",
    });

    const inr = await repository.getSalaryAnalytics("INR");
    const gbp = await repository.getSalaryAnalytics("GBP");
    const expectedInr = calculateReportingSalary(
      { amount: "100000.00", currency: "USD", payFrequency: "ANNUALLY" },
      "INR",
    );
    const expectedGbp = calculateReportingSalary(
      { amount: "100000.00", currency: "USD", payFrequency: "ANNUALLY" },
      "GBP",
    );

    expect(
      inr.byCountry.find((row) => row.country === country)
        ?.totalAnnualCompensation,
    ).toBe(expectedInr);
    expect(
      gbp.byCountry.find((row) => row.country === country)
        ?.totalAnnualCompensation,
    ).toBe(expectedGbp);
    expect(inr.reportingCurrency).toBe("INR");
    expect(gbp.reportingCurrency).toBe("GBP");
  });

  it("annualizes monthly, weekly, and hourly current pay", async () => {
    const country = `${RUN}Freq`;
    await insertPay(pool, {
      country,
      department: `${RUN}FreqD`,
      amount: "10000.00",
      payFrequency: "MONTHLY",
    });
    await insertPay(pool, {
      country,
      department: `${RUN}FreqD`,
      amount: "1000.00",
      payFrequency: "WEEKLY",
    });
    await insertPay(pool, {
      country,
      department: `${RUN}FreqD`,
      amount: "50.00",
      payFrequency: "HOURLY",
    });

    const group = (await repository.getSalaryAnalytics("USD")).byCountry.find(
      (row) => row.country === country,
    );
    expect(group?.totalAnnualCompensation).toBe("276000.00");
    expect(group?.employeeCount).toBe(3);
  });

  it("excludes future compensation from current analytics", async () => {
    const country = `${RUN}Fut`;
    const id = await insertEmployee(pool, `${RUN}F`, country, `${RUN}FutD`);
    await insertCompensation(pool, id, {
      amount: "80000.00",
      from: "2025-01-01",
      to: "2026-12-31",
      reason: "HIRE",
    });
    await insertCompensation(pool, id, {
      amount: "250000.00",
      from: "2027-01-01",
      to: null,
      reason: "PROMOTION",
    });

    const group = (await repository.getSalaryAnalytics("USD")).byCountry.find(
      (row) => row.country === country,
    );
    expect(group).toEqual({
      country,
      employeeCount: 1,
      totalAnnualCompensation: "80000.00",
      averageAnnualCompensation: "80000.00",
    });
  });

  it("excludes historical compensation from current analytics", async () => {
    const country = `${RUN}His`;
    const id = await insertEmployee(pool, `${RUN}H`, country, `${RUN}HisD`);
    await insertCompensation(pool, id, {
      amount: "40000.00",
      from: "2020-01-01",
      to: "2024-12-31",
      reason: "HIRE",
    });
    await insertCompensation(pool, id, {
      amount: "90000.00",
      from: "2025-01-01",
      to: null,
      reason: "ANNUAL_REVIEW",
    });

    const group = (await repository.getSalaryAnalytics("USD")).byCountry.find(
      (row) => row.country === country,
    );
    expect(group?.totalAnnualCompensation).toBe("90000.00");
    expect(group?.employeeCount).toBe(1);
  });

  it("does not treat employees without current pay as zero-salary rows", async () => {
    const country = `${RUN}None`;
    const id = await insertEmployee(pool, `${RUN}N`, country, `${RUN}NoneD`);
    await insertCompensation(pool, id, {
      amount: "70000.00",
      from: "2099-01-01",
      to: null,
      reason: "HIRE",
    });

    const analytics = await repository.getSalaryAnalytics("USD");
    expect(
      analytics.byCountry.find((row) => row.country === country),
    ).toBeUndefined();
    expect(
      analytics.byDepartment.find((row) => row.department === `${RUN}NoneD`),
    ).toBeUndefined();
  });

  it("keeps native-currency totals in the original currency", async () => {
    const country = `${RUN}Nat`;
    const before = await repository.getSalaryAnalytics("USD");
    await insertPay(pool, {
      country,
      department: `${RUN}NatD`,
      amount: "1000.00",
      currency: "EUR",
    });

    const after = await repository.getSalaryAnalytics("USD");
    const nativeBefore = nativeTotal(before, "EUR");
    const nativeAfter = nativeTotal(after, "EUR");
    const converted = calculateReportingSalary(
      { amount: "1000.00", currency: "EUR", payFrequency: "ANNUALLY" },
      "USD",
    );

    expect(nativeAfter).toBe(addMoney(nativeBefore, "1000.00"));
    expect(
      after.byCountry.find((row) => row.country === country)
        ?.totalAnnualCompensation,
    ).toBe(converted);
    expect(nativeAfter).not.toBe(converted);
  });

  it("orders breakdowns by total descending then name ascending", async () => {
    await insertPay(pool, {
      country: `${RUN}Z`,
      department: `${RUN}Z`,
      amount: "300000.00",
    });
    await insertPay(pool, {
      country: `${RUN}A`,
      department: `${RUN}A`,
      amount: "200000.00",
    });
    await insertPay(pool, {
      country: `${RUN}B`,
      department: `${RUN}B`,
      amount: "200000.00",
    });

    const analytics = await repository.getSalaryAnalytics("USD");
    const countries = analytics.byCountry
      .filter((row) => row.country.startsWith(RUN))
      .map((row) => row.country);
    const z = countries.indexOf(`${RUN}Z`);
    const a = countries.indexOf(`${RUN}A`);
    const b = countries.indexOf(`${RUN}B`);

    expect(z).toBeLessThan(a);
    expect(a).toBeLessThan(b);
  });

  it("rejects an unsupported reporting currency", async () => {
    await expect(
      repository.getSalaryAnalytics("JPY" as Currency),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("reads the seeded dataset as 10,000 current employees across all currencies and departments", async () => {
    const analytics = await repository.getSalaryAnalytics("USD");
    const testCountries = analytics.byCountry.filter((row) =>
      row.country.startsWith(RUN),
    );
    const seededCount =
      analytics.overview.employeeCount -
      testCountries.reduce((sum, row) => sum + row.employeeCount, 0);

    expect(seededCount).toBe(10_000);
    expect(
      analytics.byNativeCurrency.map((row) => row.currency).sort(),
    ).toEqual([...CURRENCIES].sort());
    expect(
      analytics.byDepartment
        .filter((row) => !row.department.startsWith(RUN))
        .map((row) => row.department)
        .sort(),
    ).toEqual([
      "Customer Support",
      "Engineering",
      "Finance",
      "Marketing",
      "Operations",
      "People",
      "Product",
      "Sales",
    ]);
  });
});

function nativeTotal(
  analytics: {
    byNativeCurrency: Array<{
      currency: Currency;
      totalAnnualCompensation: string;
    }>;
  },
  currency: Currency,
): string {
  return (
    analytics.byNativeCurrency.find((row) => row.currency === currency)
      ?.totalAnnualCompensation ?? "0.00"
  );
}

async function insertPay(
  pool: Pool,
  row: {
    country: string;
    department: string;
    amount: string;
    currency?: Currency;
    payFrequency?: PayFrequency;
  },
): Promise<string> {
  const id = await insertEmployee(
    pool,
    `${RUN}${employeeCounter++}`,
    row.country,
    row.department,
  );
  await insertCompensation(pool, id, {
    amount: row.amount,
    currency: row.currency ?? "USD",
    payFrequency: row.payFrequency ?? "ANNUALLY",
    from: "2025-01-01",
    to: null,
    reason: "HIRE",
  });
  return id;
}

let employeeCounter = 0;

async function insertEmployee(
  pool: Pool,
  code: string,
  country: string,
  department: string,
): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `
      INSERT INTO employees (employee_code, name, country, department, role)
      VALUES ($1, $2, $3, $4, 'Software Engineer')
      RETURNING id::text
    `,
    [code.slice(0, 20), `${code} Person`, country, department],
  );
  return result.rows[0]!.id;
}

async function insertCompensation(
  pool: Pool,
  employeeId: string,
  row: {
    amount: string;
    from: string;
    to: string | null;
    reason: string;
    currency?: Currency;
    payFrequency?: PayFrequency;
  },
): Promise<void> {
  await pool.query(
    `
      INSERT INTO employee_compensations
        (employee_id, amount, currency, pay_frequency, effective_from, effective_to, change_reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      employeeId,
      row.amount,
      row.currency ?? "USD",
      row.payFrequency ?? "ANNUALLY",
      row.from,
      row.to,
      row.reason,
    ],
  );
}

function parseMinor(amount: string): bigint {
  const [whole = "0", fraction = ""] = amount.split(".");
  return BigInt(whole) * 100n + BigInt((fraction + "00").slice(0, 2));
}

function formatMinor(minor: bigint): string {
  const sign = minor < 0n ? "-" : "";
  const absolute = minor < 0n ? -minor : minor;
  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, "0");
  return `${sign}${whole}.${fraction}`;
}

function addMoney(left: string, right: string): string {
  return formatMinor(parseMinor(left) + parseMinor(right));
}

function compareMoney(left: string, right: string): number {
  const delta = parseMinor(left) - parseMinor(right);
  if (delta < 0n) return -1;
  if (delta > 0n) return 1;
  return 0;
}
