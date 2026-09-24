import {
  formatChangeReason,
  formatCompensationStatus,
  formatIsoDate,
  formatMoney,
  formatPayFrequency,
} from "@/lib/formatting";
import type { CompensationHistoryItem } from "@/types/compensations";

export function CompensationHistory({
  items,
}: {
  items: CompensationHistoryItem[];
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-600">
        No compensation records yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-[48rem] w-full border-collapse text-left text-sm">
        <caption className="sr-only">Compensation history</caption>
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <tr>
            <th scope="col" className="px-4 py-3">
              Status
            </th>
            <th scope="col" className="px-4 py-3">
              Amount
            </th>
            <th scope="col" className="px-4 py-3">
              Frequency
            </th>
            <th scope="col" className="px-4 py-3">
              Effective from
            </th>
            <th scope="col" className="px-4 py-3">
              Effective to
            </th>
            <th scope="col" className="px-4 py-3">
              Reason
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-slate-100">
              <td className="px-4 py-3">
                <StatusBadge status={item.status} />
              </td>
              <td className="px-4 py-3 font-medium text-slate-900">
                {formatMoney(item.amount, item.currency)}
              </td>
              <td className="px-4 py-3 text-slate-700">
                {formatPayFrequency(item.payFrequency)}
              </td>
              <td className="px-4 py-3 text-slate-700">
                {formatIsoDate(item.effectiveFrom)}
              </td>
              <td className="px-4 py-3 text-slate-700">
                {item.effectiveTo ? formatIsoDate(item.effectiveTo) : "Open"}
              </td>
              <td className="px-4 py-3 text-slate-700">
                {item.changeReason
                  ? formatChangeReason(item.changeReason)
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: CompensationHistoryItem["status"];
}) {
  const className =
    status === "CURRENT"
      ? "bg-emerald-50 text-emerald-800"
      : status === "FUTURE"
        ? "bg-sky-50 text-sky-800"
        : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {formatCompensationStatus(status)}
    </span>
  );
}
