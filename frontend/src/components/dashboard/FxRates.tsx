import { FX_RATES_PER_USD, FX_RATE_DATE, SUPPORTED_CURRENCIES } from "@/lib/constants";

export function FxRates() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-700">FX assumptions</h2>
        <p className="mt-1 text-xs text-slate-500">
          Fixed rates per 1 USD, set on {FX_RATE_DATE}. These values are not live market rates.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <caption className="sr-only">Fixed foreign exchange rates</caption>
          <thead className="bg-slate-100 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3">
                Currency
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Rate per 1 USD
              </th>
            </tr>
          </thead>
          <tbody>
            {SUPPORTED_CURRENCIES.map((currency) => (
              <tr key={currency} className="border-t border-slate-200">
                <th scope="row" className="px-4 py-3 font-medium text-slate-700">
                  {currency}
                </th>
                <td className="px-4 py-3 text-right font-mono text-slate-600">
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
