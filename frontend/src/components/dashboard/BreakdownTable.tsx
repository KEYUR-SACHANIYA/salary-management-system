import { formatCount, formatMoney } from "@/lib/formatting";

type BreakdownRow = {
  label: string;
  employeeCount: number;
  totalAnnualCompensation: string;
  averageAnnualCompensation?: string;
  currency: string;
};

export function BreakdownTable({
  title,
  caption,
  labelHeader,
  rows,
  showAverage = true,
}: {
  title: string;
  caption: string;
  labelHeader: string;
  rows: BreakdownRow[];
  showAverage?: boolean;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th scope="col" className="px-4 py-3">
                {labelHeader}
              </th>
              <th scope="col" className="px-4 py-3">
                Employees
              </th>
              <th scope="col" className="px-4 py-3">
                Total annualized
              </th>
              {showAverage ? (
                <th scope="col" className="px-4 py-3">
                  Average
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-4 text-slate-600"
                  colSpan={showAverage ? 4 : 3}
                >
                  No breakdown data.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.label} className="border-t border-slate-100">
                  <th scope="row" className="px-4 py-3 font-medium text-slate-900">
                    {row.label}
                  </th>
                  <td className="px-4 py-3 text-slate-700">
                    {formatCount(row.employeeCount)}
                  </td>
                  <td className="px-4 py-3 text-slate-900">
                    {formatMoney(row.totalAnnualCompensation, row.currency)}
                  </td>
                  {showAverage && row.averageAnnualCompensation ? (
                    <td className="px-4 py-3 text-slate-700">
                      {formatMoney(row.averageAnnualCompensation, row.currency)}
                    </td>
                  ) : showAverage ? (
                    <td className="px-4 py-3 text-slate-700">—</td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
