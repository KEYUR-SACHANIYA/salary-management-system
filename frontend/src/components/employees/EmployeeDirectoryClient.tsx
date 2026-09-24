"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { EmployeeFilters } from "@/components/employees/EmployeeFilters";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { Pagination } from "@/components/employees/Pagination";
import { PageContainer } from "@/components/ui/PageHeader";
import { ApiError } from "@/lib/api-client";
import { getEmployees } from "@/lib/employees-api";
import { parseDirectorySearchParams } from "@/lib/employee-directory-query";
import { formatCount } from "@/lib/formatting";
import type { EmployeeListResponse } from "@/types/employees";

export function EmployeeDirectoryClient() {
  const searchParams = useSearchParams();
  const query = useMemo(
    () =>
      parseDirectorySearchParams(Object.fromEntries(searchParams.entries())),
    [searchParams],
  );

  const [result, setResult] = useState<EmployeeListResponse | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadEmployees = async () => {
      setIsLoading(true);
      setErrorMessage(undefined);

      try {
        const nextResult = await getEmployees(query);

        if (!active) {
          return;
        }

        setResult(nextResult);
      } catch (error) {
        if (!active) {
          return;
        }

        setResult(undefined);
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Unable to load employees. Please try again.",
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadEmployees();

    return () => {
      active = false;
    };
  }, [query]);

  const employeeCount = result?.pagination.total ?? 0;

  return (
    <PageContainer>
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.4)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              Workforce
            </p>
            <h1 className="text-2xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-[2rem]">
              Employee directory
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-[0.95rem]">
              Search, filter, and sort current compensation. Salary values are shown in each employee’s native currency.
            </p>
          </div>

          <div className="flex items-center self-start lg:self-auto">
            <div className="flex min-h-[92px] min-w-[172px] items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white px-4 py-3 text-center shadow-sm">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Total employees
                </p>
                {isLoading ? (
                  <div
                    className="flex min-h-[2.25rem] items-center justify-center"
                    aria-live="polite"
                    aria-busy="true"
                  >
                    <span
                      className="h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-r-slate-600"
                      aria-hidden="true"
                    />
                  </div>
                ) : (
                  <p className="text-[2rem] font-semibold leading-none tracking-[-0.05em] text-slate-900 sm:text-[2.25rem]">
                    {formatCount(employeeCount)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <EmployeeFilters searchParams={Object.fromEntries(searchParams.entries())} />
        <p className="px-1 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
          Salary sorting uses annualized amounts in USD.
        </p>

        {errorMessage ? (
          <Alert tone="error" title="Could not load employees">
            {errorMessage}
          </Alert>
        ) : null}

        {!isLoading && result && result.data.length === 0 ? (
          <Alert title="No employees match these filters">
            Try a different search term or clear one of the filters.
          </Alert>
        ) : null}

        {(result && result.data.length > 0) || isLoading ? (
          <>
            <EmployeeTable
              employees={result?.data ?? []}
              query={query}
              isLoading={isLoading}
            />
            {!isLoading && result ? (
              <Pagination
                query={query}
                page={result.pagination.page}
                pageSize={result.pagination.pageSize}
                total={result.pagination.total}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </PageContainer>
  );
}
