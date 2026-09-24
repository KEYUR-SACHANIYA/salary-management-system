"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCount, formatMoney } from "@/lib/formatting";

type BreakdownRow = {
  label: string;
  employeeCount: number;
  totalAnnualCompensation: string;
  averageAnnualCompensation?: string;
  currency: string;
};

const CURRENCY_COLORS: Record<string, string> = {
  INR: "#2563EB",
  USD: "#4F46E5",
  SGD: "#0D9488",
  CAD: "#059669",
  GBP: "#7C3AED",
  EUR: "#D97706",
};

export function BreakdownTable({
  title,
  caption,
  labelHeader,
  rows,
  showAverage = true,
  description,
}: {
  title: string;
  caption: string;
  labelHeader: string;
  rows: BreakdownRow[];
  showAverage?: boolean;
  description?: string;
}) {
  const totalEmployees = rows.reduce((sum, row) => sum + row.employeeCount, 0);
  const data = rows.map((row) => ({
    name: row.label,
    value: row.employeeCount,
    totalAnnualCompensation: row.totalAnnualCompensation,
    currency: row.currency,
    fill: CURRENCY_COLORS[row.currency] ?? "#94A3B8",
  }));

  const chartTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: ReadonlyArray<{
      payload: {
        name: string;
        value: number;
        currency: string;
        totalAnnualCompensation: string;
      };
    }>;
  }) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const segment = payload[0].payload;
    const percentage = totalEmployees === 0 ? 0 : (segment.value / totalEmployees) * 100;

    return (
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {segment.name}
        </div>
        <div className="mt-2 text-sm font-medium text-slate-900">
          {formatMoney(segment.totalAnnualCompensation, segment.currency)}
        </div>
        <div className="mt-1 text-xs text-slate-600">
          {formatCount(segment.value)} employees · {percentage.toFixed(1)}%
        </div>
      </div>
    );
  };

  return (
    <section
      aria-label={`${labelHeader} breakdown`}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-1 text-xs text-slate-600">{description}</p>
        ) : null}
      </div>

      <div className="grid gap-5 p-4 md:grid-cols-[minmax(200px,0.9fr)_minmax(220px,1.1fr)] md:items-center">
        <div className="mx-auto h-56 w-full max-w-[260px]" aria-label={caption}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={chartTooltip} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={52}
                outerRadius={82}
                paddingAngle={3}
                stroke="#ffffff"
                strokeWidth={2}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.fill}
                    style={{ cursor: "pointer" }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          {rows.length === 0 ? (
            <p className="text-sm text-slate-600">No breakdown data.</p>
          ) : (
            rows.map((row) => {
              const percentage =
                totalEmployees === 0 ? 0 : (row.employeeCount / totalEmployees) * 100;

              return (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: CURRENCY_COLORS[row.currency] ?? "#94A3B8" }}
                    />
                    <span className="truncate text-sm font-medium text-slate-800">{row.label}</span>
                  </div>
                  <div className="shrink-0 text-right text-[11px] text-slate-600">
                    <div>{formatCount(row.employeeCount)} · {percentage.toFixed(1)}%</div>
                    <div className="mt-0.5 font-medium text-slate-800">
                      {formatMoney(row.totalAnnualCompensation, row.currency)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
