import Link from "next/link";
import {
  formatCompactCurrency,
  formatCount,
  formatMoney,
} from "@/lib/formatting";
import type { SalaryOverview } from "@/types/analytics";

const KPI_ACCENTS = {
  Employees: "border-blue-500 bg-blue-50 text-blue-700",
  "Total Payroll": "border-indigo-500 bg-indigo-50 text-indigo-700",
  "Average Salary": "border-teal-500 bg-teal-50 text-teal-700",
  "Median Salary": "border-violet-500 bg-violet-50 text-violet-700",
} as const;

export function OverviewCards({
  overview,
  reportingCurrency,
}: {
  overview: SalaryOverview;
  reportingCurrency: string;
}) {
  const items = [
    {
      label: "Employees",
      value: formatCount(overview.employeeCount),
      detail: "Active employees",
    },
    {
      label: "Total Payroll",
      value: formatCompactCurrency(overview.totalAnnualCompensation, reportingCurrency),
      exact: formatMoney(overview.totalAnnualCompensation, reportingCurrency),
      detail: "Annualized compensation",
    },
    {
      label: "Average Salary",
      value: formatCompactCurrency(overview.averageAnnualCompensation, reportingCurrency),
      exact: formatMoney(overview.averageAnnualCompensation, reportingCurrency),
      detail: "Annualized per employee",
    },
    {
      label: "Median Salary",
      value: formatCompactCurrency(overview.medianAnnualCompensation, reportingCurrency),
      exact: formatMoney(overview.medianAnnualCompensation, reportingCurrency),
      detail: "Annualized per employee",
    },
  ];

  return (
    <section aria-label="Salary overview" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {item.label}
            </p>
            <span
              className={`inline-flex h-2.5 w-2.5 rounded-full border ${KPI_ACCENTS[item.label as keyof typeof KPI_ACCENTS]}`}
            />
          </div>
          <p
            className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.75rem]"
            title={item.exact ?? item.value}
          >
            {item.value}
          </p>
          <p className="mt-2 text-xs text-slate-500">{item.detail}</p>
        </article>
      ))}
    </section>
  );
}

export function ViewEmployeesLink() {
  return (
    <Link
      href="/employees"
      className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
    >
      View employees
    </Link>
  );
}
