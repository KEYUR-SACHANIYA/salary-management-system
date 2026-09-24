"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EmployeeSortField, SortOrder } from "@/lib/constants";
import {
  applyDirectoryUpdates,
  directoryHref,
} from "@/lib/employee-directory-query";
import { formatMoney, formatPayFrequency } from "@/lib/formatting";
import type { EmployeeListItem, EmployeeListParams } from "@/types/employees";

const SORTABLE: Array<{ field: EmployeeSortField; label: string }> = [
  { field: "name", label: "Name" },
  { field: "employeeCode", label: "Employee code" },
];

export function EmployeeTable({
  employees,
  query,
}: {
  employees: EmployeeListItem[];
  query: EmployeeListParams;
}) {
  const router = useRouter();
  const sortBy = query.sortBy ?? "employeeCode";
  const sortOrder = query.sortOrder ?? "asc";

  function sortHref(field: EmployeeSortField): string {
    const nextOrder: SortOrder =
      sortBy === field && sortOrder === "asc" ? "desc" : "asc";

    return directoryHref(
      applyDirectoryUpdates(
        query,
        { sortBy: field, sortOrder: nextOrder },
        { resetPage: true },
      ),
    );
  }

  return (
    <>
      <div className="hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <caption className="sr-only">Employee directory</caption>
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
              <tr>
                {SORTABLE.map((column) => (
                  <th
                    key={column.field}
                    scope="col"
                    className="px-3 py-3 text-left align-middle"
                    aria-sort={ariaSort(sortBy, sortOrder, column.field)}
                  >
                    <Link
                      href={sortHref(column.field)}
                      className="inline-flex items-center gap-1.5 text-slate-700 transition-colors hover:text-slate-900"
                    >
                      {column.label}
                      <SortIndicator active={sortBy === column.field} order={sortOrder} />
                    </Link>
                  </th>
                ))}
                <th scope="col" className="px-3 py-3 text-left align-middle">
                  Country
                </th>
                <th scope="col" className="px-3 py-3 text-left align-middle">
                  Department
                </th>
                <th scope="col" className="px-3 py-3 text-left align-middle">
                  Role
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left align-middle"
                  aria-sort={ariaSort(sortBy, sortOrder, "salary")}
                >
                  <Link
                    href={sortHref("salary")}
                    className="inline-flex items-center gap-1.5 text-slate-700 transition-colors hover:text-slate-900"
                  >
                    Current salary
                    <SortIndicator active={sortBy === "salary"} order={sortOrder} />
                  </Link>
                </th>
                <th scope="col" className="px-3 py-3 text-left align-middle">
                  Currency
                </th>
                <th scope="col" className="px-3 py-3 text-left align-middle">
                  Pay frequency
                </th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => {
                const compensation = employee.currentCompensation;

                return (
                  <tr
                    key={employee.id}
                    onClick={() => router.push(`/employees/${employee.id}`)}
                    className="border-t border-slate-200 transition-colors hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="max-w-[220px] px-3 py-3 align-top">
                      <span
                        title={employee.name}
                        className="inline-block max-w-full truncate font-semibold text-slate-900 underline-offset-2 hover:underline"
                      >
                        {employee.name}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-top font-mono text-[11px] font-semibold tracking-[0.08em] text-slate-700">
                      {employee.employeeCode}
                    </td>
                    <td className="max-w-[160px] px-3 py-3 align-top text-slate-700">
                      <span className="block break-words">{employee.country}</span>
                    </td>
                    <td className="max-w-[180px] px-3 py-3 align-top text-slate-700">
                      <span className="block break-words">{employee.department}</span>
                    </td>
                    <td className="max-w-[220px] px-3 py-3 align-top text-slate-700">
                      <span className="block break-words">{employee.role}</span>
                    </td>
                    <td className="px-3 py-3 align-top font-semibold text-slate-900">
                      {compensation
                        ? formatMoney(compensation.amount, compensation.currency)
                        : "—"}
                    </td>
                    <td className="px-3 py-3 align-top text-slate-700">
                      {compensation?.currency ?? "—"}
                    </td>
                    <td className="px-3 py-3 align-top text-slate-700">
                      {compensation
                        ? formatPayFrequency(compensation.payFrequency)
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {employees.map((employee) => {
          const compensation = employee.currentCompensation;

          return (
            <Link
              key={employee.id}
              href={`/employees/${employee.id}`}
              className="group block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span
                    className="block truncate text-base font-semibold text-slate-900 underline-offset-2 group-hover:underline"
                    title={employee.name}
                  >
                    {employee.name}
                  </span>

                  <p className="mt-1 font-mono text-[10px] font-semibold tracking-[0.12em] text-slate-500">
                    {employee.employeeCode}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 px-2 py-1 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Salary
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {compensation
                      ? formatMoney(compensation.amount, compensation.currency)
                      : "—"}
                  </p>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-600">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-slate-500">Country</dt>
                  <dd className="max-w-[55%] text-right text-slate-700">{employee.country}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-slate-500">Department</dt>
                  <dd className="max-w-[55%] text-right text-slate-700">{employee.department}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-slate-500">Role</dt>
                  <dd className="max-w-[55%] text-right text-slate-700">{employee.role}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-slate-500">Currency</dt>
                  <dd className="text-slate-700">{compensation?.currency ?? "—"}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-slate-500">Pay frequency</dt>
                  <dd className="text-slate-700">
                    {compensation ? formatPayFrequency(compensation.payFrequency) : "—"}
                  </dd>
                </div>
              </dl>
            </Link>
          );
        })}
      </div>
    </>
  );
}

function ariaSort(
  sortBy: EmployeeSortField,
  sortOrder: SortOrder,
  field: EmployeeSortField,
): "ascending" | "descending" | "none" {
  if (sortBy !== field) return "none";
  return sortOrder === "desc" ? "descending" : "ascending";
}

function SortIndicator({
  active,
  order,
}: {
  active: boolean;
  order: SortOrder;
}) {
  if (!active) {
    return <span aria-hidden="true" className="text-slate-300">↕</span>;
  }

  return (
    <span aria-hidden="true">{order === "asc" ? "↑" : "↓"}</span>
  );
}
