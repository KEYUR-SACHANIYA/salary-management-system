import {
  formatChangeReason,
  formatCompensationStatus,
  formatCurrencyAmount,
  formatIsoDate,
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
    <div className="space-y-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {formatCurrencyAmount(item.amount, item.currency)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {formatPayFrequency(item.payFrequency)}
              </p>
            </div>
            <StatusBadge status={item.status} />
          </div>

          <dl className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2 xl:grid-cols-4">
            <Definition term="Effective from" value={formatIsoDate(item.effectiveFrom)} />
            <Definition
              term="Effective to"
              value={item.effectiveTo ? formatIsoDate(item.effectiveTo) : "Open"}
            />
            <Definition
              term="Reason"
              value={item.changeReason ? formatChangeReason(item.changeReason) : "—"}
            />
            <Definition term="Currency" value={item.currency} />
          </dl>
        </article>
      ))}
    </div>
  );
}

function Definition({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {term}
      </dt>
      <dd className="mt-1 text-sm text-slate-800">{value}</dd>
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
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : status === "FUTURE"
        ? "bg-sky-50 text-sky-800 ring-sky-200"
        : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${className}`}
    >
      {formatCompensationStatus(status)}
    </span>
  );
}
