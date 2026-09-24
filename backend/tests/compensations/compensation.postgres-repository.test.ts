import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { PostgresCompensationRepository } from "../../src/modules/compensations/compensation.postgres-repository";
import { EmployeeNotFoundError, ValidationError } from "../../src/shared/errors";
import type { CreateCompensationInput } from "../../src/modules/compensations/compensation.types";

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

const RUN_PREFIX = `TESTCOMP${Date.now().toString(36).slice(-8)}`;

describe("PostgresCompensationRepository", () => {
  jest.setTimeout(30_000);

  const pool = new Pool({ connectionString: databaseUrl() });
  const repository = new PostgresCompensationRepository(pool);

  afterAll(async () => {
    await pool.query(
      "DELETE FROM employees WHERE employee_code LIKE $1",
      [`${RUN_PREFIX}%`],
    );

    await pool.end();
  });

  it("returns history newest first for an existing employee", async () => {
    const id = await insertEmployee(pool, `${RUN_PREFIX}H`);
    await insertCompensation(pool, id, "80000.00", "2024-01-01", "2024-12-31", "HIRE");
    await insertCompensation(pool, id, "90000.00", "2025-01-01", null, "ANNUAL_REVIEW");

    const history = await repository.getHistory(id);

    expect(history.map((row) => row.effectiveFrom)).toEqual(["2025-01-01", "2024-01-01"]);
    expect(history[0]?.amount).toBe("90000.00");
  });

  it("returns an empty history when the employee exists but has no compensation rows", async () => {
    const id = await insertEmployee(pool, `${RUN_PREFIX}E`);

    await expect(repository.getHistory(id)).resolves.toEqual([]);
  });

  it("throws EMPLOYEE_NOT_FOUND for a missing employee without inserting rows", async () => {
    const before = await countCompensations(pool);
    await expect(repository.getHistory(MISSING_ID)).rejects.toBeInstanceOf(EmployeeNotFoundError);
    await expect(
      repository.addCompensation(MISSING_ID, change("100000.00", "2026-09-24", "PROMOTION")),
    ).rejects.toBeInstanceOf(EmployeeNotFoundError);
    expect(await countCompensations(pool)).toBe(before);
  });

  it("closes the current period and inserts an immediate salary change", async () => {
    const id = await insertEmployee(pool, `${RUN_PREFIX}I`);
    
    await insertCompensation(pool, id, "100000.00", "2025-01-01", null, "HIRE");

    const created = await repository.addCompensation(
      id,
      change("120000.00", "2026-09-24", "PROMOTION"),
    );
    const history = await repository.getHistory(id);

    expect(created.effectiveFrom).toBe("2026-09-24");
    expect(created.effectiveTo).toBeNull();
    expect(history).toHaveLength(2);
    expect(history[1]).toMatchObject({
      amount: "100000.00",
      effectiveFrom: "2025-01-01",
      effectiveTo: "2026-09-23",
      changeReason: "HIRE",
    });
    expect(history[0]).toMatchObject({
      amount: "120000.00",
      effectiveFrom: "2026-09-24",
      effectiveTo: null,
      changeReason: "PROMOTION",
    });
    await expectValidTimeline(pool, id);
  });

  it("schedules a future change without replacing the current salary", async () => {
    const id = await insertEmployee(pool, `${RUN_PREFIX}F`);
    
    await insertCompensation(pool, id, "100000.00", "2025-01-01", null, "HIRE");

    await repository.addCompensation(id, change("120000.00", "2026-10-01", "PROMOTION"));
    const history = await repository.getHistory(id);

    expect(history[1]).toMatchObject({
      amount: "100000.00",
      effectiveFrom: "2025-01-01",
      effectiveTo: "2026-09-30",
    });
    expect(history[0]).toMatchObject({
      amount: "120000.00",
      effectiveFrom: "2026-10-01",
      effectiveTo: null,
    });
    await expectValidTimeline(pool, id);
  });

  it("closes the first future period when a later future change is added", async () => {
    const id = await insertEmployee(pool, `${RUN_PREFIX}F2`);
    
    await insertCompensation(pool, id, "100000.00", "2025-01-01", "2026-09-30", "HIRE");
    await insertCompensation(pool, id, "120000.00", "2026-10-01", null, "PROMOTION");

    await repository.addCompensation(id, change("130000.00", "2026-11-01", "MARKET_ADJUSTMENT"));
    const history = await repository.getHistory(id);

    expect(history.map((row) => [row.effectiveFrom, row.effectiveTo, row.amount])).toEqual([
      ["2026-11-01", null, "130000.00"],
      ["2026-10-01", "2026-10-31", "120000.00"],
      ["2025-01-01", "2026-09-30", "100000.00"],
    ]);
    expect(history.filter((row) => row.effectiveTo === null)).toHaveLength(1);
    await expectValidTimeline(pool, id);
  });

  it("splits an open period when the new start falls inside it", async () => {
    const id = await insertEmployee(pool, `${RUN_PREFIX}S`);
    
    await insertCompensation(pool, id, "100000.00", "2025-01-01", null, "HIRE");

    await repository.addCompensation(id, change("120000.00", "2026-01-01", "ANNUAL_REVIEW"));
    const history = await repository.getHistory(id);

    expect(history[1]).toMatchObject({
      effectiveFrom: "2025-01-01",
      effectiveTo: "2025-12-31",
      amount: "100000.00",
    });
    expect(history[0]).toMatchObject({
      effectiveFrom: "2026-01-01",
      effectiveTo: null,
      amount: "120000.00",
    });
    await expectValidTimeline(pool, id);
  });

  it("does not change historical amount, start date, or reason when closing a period", async () => {
    const id = await insertEmployee(pool, `${RUN_PREFIX}H2`);
    
    await insertCompensation(pool, id, "80000.00", "2023-01-01", "2023-12-31", "HIRE");
    await insertCompensation(pool, id, "100000.00", "2024-01-01", null, "ANNUAL_REVIEW");

    await repository.addCompensation(id, change("110000.00", "2026-09-24", "CORRECTION"));
    const history = await repository.getHistory(id);
    const hire = history.find((row) => row.changeReason === "HIRE");

    expect(hire).toMatchObject({
      amount: "80000.00",
      effectiveFrom: "2023-01-01",
      effectiveTo: "2023-12-31",
    });
    expect(history[0]?.changeReason).toBe("CORRECTION");
  });

  it("rejects a start date that is not after the open period", async () => {
    const id = await insertEmployee(pool, `${RUN_PREFIX}B`);
    
    await insertCompensation(pool, id, "100000.00", "2026-01-01", null, "HIRE");

    await expect(
      repository.addCompensation(id, change("110000.00", "2026-01-01", "PROMOTION")),
    ).rejects.toBeInstanceOf(ValidationError);

    const history = await repository.getHistory(id);
    expect(history).toHaveLength(1);
    expect(history[0]?.effectiveTo).toBeNull();
  });

  it("rolls back when the insert is rejected by the database", async () => {
    const id = await insertEmployee(pool, `${RUN_PREFIX}R`);
    
    await insertCompensation(pool, id, "100000.00", "2025-01-01", null, "HIRE");

    await expect(
      repository.addCompensation(id, {
        ...change("120000.00", "2026-09-24", "PROMOTION"),
        currency: "JPY" as never,
      }),
    ).rejects.toThrow();

    const history = await repository.getHistory(id);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ amount: "100000.00", effectiveTo: null });
  });

  it("serializes concurrent changes so only one open row remains", async () => {
    const id = await insertEmployee(pool, `${RUN_PREFIX}X`);
    
    await insertCompensation(pool, id, "100000.00", "2025-01-01", null, "HIRE");

    const results = await Promise.allSettled([
      repository.addCompensation(id, change("110000.00", "2026-10-01", "PROMOTION")),
      repository.addCompensation(id, change("120000.00", "2026-10-01", "MARKET_ADJUSTMENT")),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);

    const history = await repository.getHistory(id);
    expect(history.filter((row) => row.effectiveTo === null)).toHaveLength(1);
    expect(history).toHaveLength(2);
    await expectValidTimeline(pool, id);
  });
});

