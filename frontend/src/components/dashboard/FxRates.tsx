import { FX_RATES_PER_USD, FX_RATE_DATE, SUPPORTED_CURRENCIES } from "@/lib/constants";

export function FxRates() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-base font-semibold text-slate-900">Fixed FX rates</h2>
        <p className="mt-1 text-sm text-slate-600">
          Units per 1 USD, fixed on {FX_RATE_DATE}. These rates are not live.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <caption className="sr-only">Fixed foreign exchange rates</caption>
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th scope="col" className="px-4 py-3">
                Currency
              </th>
              <th scope="col" className="px-4 py-3">
                Rate per 1 USD
              </th>
            </tr>
          </thead>
          <tbody>
            {SUPPORTED_CURRENCIES.map((currency) => (
              <tr key={currency} className="border-t border-slate-100">
                <th scope="row" className="px-4 py-3 font-medium text-slate-900">
                  {currency}
                </th>
                <td className="px-4 py-3 font-mono text-slate-700">
                  {FX_RATES_PER_USD[currency]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
