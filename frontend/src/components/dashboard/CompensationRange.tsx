import { formatCompactCurrency, formatMoney } from "@/lib/formatting";
import type { SalaryOverview } from "@/types/analytics";

export function CompensationRange({
  overview,
  reportingCurrency,
}: {
  overview: SalaryOverview;
  reportingCurrency: string;
}) {
  const lowest = Number(overview.lowestAnnualCompensation);
  const highest = Number(overview.highestAnnualCompensation);
  const range = highest - lowest;
  const leftPercent = 0;
  const rightPercent = range === 0 ? 100 : 100;

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
            Compensation range
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-slate-900">
            Lowest → highest
          </h2>
        </div>
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
          Annualized
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="relative h-12">
            <div className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full bg-slate-200" />
            <div
              className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"
              style={{
                left: `${leftPercent}%`,
                width: `${Math.max(8, rightPercent - leftPercent)}%`,
              }}
            />
            <span className="absolute left-0 top-1/2 flex h-6 w-6 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-[10px] font-semibold text-white shadow-sm">
              L
            </span>
            <span className="absolute right-0 top-1/2 flex h-6 w-6 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-violet-600 text-[10px] font-semibold text-white shadow-sm">
              H
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
              Lowest
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-slate-900">
              {formatCompactCurrency(overview.lowestAnnualCompensation, reportingCurrency)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {formatMoney(overview.lowestAnnualCompensation, reportingCurrency)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
              Highest
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-slate-900">
              {formatCompactCurrency(overview.highestAnnualCompensation, reportingCurrency)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {formatMoney(overview.highestAnnualCompensation, reportingCurrency)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
