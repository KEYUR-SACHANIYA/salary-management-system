import Link from "next/link";
import { notFound } from "next/navigation";
import { CompensationForm } from "@/components/employees/CompensationForm";
import { CompensationHistory } from "@/components/employees/CompensationHistory";
import { Alert } from "@/components/ui/Alert";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { ApiError } from "@/lib/api-client";
import { getEmployee, getEmployeeCompensations } from "@/lib/employees-api";
import {
  formatIsoDate,
  formatMoney,
  formatPayFrequency,
} from "@/lib/formatting";
import type { CompensationHistoryItem } from "@/types/compensations";

export default async function EmployeeDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let employee: Awaited<ReturnType<typeof getEmployee>> | undefined;
  let history: CompensationHistoryItem[] = [];
  let errorMessage: string | undefined;

  try {
    const [employeeResult, historyResult] = await Promise.all([
      getEmployee(id),
      getEmployeeCompensations(id),
    ]);
    employee = employeeResult;
    history = historyResult.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    errorMessage =
      error instanceof ApiError
        ? error.message
        : "Unable to load this employee.";
  }

  if (errorMessage || !employee) {
    return (
      <PageContainer>
        <PageHeader title="Employee" />
        <Alert tone="error" title="Could not load employee">
          {errorMessage ?? "Unable to load this employee."}
        </Alert>
        <p className="mt-4">
          <Link href="/employees" className="text-sm font-medium text-slate-900 underline">
            Back to employees
          </Link>
        </p>
      </PageContainer>
    );
  }

  const current = history.filter((item) => item.status === "CURRENT");
  const future = history.filter((item) => item.status === "FUTURE");

  return (
    <PageContainer>
      <PageHeader
        title={employee.name}
        description={`${employee.employeeCode} · ${employee.role}`}
        actions={
          <Link
            href="/employees"
            className="text-sm font-medium text-slate-700 underline-offset-2 hover:underline"
          >
            Back to employees
          </Link>
        }
      />

      <dl className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Definition term="Employee code" value={employee.employeeCode} />
        <Definition term="Country" value={employee.country} />
        <Definition term="Department" value={employee.department} />
        <Definition term="Role" value={employee.role} />
      </dl>

      <section className="mb-6 space-y-3">
        <h2 className="text-base font-semibold text-slate-900">
          Current compensation
        </h2>
        {current.length === 0 ? (
          <Alert>No current compensation is on file.</Alert>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {current.map((item) => (
              <CompensationCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {future.length > 0 ? (
        <section className="mb-6 space-y-3">
          <h2 className="text-base font-semibold text-slate-900">
            Scheduled compensation
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {future.map((item) => (
              <CompensationCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mb-8">
        <CompensationForm employeeId={employee.id} />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">
          Compensation history
        </h2>
        <p className="text-sm text-slate-600">
          Historical records are read-only. Corrections are added as new rows.
        </p>
        <CompensationHistory items={history} />
      </section>
    </PageContainer>
  );
}

function Definition({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {term}
      </dt>
      <dd className="mt-1 text-sm text-slate-900">{value}</dd>
    </div>
  );
}

function CompensationCard({ item }: { item: CompensationHistoryItem }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-lg font-semibold text-slate-900">
        {formatMoney(item.amount, item.currency)}
      </p>
      <p className="mt-1 text-sm text-slate-600">
        {formatPayFrequency(item.payFrequency)} · from{" "}
        {formatIsoDate(item.effectiveFrom)}
        {item.effectiveTo ? ` to ${formatIsoDate(item.effectiveTo)}` : ""}
      </p>
    </article>
  );
}
