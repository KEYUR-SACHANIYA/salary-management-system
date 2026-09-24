import Link from "next/link";
import { formatCount, formatMoney } from "@/lib/formatting";
import type { SalaryOverview } from "@/types/analytics";

export function OverviewCards({
  overview,
  reportingCurrency,
}: {
  overview: SalaryOverview;
  reportingCurrency: string;
}) {
  const items = [
    { label: "Employees", value: formatCount(overview.employeeCount) },
    {
      label: "Total annualized",
      value: formatMoney(overview.totalAnnualCompensation, reportingCurrency),
    },
    {
      label: "Average",
      value: formatMoney(overview.averageAnnualCompensation, reportingCurrency),
    },
    {
      label: "Median",
      value: formatMoney(overview.medianAnnualCompensation, reportingCurrency),
    },
    {
      label: "Lowest",
      value: formatMoney(overview.lowestAnnualCompensation, reportingCurrency),
    },
    {
      label: "Highest",
      value: formatMoney(overview.highestAnnualCompensation, reportingCurrency),
    },
  ];

  return (
    <section
      aria-label="Salary overview"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-xl border border-slate-200 bg-white p-4"
        >
          <h2 className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {item.label}
          </h2>
          <p className="mt-2 text-xl font-semibold text-slate-900">{item.value}</p>
        </article>
      ))}
    </section>
  );
}

export function ViewEmployeesLink() {
  return (
    <Link
      href="/employees"
      className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
    >
      View employees
    </Link>
  );
}
