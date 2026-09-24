"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactCurrency, formatMoney } from "@/lib/formatting";
import type { CountrySalaryBreakdown } from "@/types/analytics";

const BAR_COLORS = ["#0D9488", "#14B8A6", "#2DD4BF", "#5EEAD4", "#99F6E4", "#CCFBF1"];

export function CountryCompensationChart({
  rows,
  reportingCurrency,
}: {
  rows: CountrySalaryBreakdown[];
  reportingCurrency: string;
}) {
  const data = [...rows]
    .filter((row) => Number(row.totalAnnualCompensation) > 0)
    .sort((a, b) => Number(b.totalAnnualCompensation) - Number(a.totalAnnualCompensation))
    .map((row) => ({
      country: row.country,
      totalAnnualCompensation: Number(row.totalAnnualCompensation),
      employeeCount: row.employeeCount,
      averageAnnualCompensation: Number(row.averageAnnualCompensation),
    }));

  if (data.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Compensation by Country</h2>
        <p className="mt-2 text-sm text-slate-600">No country compensation data available.</p>
      </section>
    );
  }

  const maxValue = Math.max(...data.map((row) => row.totalAnnualCompensation));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-base font-semibold text-slate-900">Compensation by Country</h2>
        <p className="text-sm text-slate-600">
          Total annualized compensation by country in {reportingCurrency}.
        </p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 8, bottom: 36 }}
          >
            <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
            <XAxis
              dataKey="country"
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-18}
              textAnchor="end"
              height={54}
              tick={{ fill: "#334155", fontSize: 11 }}
              minTickGap={8}
            />
            <YAxis
              tickFormatter={(value) => formatCompactCurrency(String(value), reportingCurrency)}
              tickLine={false}
              axisLine={false}
              width={54}
              tick={{ fill: "#64748B", fontSize: 11 }}
              domain={[0, maxValue * 1.08]}
            />
            <Tooltip
              cursor={{ fill: "rgba(13, 148, 136, 0.04)" }}
              formatter={(value, _name, item) => [
                formatMoney(String(value ?? 0), reportingCurrency),
                item?.payload?.country ?? "Total annualized compensation",
              ]}
              contentStyle={{
                borderRadius: 12,
                borderColor: "#E2E8F0",
                color: "#0F172A",
              }}
            />
            <Bar dataKey="totalAnnualCompensation" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`${entry.country}-${index}`}
                  fill={BAR_COLORS[index % BAR_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
