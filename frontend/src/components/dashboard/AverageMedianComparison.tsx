"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactCurrency, formatMoney } from "@/lib/formatting";
import type { SalaryOverview } from "@/types/analytics";

export function AverageMedianComparison({
  overview,
  reportingCurrency,
}: {
  overview: SalaryOverview;
  reportingCurrency: string;
}) {
  const data = [
    {
      label: "Compensation",
      averageAnnualCompensation: Number(overview.averageAnnualCompensation),
      medianAnnualCompensation: Number(overview.medianAnnualCompensation),
    },
  ];

  const maxValue = Math.max(
    Number(overview.averageAnnualCompensation),
    Number(overview.medianAnnualCompensation),
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-base font-semibold text-slate-900">Average vs Median</h2>
        <p className="text-sm text-slate-600">
          Annualized compensation comparison in {reportingCurrency}.
        </p>
      </div>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
            <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
            <XAxis dataKey="label" hide />
            <YAxis
              tickFormatter={(value) => formatCompactCurrency(String(value), reportingCurrency)}
              tickLine={false}
              axisLine={false}
              width={54}
              tick={{ fill: "#64748B", fontSize: 11 }}
              domain={[0, maxValue * 1.12]}
            />
            <Tooltip
              formatter={(value, name) => [
                formatMoney(String(value ?? 0), reportingCurrency),
                name === "averageAnnualCompensation" ? "Average" : "Median",
              ]}
              contentStyle={{
                borderRadius: 12,
                borderColor: "#E2E8F0",
                color: "#0F172A",
              }}
            />
            <Bar dataKey="averageAnnualCompensation" fill="#2563EB" radius={[8, 8, 0, 0]} />
            <Bar dataKey="medianAnnualCompensation" fill="#6366F1" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-blue-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-700">
            Average
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {formatMoney(overview.averageAnnualCompensation, reportingCurrency)}
          </p>
        </div>
        <div className="rounded-xl bg-indigo-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-700">
            Median
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {formatMoney(overview.medianAnnualCompensation, reportingCurrency)}
          </p>
        </div>
      </div>
    </section>
  );
}
