import pg from "pg";
import { generateEmployees } from "./data-generator";

const EMPLOYEE_COUNT = 10_000;
const FIXED_SEED = 20260924;
const BATCH_SIZE = 1_000;

// Replaces any existing rows so running the seed again does not create duplicates.
const RESET_TABLES = "TRUNCATE TABLE employee_compensations, employees";

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required.");
    process.exitCode = 1;
    return;
  }

  const client = new pg.Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    await client.query("BEGIN");
    await client.query(RESET_TABLES);

    const { employees, compensations } = generateEmployees(EMPLOYEE_COUNT, FIXED_SEED);

    await insertBatches(
      client,
      "employees",
      ["id", "employee_code", "name", "country", "department", "role"],
      employees.map((employee) => [
        employee.id,
        employee.employeeCode,
        employee.name,
        employee.country,
        employee.department,
        employee.role,
      ]),
    );

    await insertBatches(
      client,
      "employee_compensations",
      [
        "id",
        "employee_id",
        "amount",
        "currency",
        "pay_frequency",
        "effective_from",
        "effective_to",
        "change_reason",
      ],
      compensations.map((compensation) => [
        compensation.id,
        compensation.employeeId,
        compensation.amount,
        compensation.currency,
        compensation.payFrequency,
        compensation.effectiveFrom,
        compensation.effectiveTo,
        compensation.changeReason,
      ]),
    );

    await client.query("COMMIT");
    console.log("Database seed completed.");
    console.log(`Employees: ${employees.length.toLocaleString("en-US")}`);
    console.log(`Compensation records: ${compensations.length.toLocaleString("en-US")}`);
    console.log(`Seed: ${FIXED_SEED}`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error(safeMessage(error));
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

async function insertBatches(
  client: pg.Client,
  table: string,
  columns: string[],
  rows: unknown[][],
): Promise<void> {
  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    const batch = rows.slice(start, start + BATCH_SIZE);
    const values: unknown[] = [];
    const tuples = batch.map((row, rowIndex) => {
      const placeholders = row.map((_, columnIndex) => {
        values.push(row[columnIndex]);
        return `$${rowIndex * columns.length + columnIndex + 1}`;
      });
      return `(${placeholders.join(", ")})`;
    });

    await client.query(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${tuples.join(", ")}`,
      values,
    );
  }
}

function safeMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Seed failed";
  return message.split("\n")[0]?.replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted]") ?? "Seed failed";
}

void main();
