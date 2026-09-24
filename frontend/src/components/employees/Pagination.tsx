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
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-slate-600">
        Showing {formatCount(from)}–{formatCount(to)} of {formatCount(total)} employees
      </p>
      <div className="flex items-center gap-2">
        {previousHref ? (
          <Link
            href={previousHref}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-400">
            Previous
          </span>
        )}
        <p className="min-w-24 text-center text-sm text-slate-600">
          Page {formatCount(currentPage)} of {formatCount(totalPages)}
        </p>
        {nextHref ? (
          <Link
            href={nextHref}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-400">
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
