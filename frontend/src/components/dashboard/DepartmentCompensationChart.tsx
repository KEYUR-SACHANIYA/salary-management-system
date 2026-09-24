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
import type { DepartmentSalaryBreakdown } from "@/types/analytics";

const BAR_COLORS = [
  "#2563EB",
  "#3B82F6",
  "#6366F1",
  "#60A5FA",
  "#0EA5E9",
  "#38BDF8",
  "#93C5FD",
  "#BFDBFE",
];

export function DepartmentCompensationChart({
  rows,
  reportingCurrency,
}: {
  rows: DepartmentSalaryBreakdown[];
  reportingCurrency: string;
}) {
  const data = [...rows]
    .filter((row) => Number(row.totalAnnualCompensation) > 0)
    .sort((a, b) => Number(b.totalAnnualCompensation) - Number(a.totalAnnualCompensation))
    .map((row) => ({
      department: row.department,
      totalAnnualCompensation: Number(row.totalAnnualCompensation),
      employeeCount: row.employeeCount,
      averageAnnualCompensation: Number(row.averageAnnualCompensation),
    }));

  if (data.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          Compensation by Department
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          No department compensation data available.
        </p>
      </section>
    );
  }

  const maxValue = Math.max(...data.map((row) => row.totalAnnualCompensation));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-base font-semibold text-slate-900">
          Compensation by Department
        </h2>
        <p className="text-sm text-slate-600">
          Total annualized compensation by department in {reportingCurrency}.
        </p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 12, left: 8, bottom: 8 }}
            barGap={8}
          >
            <CartesianGrid horizontal={false} stroke="#E2E8F0" strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[0, maxValue * 1.08]}
              tickFormatter={(value) => formatCompactCurrency(String(value), reportingCurrency)}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="department"
              width={110}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#334155", fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(37, 99, 235, 0.04)" }}
              formatter={(value, _name, item) => {
                const numeric = Number(value ?? 0);
                return [
                  formatMoney(String(numeric), reportingCurrency),
                  item?.payload?.department ?? "Total annualized compensation",
                ];
              }}
              labelFormatter={(label) => `${label}`}
              contentStyle={{
                borderRadius: 12,
                borderColor: "#E2E8F0",
                color: "#0F172A",
              }}
            />
            <Bar dataKey="totalAnnualCompensation" radius={[0, 8, 8, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`${entry.department}-${index}`}
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
