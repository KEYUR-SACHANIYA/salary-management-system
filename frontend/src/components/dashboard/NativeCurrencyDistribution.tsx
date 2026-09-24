"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { NativeCurrencySalaryBreakdown } from "@/types/analytics";

const CURRENCY_COLORS: Record<string, string> = {
  INR: "#2563EB",
  USD: "#6366F1",
  SGD: "#0D9488",
  CAD: "#059669",
  GBP: "#7C3AED",
  EUR: "#D97706",
};

export function NativeCurrencyDistribution({
  rows,
}: {
  rows: NativeCurrencySalaryBreakdown[];
}) {
  const totalEmployees = rows.reduce((sum, row) => sum + row.employeeCount, 0);

  const data = [
    {
      name: "Employees",
      ...Object.fromEntries(
        rows.map((row) => {
          const percentage = totalEmployees === 0 ? 0 : (row.employeeCount / totalEmployees) * 100;
          return [row.currency, Number(percentage.toFixed(2))];
        }),
      ),
    },
  ];

  if (rows.length === 0 || totalEmployees === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Native Currency Distribution</h2>
        <p className="mt-2 text-sm text-slate-600">No native-currency distribution data available.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-base font-semibold text-slate-900">Native Currency Distribution</h2>
        <p className="text-sm text-slate-600">
          Share of employees by original salary currency.
        </p>
      </div>

      <div className="h-28 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 12, left: 18, bottom: 8 }}
            barCategoryGap={0}
          >
            <CartesianGrid horizontal={false} stroke="#E2E8F0" strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip
              formatter={(value) => [`${value ?? 0}%`, "Share of employees"]}
              contentStyle={{
                borderRadius: 12,
                borderColor: "#E2E8F0",
                color: "#0F172A",
              }}
            />
            {rows.map((row) => (
              <Bar
                key={row.currency}
                dataKey={row.currency}
                stackId="currencyShare"
                fill={CURRENCY_COLORS[row.currency] ?? "#94A3B8"}
                radius={row.currency === rows[rows.length - 1].currency ? [0, 8, 8, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {rows.map((row) => {
          const percentage = totalEmployees === 0 ? 0 : (row.employeeCount / totalEmployees) * 100;
          return (
            <div key={row.currency} className="flex items-center justify-between rounded-lg border border-slate-200 px-2.5 py-2">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CURRENCY_COLORS[row.currency] ?? "#94A3B8" }}
                />
                <span className="text-sm font-medium text-slate-700">{row.currency}</span>
              </div>
              <div className="text-right text-sm text-slate-600">
                <div>{percentage.toFixed(1)}%</div>
                <div className="text-xs text-slate-500">{row.employeeCount} employees</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
