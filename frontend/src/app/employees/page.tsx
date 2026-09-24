import { Alert } from "@/components/ui/Alert";
import { EmployeeFilters } from "@/components/employees/EmployeeFilters";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { Pagination } from "@/components/employees/Pagination";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { ApiError } from "@/lib/api-client";
import { getEmployees } from "@/lib/employees-api";
import { parseDirectorySearchParams } from "@/lib/employee-directory-query";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = parseDirectorySearchParams(resolvedSearchParams);

  let result: Awaited<ReturnType<typeof getEmployees>> | undefined;
  let errorMessage: string | undefined;

  try {
    result = await getEmployees(query);
  } catch (error) {
    errorMessage =
      error instanceof ApiError
        ? error.message
        : "Unable to load employees. Please try again.";
  }

  return (
    <PageContainer>
      <PageHeader
        title="Employee directory"
        description="Search, filter, and sort current compensation. Salary values are shown in each employee’s native currency."
      />

      <div className="space-y-4">
        <EmployeeFilters searchParams={resolvedSearchParams} />
        <p className="text-xs text-slate-500">
          Salary sorting uses annualized amounts in USD.
        </p>

        {errorMessage ? (
          <Alert tone="error" title="Could not load employees">
            {errorMessage}
          </Alert>
        ) : null}

        {result && result.data.length === 0 ? (
          <Alert title="No employees match these filters">
            Try a different search term or clear one of the filters.
          </Alert>
        ) : null}

        {result && result.data.length > 0 ? (
          <>
            <EmployeeTable employees={result.data} query={query} />
            <Pagination
              query={query}
              page={result.pagination.page}
              pageSize={result.pagination.pageSize}
              total={result.pagination.total}
            />
          </>
        ) : null}
      </div>
    </PageContainer>
  );
}
