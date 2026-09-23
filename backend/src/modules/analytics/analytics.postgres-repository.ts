import type { Pool } from "pg";
import { CURRENCIES, FX_RATES_PER_USD, type Currency } from "../../shared/pay-rules";
import { ValidationError } from "../../shared/errors";
import type { AnalyticsRepository } from "./analytics.repository";
import type {
  CountrySalaryBreakdown,
  DepartmentSalaryBreakdown,
  NativeCurrencySalaryBreakdown,
  SalaryAnalytics,
  SalaryOverview,
} from "./analytics.types";

const RATE_SQL = CURRENCIES.map(
  (currency) => `WHEN '${currency}' THEN ${FX_RATES_PER_USD[currency]}::numeric`,
).join(" ");

const ANNUAL_NATIVE_SQL = `
  CASE c.pay_frequency
    WHEN 'ANNUALLY' THEN c.amount
    WHEN 'MONTHLY' THEN c.amount * 12
    WHEN 'WEEKLY' THEN c.amount * 52
    WHEN 'HOURLY' THEN c.amount * 40 * 52
  END
`;

const ANNUAL_REPORTING_SQL = `
  ROUND(
    (${ANNUAL_NATIVE_SQL})
    * (CASE $1::text ${RATE_SQL} END)
    / (CASE c.currency::text ${RATE_SQL} END),
    2
  )
`;

const CURRENT_COMPENSATION_FROM = `
  FROM employees e
  INNER JOIN employee_compensations c ON c.employee_id = e.id
  WHERE c.effective_from <= CURRENT_DATE
    AND (c.effective_to IS NULL OR c.effective_to >= CURRENT_DATE)
`;

type OverviewRow = {
  employee_count: number;
  total_annual_compensation: string;
  average_annual_compensation: string;
  median_annual_compensation: string;
  lowest_annual_compensation: string;
  highest_annual_compensation: string;
};

type CountryRow = {
  country: string;
  employee_count: number;
  total_annual_compensation: string;
  average_annual_compensation: string;
};

type DepartmentRow = {
  department: string;
  employee_count: number;
  total_annual_compensation: string;
  average_annual_compensation: string;
};

type NativeRow = {
  currency: string;
  employee_count: number;
  total_annual_compensation: string;
};

export class PostgresAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly pool: Pool) {}

  async getSalaryAnalytics(reportingCurrency: Currency): Promise<SalaryAnalytics> {
    if (!(CURRENCIES as readonly string[]).includes(reportingCurrency)) {
      throw new ValidationError("Currency is not supported.");
    }

    const [overview, byCountry, byDepartment, byNativeCurrency] = await Promise.all([
      this.loadOverview(reportingCurrency),
      this.loadByCountry(reportingCurrency),
      this.loadByDepartment(reportingCurrency),
      this.loadByNativeCurrency(),
    ]);

    return {
      reportingCurrency,
      overview,
      byCountry,
      byDepartment,
      byNativeCurrency,
    };
  }

  private async loadOverview(reportingCurrency: Currency): Promise<SalaryOverview> {
    const result = await this.pool.query<OverviewRow>(
      `
        SELECT
          count(*)::int AS employee_count,
          COALESCE(ROUND(SUM(${ANNUAL_REPORTING_SQL}), 2), 0)::text AS total_annual_compensation,
          COALESCE(ROUND(AVG(${ANNUAL_REPORTING_SQL}), 2), 0)::text AS average_annual_compensation,
          COALESCE(
            ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${ANNUAL_REPORTING_SQL}))::numeric, 2),
            0
          )::text AS median_annual_compensation,
          COALESCE(ROUND(MIN(${ANNUAL_REPORTING_SQL}), 2), 0)::text AS lowest_annual_compensation,
          COALESCE(ROUND(MAX(${ANNUAL_REPORTING_SQL}), 2), 0)::text AS highest_annual_compensation
        ${CURRENT_COMPENSATION_FROM}
      `,
      [reportingCurrency],
    );

    const row = result.rows[0]!;
    return {
      employeeCount: row.employee_count,
      totalAnnualCompensation: formatMoney(row.total_annual_compensation),
      averageAnnualCompensation: formatMoney(row.average_annual_compensation),
      medianAnnualCompensation: formatMoney(row.median_annual_compensation),
      lowestAnnualCompensation: formatMoney(row.lowest_annual_compensation),
      highestAnnualCompensation: formatMoney(row.highest_annual_compensation),
    };
  }

  private async loadByCountry(reportingCurrency: Currency): Promise<CountrySalaryBreakdown[]> {
    const result = await this.pool.query<CountryRow>(
      `
        SELECT
          e.country,
          count(*)::int AS employee_count,
          ROUND(SUM(${ANNUAL_REPORTING_SQL}), 2)::text AS total_annual_compensation,
          ROUND(AVG(${ANNUAL_REPORTING_SQL}), 2)::text AS average_annual_compensation
        ${CURRENT_COMPENSATION_FROM}
        GROUP BY e.country
        ORDER BY SUM(${ANNUAL_REPORTING_SQL}) DESC, e.country ASC
      `,
      [reportingCurrency],
    );

    return result.rows.map((row) => ({
      country: row.country,
      employeeCount: row.employee_count,
      totalAnnualCompensation: formatMoney(row.total_annual_compensation),
      averageAnnualCompensation: formatMoney(row.average_annual_compensation),
    }));
  }

  private async loadByDepartment(reportingCurrency: Currency): Promise<DepartmentSalaryBreakdown[]> {
    const result = await this.pool.query<DepartmentRow>(
      `
        SELECT
          e.department,
          count(*)::int AS employee_count,
          ROUND(SUM(${ANNUAL_REPORTING_SQL}), 2)::text AS total_annual_compensation,
          ROUND(AVG(${ANNUAL_REPORTING_SQL}), 2)::text AS average_annual_compensation
        ${CURRENT_COMPENSATION_FROM}
        GROUP BY e.department
        ORDER BY SUM(${ANNUAL_REPORTING_SQL}) DESC, e.department ASC
      `,
      [reportingCurrency],
    );

    return result.rows.map((row) => ({
      department: row.department,
      employeeCount: row.employee_count,
      totalAnnualCompensation: formatMoney(row.total_annual_compensation),
      averageAnnualCompensation: formatMoney(row.average_annual_compensation),
    }));
  }

  private async loadByNativeCurrency(): Promise<NativeCurrencySalaryBreakdown[]> {
    const result = await this.pool.query<NativeRow>(
      `
        SELECT
          c.currency::text,
          count(*)::int AS employee_count,
          ROUND(SUM(${ANNUAL_NATIVE_SQL}), 2)::text AS total_annual_compensation
        ${CURRENT_COMPENSATION_FROM}
        GROUP BY c.currency
        ORDER BY SUM(${ANNUAL_NATIVE_SQL}) DESC, c.currency ASC
      `,
    );

    return result.rows.map((row) => ({
      currency: row.currency as Currency,
      employeeCount: row.employee_count,
      totalAnnualCompensation: formatMoney(row.total_annual_compensation),
    }));
  }
}

function formatMoney(value: string): string {
  const [whole, fraction = "00"] = value.split(".");
  return `${whole}.${fraction.padEnd(2, "0").slice(0, 2)}`;
}
