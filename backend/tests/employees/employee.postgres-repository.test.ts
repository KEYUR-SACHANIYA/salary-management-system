import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { PostgresEmployeeRepository } from "../../src/modules/employees/employee.postgres-repository";
import { calculateReportingSalary } from "../../src/shared/pay-rules";
import type { EmployeeListQuery } from "../../src/modules/employees/employee.types";

const TEST_PREFIX = "TESTAPI";
const MISSING_ID = "00000000-0000-4000-8000-000000000000";

function databaseUrl(): string {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("DATABASE_URL=")) {
    return process.env.DATABASE_URL;
  }

  const file = fs.readFileSync(path.join(__dirname, "..", "..", ".env"), "utf8");
  const line = file.split(/\r?\n/).find((entry) => entry.startsWith("DATABASE_URL="));
  if (!line) throw new Error("DATABASE_URL is required for repository tests");
  let value = line.slice("DATABASE_URL=".length).trim();
  if (value.startsWith("DATABASE_URL=")) value = value.slice("DATABASE_URL=".length);
  return value;
}

function baseQuery(overrides: Partial<EmployeeListQuery> = {}): EmployeeListQuery {
  return {
    page: 1,
    pageSize: 20,
    sortBy: "employeeCode",
    sortOrder: "asc",
    reportingCurrency: "USD",
    ...overrides,
  };
}

