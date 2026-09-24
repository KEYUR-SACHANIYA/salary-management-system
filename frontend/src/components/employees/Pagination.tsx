import Link from "next/link";
import { formatCount } from "@/lib/formatting";
import {
  applyDirectoryUpdates,
  directoryHref,
} from "@/lib/employee-directory-query";
import type { EmployeeListParams } from "@/types/employees";

export function Pagination({
  query,
  page,
  pageSize,
  total,
}: {
  query: EmployeeListParams;
  page: number;
  pageSize: number;
  total: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, total);

  const previousHref =
    currentPage > 1
      ? directoryHref(
          applyDirectoryUpdates(
            query,
            { page: currentPage - 1 },
            { resetPage: false },
          ),
        )
      : undefined;
  const nextHref =
    currentPage < totalPages
      ? directoryHref(
          applyDirectoryUpdates(
            query,
            { page: currentPage + 1 },
            { resetPage: false },
          ),
        )
      : undefined;

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-4"
    >
      <p className="text-sm text-slate-600">
        Showing {formatCount(from)}–{formatCount(to)} of {formatCount(total)} employees
      </p>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        {previousHref ? (
          <Link
            href={previousHref}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
          >
            Previous
          </Link>
        ) : (
          <span className="inline-flex cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-400">
            Previous
          </span>
        )}
        <p className="min-w-[7.5rem] rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-center text-sm font-semibold text-slate-700">
          Page {formatCount(currentPage)} of {formatCount(totalPages)}
        </p>
        {nextHref ? (
          <Link
            href={nextHref}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
          >
            Next
          </Link>
        ) : (
          <span className="inline-flex cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-400">
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