function change(amount: string, effectiveFrom: string, changeReason: CreateCompensationInput["changeReason"]): CreateCompensationInput {
  return {
    amount,
    currency: "USD",
    payFrequency: "ANNUALLY",
    effectiveFrom,
    changeReason,
  };
}

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
  amount: string,
  from: string,
  to: string | null,
  reason: string,
): Promise<void> {
  await pool.query(
    `
      INSERT INTO employee_compensations
        (employee_id, amount, currency, pay_frequency, effective_from, effective_to, change_reason)
      VALUES ($1, $2, 'USD', 'ANNUALLY', $3, $4, $5)
    `,
    [employeeId, amount, from, to, reason],
  );
}

async function countCompensations(pool: Pool): Promise<number> {
  const result = await pool.query<{ n: number }>("SELECT count(*)::int AS n FROM employee_compensations");
  return result.rows[0]!.n;
}

async function expectValidTimeline(pool: Pool, employeeId: string): Promise<void> {
  const result = await pool.query<{
    open_rows: number;
    overlaps: number;
    invalid_period: number;
  }>(
    `
      SELECT
        count(*) FILTER (WHERE effective_to IS NULL)::int AS open_rows,
        count(*) FILTER (
          WHERE effective_to IS NOT NULL AND effective_to < effective_from
        )::int AS invalid_period,
        (
          SELECT count(*)::int
          FROM employee_compensations a
          JOIN employee_compensations b
            ON a.employee_id = b.employee_id
           AND a.id < b.id
           AND daterange(a.effective_from, COALESCE(a.effective_to, 'infinity'::date), '[]')
            && daterange(b.effective_from, COALESCE(b.effective_to, 'infinity'::date), '[]')
          WHERE a.employee_id = $1::uuid
        ) AS overlaps
      FROM employee_compensations
      WHERE employee_id = $1::uuid
    `,
    [employeeId],
  );

  expect(result.rows[0]?.open_rows).toBe(1);
  expect(result.rows[0]?.invalid_period).toBe(0);
  expect(result.rows[0]?.overlaps).toBe(0);
}
