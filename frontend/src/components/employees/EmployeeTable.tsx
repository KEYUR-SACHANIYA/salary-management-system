import Link from "next/link";
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
  const sortBy = query.sortBy ?? "name";
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
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-[56rem] w-full border-collapse text-left text-sm">
        <caption className="sr-only">Employee directory</caption>
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <tr>
            {SORTABLE.map((column) => (
              <th key={column.field} scope="col" className="px-4 py-3" aria-sort={ariaSort(sortBy, sortOrder, column.field)}>
                <Link
                  href={sortHref(column.field)}
                  className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900"
                >
                  {column.label}
                  <SortIndicator active={sortBy === column.field} order={sortOrder} />
                </Link>
              </th>
            ))}
            <th scope="col" className="px-4 py-3">
              Country
            </th>
            <th scope="col" className="px-4 py-3">
              Department
            </th>
            <th scope="col" className="px-4 py-3">
              Role
            </th>
            <th
              scope="col"
              className="px-4 py-3"
              aria-sort={ariaSort(sortBy, sortOrder, "salary")}
            >
              <Link
                href={sortHref("salary")}
                className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900"
              >
                Current salary
                <SortIndicator active={sortBy === "salary"} order={sortOrder} />
              </Link>
            </th>
            <th scope="col" className="px-4 py-3">
              Currency
            </th>
            <th scope="col" className="px-4 py-3">
              Pay frequency
            </th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => {
            const compensation = employee.currentCompensation;

            return (
              <tr key={employee.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <Link
                    href={`/employees/${employee.id}`}
                    className="font-medium text-slate-900 underline-offset-2 hover:underline"
                  >
                    {employee.name}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-700">
                  {employee.employeeCode}
                </td>
                <td className="px-4 py-3 text-slate-700">{employee.country}</td>
                <td className="px-4 py-3 text-slate-700">{employee.department}</td>
                <td className="px-4 py-3 text-slate-700">{employee.role}</td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {compensation
                    ? formatMoney(compensation.amount, compensation.currency)
                    : "—"}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {compensation?.currency ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-700">
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