describe("PostgresEmployeeRepository", () => {
  jest.setTimeout(30_000);
  const pool = new Pool({ connectionString: databaseUrl() });
  const repository = new PostgresEmployeeRepository(pool);

  afterAll(async () => {
    await pool.query("DELETE FROM employees WHERE employee_code LIKE $1", [
      "TESTAPI%",
    ]);

    await pool.end();
  });

  it("finds an existing employee by id", async () => {
    const listed = await repository.list(baseQuery({ pageSize: 1 }));
    const found = await repository.findById(listed.data[0]!.id);

    expect(found).not.toBeNull();
    expect(found?.employeeCode).toBe(listed.data[0]?.employeeCode);
  });

  it("returns null when the employee does not exist", async () => {
    await expect(repository.findById(MISSING_ID)).resolves.toBeNull();
  });

  it("lists employees without loading the full table into one page", async () => {
    const result = await repository.list(baseQuery({ pageSize: 20 }));

    expect(result.data).toHaveLength(20);
    expect(result.total).toBeGreaterThan(20);
    expect(result.total).toBe(10_000);
  });

  it("searches by employee name", async () => {
    const sample = await repository.list(baseQuery({ pageSize: 1 }));
    const name = sample.data[0]!.name;
    const result = await repository.list(baseQuery({ search: name, pageSize: 100 }));

    expect(result.data.some((employee) => employee.name === name)).toBe(true);
  });

  it("searches by employee code", async () => {
    const result = await repository.list(baseQuery({ search: "EMP000001" }));

    expect(result.data.some((employee) => employee.employeeCode === "EMP000001")).toBe(true);
  });

  it("filters by country", async () => {
    const result = await repository.list(baseQuery({ country: "India", pageSize: 50 }));

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.every((employee) => employee.country === "India")).toBe(true);
  });

  it("filters by department", async () => {
    const result = await repository.list(baseQuery({ department: "Engineering", pageSize: 50 }));

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.every((employee) => employee.department === "Engineering")).toBe(true);
  });

  it("filters by native currency of current compensation", async () => {
    const result = await repository.list(baseQuery({ currency: "INR", pageSize: 50 }));

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.every((employee) => employee.currentCompensation?.currency === "INR")).toBe(true);
  });

  it("filters by current pay frequency", async () => {
    const result = await repository.list(baseQuery({ payFrequency: "HOURLY", pageSize: 50 }));

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.every((employee) => employee.currentCompensation?.payFrequency === "HOURLY")).toBe(true);
  });

  it("paginates in PostgreSQL and reports the unpaged total", async () => {
    const first = await repository.list(baseQuery({ page: 1, pageSize: 10 }));
    const second = await repository.list(baseQuery({ page: 2, pageSize: 10 }));

    expect(first.data).toHaveLength(10);
    expect(second.data).toHaveLength(10);
    expect(first.total).toBe(second.total);
    expect(first.total).toBeGreaterThan(10);
    expect(first.data[0]?.id).not.toBe(second.data[0]?.id);
  });

  it("sorts by name ascending and descending", async () => {
    const ascending = await repository.list(baseQuery({ sortBy: "name", sortOrder: "asc", pageSize: 5 }));
    const descending = await repository.list(baseQuery({ sortBy: "name", sortOrder: "desc", pageSize: 5 }));
    const namesAsc = ascending.data.map((employee) => employee.name);
    const namesDesc = descending.data.map((employee) => employee.name);

    expect(namesAsc[0]! <= namesAsc[1]!).toBe(true);
    expect(namesDesc[0]! >= namesDesc[1]!).toBe(true);
    expect(namesDesc[0]).not.toBe(namesAsc[0]);
  });

  it("sorts by employee code ascending and descending", async () => {
    const ascending = await repository.list(baseQuery({ sortBy: "employeeCode", sortOrder: "asc", pageSize: 3 }));
    const descending = await repository.list(baseQuery({ sortBy: "employeeCode", sortOrder: "desc", pageSize: 3 }));

    expect(ascending.data[0]?.employeeCode).toBe("EMP000001");
    expect(descending.data[0]?.employeeCode).toBe("EMP010000");
  });

  it("sorts by reporting salary in PostgreSQL", async () => {
    const ascending = await repository.list(baseQuery({ sortBy: "salary", sortOrder: "asc", pageSize: 20 }));
    const descending = await repository.list(baseQuery({ sortBy: "salary", sortOrder: "desc", pageSize: 20 }));
    const ascValues = ascending.data.map((employee) => Number(employee.currentCompensation?.reportingSalary));
    const descValues = descending.data.map((employee) => Number(employee.currentCompensation?.reportingSalary));

    expect(ascValues).toEqual([...ascValues].sort((a, b) => a - b));
    expect(descValues[0]).toBeGreaterThan(ascValues[0]!);
  });

  it("recalculates reporting salary when the reporting currency changes", async () => {
    const usd = await repository.list(baseQuery({ search: "EMP000001", reportingCurrency: "USD" }));
    const inr = await repository.list(baseQuery({ search: "EMP000001", reportingCurrency: "INR" }));
    const employeeUsd = usd.data.find((employee) => employee.employeeCode === "EMP000001");
    const employeeInr = inr.data.find((employee) => employee.employeeCode === "EMP000001");

    expect(employeeUsd?.currentCompensation).not.toBeNull();
    expect(employeeInr?.currentCompensation).not.toBeNull();
    expect(employeeUsd?.currentCompensation?.reportingSalary).not.toBe(
      employeeInr?.currentCompensation?.reportingSalary,
    );
    expect(employeeUsd?.currentCompensation?.reportingSalary).toBe(
      calculateReportingSalary(
        {
          amount: employeeUsd!.currentCompensation!.amount,
          currency: employeeUsd!.currentCompensation!.currency,
          payFrequency: employeeUsd!.currentCompensation!.payFrequency,
        },
        "USD",
      ),
    );
  });

  it("does not treat future compensation as current", async () => {
    const id = await insertEmployee(pool, `${TEST_PREFIX}FUT`);
    await insertCompensation(pool, id, {
      amount: "50000.00",
      from: "2099-01-01",
      to: null,
      reason: "HIRE",
    });

    const result = await repository.list(baseQuery({ search: `${TEST_PREFIX}FUT` }));
    expect(result.data[0]?.currentCompensation).toBeNull();
  });

  it("does not treat historical compensation as current", async () => {
    const id = await insertEmployee(pool, `${TEST_PREFIX}HIS`);
    await insertCompensation(pool, id, {
      amount: "50000.00",
      from: "2020-01-01",
      to: "2020-12-31",
      reason: "HIRE",
    });

    const result = await repository.list(baseQuery({ search: `${TEST_PREFIX}HIS` }));
    expect(result.data[0]?.currentCompensation).toBeNull();
  });

  it("returns the current row when a future salary is also scheduled", async () => {
    const id = await insertEmployee(pool, `${TEST_PREFIX}CUR`);
    await insertCompensation(pool, id, {
      amount: "80000.00",
      from: "2026-01-01",
      to: "2026-12-31",
      reason: "HIRE",
    });
    await insertCompensation(pool, id, {
      amount: "90000.00",
      from: "2027-01-01",
      to: null,
      reason: "PROMOTION",
    });

    const result = await repository.list(baseQuery({ search: `${TEST_PREFIX}CUR` }));
    expect(result.data[0]?.currentCompensation?.amount).toBe("80000.00");
    expect(result.data[0]?.currentCompensation?.effectiveFrom).toBe("2026-01-01");
  });
});

async function insertEmployee(pool: Pool, code: string): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `
      INSERT INTO employees (employee_code, name, country, department, role)
      VALUES ($1, $2, 'United States', 'Engineering', 'Software Engineer')
      RETURNING id::text
    `,
    [code, `${code} Person`],
  );
  return result.rows[0]!.id;
}

async function insertCompensation(
  pool: Pool,
  employeeId: string,
  row: { amount: string; from: string; to: string | null; reason: string },
): Promise<void> {
  await pool.query(
    `
      INSERT INTO employee_compensations
        (employee_id, amount, currency, pay_frequency, effective_from, effective_to, change_reason)
      VALUES ($1, $2, 'USD', 'ANNUALLY', $3, $4, $5)
    `,
    [employeeId, row.amount, row.from, row.to, row.reason],
  );
}
