import { makeSchemaSqlIdempotent } from "../../src/db/seed/seed";

describe("makeSchemaSqlIdempotent", () => {
  it("makes the schema safe to apply repeatedly", () => {
    const sql = `
      CREATE TABLE employees (
        id UUID PRIMARY KEY,
        employee_code VARCHAR(20) NOT NULL UNIQUE
      );

      CREATE TABLE employee_compensations (
        id UUID PRIMARY KEY,
        employee_id UUID NOT NULL REFERENCES employees (id)
      );

      CREATE UNIQUE INDEX employee_compensations_one_open_per_employee
      ON employee_compensations (employee_id)
      WHERE effective_to IS NULL;

      CREATE INDEX employees_country_idx
      ON employees (country);
    `;

    const result = makeSchemaSqlIdempotent(sql);

    expect(result).toContain("CREATE TABLE IF NOT EXISTS employees");
    expect(result).toContain("CREATE TABLE IF NOT EXISTS employee_compensations");
    expect(result).toContain("CREATE UNIQUE INDEX IF NOT EXISTS employee_compensations_one_open_per_employee");
    expect(result).toContain("CREATE INDEX IF NOT EXISTS employees_country_idx");
  });
});
