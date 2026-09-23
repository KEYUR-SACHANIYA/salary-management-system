import type { Pool } from "pg";
import { EmployeeNotFoundError, ValidationError } from "../../shared/errors";
import type { ChangeReason, Currency, PayFrequency } from "../../shared/pay-rules";
import type { CompensationRepository } from "./compensation.repository";
import type { Compensation, CreateCompensationInput } from "./compensation.types";

type CompensationRow = {
  id: string;
  employee_id: string;
  amount: string;
  currency: string;
  pay_frequency: string;
  effective_from: string;
  effective_to: string | null;
  change_reason: string | null;
  created_at: string;
};

const COMPENSATION_COLUMNS = `
  id::text,
  employee_id::text,
  amount::text,
  currency::text,
  pay_frequency,
  effective_from::text,
  effective_to::text,
  change_reason,
  created_at::text
`;

export class PostgresCompensationRepository implements CompensationRepository {
  constructor(private readonly pool: Pool) {}

  async getHistory(employeeId: string): Promise<Compensation[]> {
    const employee = await this.pool.query("SELECT 1 FROM employees WHERE id = $1::uuid", [employeeId]);
    if (employee.rowCount === 0) {
      throw new EmployeeNotFoundError();
    }

    const result = await this.pool.query<CompensationRow>(
      `
        SELECT ${COMPENSATION_COLUMNS}
        FROM employee_compensations
        WHERE employee_id = $1::uuid
        ORDER BY effective_from DESC, created_at DESC, id DESC
      `,
      [employeeId],
    );

    return result.rows.map((row) => this.toCompensation(row));
  }

  async addCompensation(employeeId: string, input: CreateCompensationInput): Promise<Compensation> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const employee = await client.query("SELECT id FROM employees WHERE id = $1::uuid FOR UPDATE", [
        employeeId,
      ]);
      if (employee.rowCount === 0) {
        throw new EmployeeNotFoundError();
      }

      const open = await client.query<CompensationRow>(
        `
          SELECT ${COMPENSATION_COLUMNS}
          FROM employee_compensations
          WHERE employee_id = $1::uuid AND effective_to IS NULL
          FOR UPDATE
        `,
        [employeeId],
      );

      const openRow = open.rows[0];
      if (openRow) {
        if (input.effectiveFrom <= openRow.effective_from) {
          throw new ValidationError("effectiveFrom must be after the previous compensation start date.");
        }

        await client.query(
          `
            UPDATE employee_compensations
            SET effective_to = ($2::date - 1)
            WHERE id = $1::uuid
          `,
          [openRow.id, input.effectiveFrom],
        );
      }

      const inserted = await client.query<CompensationRow>(
        `
          INSERT INTO employee_compensations (
            employee_id,
            amount,
            currency,
            pay_frequency,
            effective_from,
            effective_to,
            change_reason
          )
          VALUES ($1::uuid, $2::numeric, $3, $4, $5::date, NULL, $6)
          RETURNING ${COMPENSATION_COLUMNS}
        `,
        [
          employeeId,
          input.amount,
          input.currency,
          input.payFrequency,
          input.effectiveFrom,
          input.changeReason,
        ],
      );

      await client.query("COMMIT");
      return this.toCompensation(inserted.rows[0]!);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private toCompensation(row: CompensationRow): Compensation {
    return {
      id: row.id,
      employeeId: row.employee_id,
      amount: formatMoney(row.amount),
      currency: row.currency as Currency,
      payFrequency: row.pay_frequency as PayFrequency,
      effectiveFrom: row.effective_from,
      effectiveTo: row.effective_to,
      changeReason: row.change_reason as ChangeReason | null,
      createdAt: row.created_at,
    };
  }
}

function formatMoney(value: string): string {
  const [whole, fraction = "00"] = value.split(".");
  return `${whole}.${fraction.padEnd(2, "0").slice(0, 2)}`;
}
