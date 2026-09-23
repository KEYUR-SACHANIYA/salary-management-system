import type { Pool } from "pg";
import type { Currency, PayFrequency } from "../../shared/pay-rules";
import { CURRENCIES, FX_RATES_PER_USD } from "../../shared/pay-rules";
import type { EmployeeRepository } from "./employee.repository";
import type {
  Employee,
  EmployeeCurrentCompensation,
  EmployeeListItem,
  EmployeeListQuery,
  EmployeeListResult,
} from "./employee.types";

const SORT_COLUMNS = {
  name: "e.name",
  employeeCode: "e.employee_code",
  salary: "reporting_salary_value",
} as const;

const RATE_SQL = CURRENCIES.map(
  (currency) => `WHEN '${currency}' THEN ${FX_RATES_PER_USD[currency]}::numeric`,
).join(" ");

const ANNUAL_AMOUNT_SQL = `
  CASE c.pay_frequency
    WHEN 'ANNUALLY' THEN c.amount
    WHEN 'MONTHLY' THEN c.amount * 12
    WHEN 'WEEKLY' THEN c.amount * 52
    WHEN 'HOURLY' THEN c.amount * 40 * 52
  END
`;

const REPORTING_SALARY_SQL = `
  ROUND(
    (${ANNUAL_AMOUNT_SQL})
    * (CASE $1::text ${RATE_SQL} END)
    / (CASE c.currency::text ${RATE_SQL} END),
    2
  )
`;

type EmployeeRow = {
  id: string;
  employee_code: string;
  name: string;
  country: string;
  department: string;
  role: string;
  created_at: string;
  updated_at: string;
};

type ListRow = EmployeeRow & {
  amount: string | null;
  currency: string | null;
  pay_frequency: string | null;
  effective_from: string | null;
  reporting_salary: string | null;
};

export class PostgresEmployeeRepository implements EmployeeRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<Employee | null> {
    const result = await this.pool.query<EmployeeRow>(
      `
        SELECT
          id::text,
          employee_code,
          name,
          country,
          department,
          role,
          created_at::text,
          updated_at::text
        FROM employees
        WHERE id = $1::uuid
      `,
      [id],
    );

    const row = result.rows[0];
    return row ? this.toEmployee(row) : null;
  }

  async list(query: EmployeeListQuery): Promise<EmployeeListResult> {
    const { whereSql, values } = this.listFilters(query);
    const sortColumn = SORT_COLUMNS[query.sortBy];
    const sortDirection = query.sortOrder === "desc" ? "DESC" : "ASC";
    const offset = (query.page - 1) * query.pageSize;

    const countResult = await this.pool.query<{ total: string }>(
      `
        SELECT count(*)::int AS total
        FROM employees e
        LEFT JOIN LATERAL (${this.currentCompensationSql()}) c ON TRUE
        ${whereSql}
      `,
      values,
    );

    const dataResult = await this.pool.query<ListRow>(
      `
        SELECT
          e.id::text,
          e.employee_code,
          e.name,
          e.country,
          e.department,
          e.role,
          e.created_at::text,
          e.updated_at::text,
          c.amount::text,
          c.currency::text,
          c.pay_frequency,
          c.effective_from::text,
          (${REPORTING_SALARY_SQL}) AS reporting_salary_value,
          (${REPORTING_SALARY_SQL})::text AS reporting_salary
        FROM employees e
        LEFT JOIN LATERAL (${this.currentCompensationSql()}) c ON TRUE
        ${whereSql}
        ORDER BY ${sortColumn} ${sortDirection} NULLS LAST, e.employee_code ASC
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `,
      [...values, query.pageSize, offset],
    );

    return {
      data: dataResult.rows.map((row) => this.toListItem(row)),
      total: Number(countResult.rows[0]?.total ?? 0),
    };
  }

  private currentCompensationSql(): string {
    return `
      SELECT
        amount,
        currency,
        pay_frequency,
        effective_from
      FROM employee_compensations
      WHERE employee_id = e.id
        AND effective_from <= CURRENT_DATE
        AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
      ORDER BY effective_from DESC
      LIMIT 1
    `;
  }

  private listFilters(query: EmployeeListQuery): { whereSql: string; values: unknown[] } {
    const conditions: string[] = ["$1::text IS NOT NULL"];
    const values: unknown[] = [query.reportingCurrency];

    if (query.search) {
      values.push(`%${query.search}%`);
      conditions.push(`(e.name ILIKE $${values.length} OR e.employee_code ILIKE $${values.length})`);
    }
    if (query.country) {
      values.push(query.country);
      conditions.push(`e.country = $${values.length}`);
    }
    if (query.department) {
      values.push(query.department);
      conditions.push(`e.department = $${values.length}`);
    }
    if (query.currency) {
      values.push(query.currency);
      conditions.push(`c.currency = $${values.length}`);
    }
    if (query.payFrequency) {
      values.push(query.payFrequency);
      conditions.push(`c.pay_frequency = $${values.length}`);
    }

    return {
      whereSql: `WHERE ${conditions.join(" AND ")}`,
      values,
    };
  }

  private toEmployee(row: EmployeeRow): Employee {
    return {
      id: row.id,
      employeeCode: row.employee_code,
      name: row.name,
      country: row.country,
      department: row.department,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toListItem(row: ListRow): EmployeeListItem {
    return {
      ...this.toEmployee(row),
      currentCompensation: this.toCurrentCompensation(row),
    };
  }

  private toCurrentCompensation(row: ListRow): EmployeeCurrentCompensation | null {
    if (
      row.amount === null ||
      row.currency === null ||
      row.pay_frequency === null ||
      row.effective_from === null ||
      row.reporting_salary === null
    ) {
      return null;
    }

    return {
      amount: formatMoney(row.amount),
      currency: row.currency as Currency,
      payFrequency: row.pay_frequency as PayFrequency,
      effectiveFrom: row.effective_from,
      reportingSalary: formatMoney(row.reporting_salary),
    };
  }
}

function formatMoney(value: string): string {
  const [whole, fraction = "00"] = value.split(".");
  return `${whole}.${fraction.padEnd(2, "0").slice(0, 2)}`;
}
