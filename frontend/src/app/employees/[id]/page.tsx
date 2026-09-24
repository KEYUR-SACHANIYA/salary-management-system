import Link from "next/link";
import { notFound } from "next/navigation";
import { CompensationForm } from "@/components/employees/CompensationForm";
import { CompensationHistory } from "@/components/employees/CompensationHistory";
import { Alert } from "@/components/ui/Alert";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { ApiError } from "@/lib/api-client";
import { getEmployee, getEmployeeCompensations } from "@/lib/employees-api";
import {
  formatAnnualizedCompensation,
  formatChangeReason,
  formatCurrencyAmount,
  formatIsoDate,
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
  const currentCompensation = current[0];
  const scheduledCompensation = future[0];

  return (
    <PageContainer>
      <PageHeader
        title={employee.name}
        description={`${employee.employeeCode} • ${employee.role}`}
        actions={
          <Link
            href="/employees"
            className="text-sm font-medium text-slate-700 underline-offset-2 hover:underline"
          >
            Back to employees
          </Link>
        }
      />

      <dl className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <Definition term="Employee code" value={employee.employeeCode} />
        <Definition term="Country" value={employee.country} />
        <Definition term="Department" value={employee.department} />
        <Definition term="Role" value={employee.role} />
      </dl>

      <section className="mb-6 space-y-3">
        <h2 className="text-base font-semibold text-slate-900">
          Current compensation
        </h2>

        {currentCompensation ? (
          <article className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-300">
                  Current salary
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight">
                  {formatCurrencyAmount(currentCompensation.amount, currentCompensation.currency)}
                </p>
              </div>
              <span className="inline-flex self-start rounded-full border border-emerald-400/60 bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-200">
                Current
              </span>
            </div>

            <dl className="mt-5 grid gap-3 text-sm text-slate-200 sm:grid-cols-2 xl:grid-cols-4">
              <Stat label="Currency" value={currentCompensation.currency} />
              <Stat
                label="Pay frequency"
                value={formatPayFrequency(currentCompensation.payFrequency)}
              />
              <Stat
                label="Annualized"
                value={formatAnnualizedCompensation(
                  currentCompensation.amount,
                  currentCompensation.currency,
                  currentCompensation.payFrequency,
                )}
              />
              <Stat
                label="Effective from"
                value={formatIsoDate(currentCompensation.effectiveFrom)}
              />
            </dl>
          </article>
        ) : (
          <Alert tone="info" title="No current compensation is on file">
            There is no active salary record for this employee yet.
          </Alert>
        )}
      </section>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            Scheduled compensation
          </h2>
          {!scheduledCompensation ? (
            <Link
              href="#add-salary-change"
              className="text-sm font-medium text-slate-700 underline-offset-2 hover:underline"
            >
              Add salary change
            </Link>
          ) : null}
        </div>

        {scheduledCompensation ? (
          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-amber-700">
                  Scheduled
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {formatCurrencyAmount(
                    scheduledCompensation.amount,
                    scheduledCompensation.currency,
                  )}
                </p>
              </div>
              <span className="inline-flex self-start rounded-full bg-white px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                Scheduled
              </span>
            </div>

            <dl className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2 xl:grid-cols-4">
              <Stat label="Effective date" value={formatIsoDate(scheduledCompensation.effectiveFrom)} />
              <Stat label="Currency" value={scheduledCompensation.currency} />
              <Stat
                label="Frequency"
                value={formatPayFrequency(scheduledCompensation.payFrequency)}
              />
              <Stat
                label="Reason"
                value={
                  scheduledCompensation.changeReason
                    ? formatChangeReason(scheduledCompensation.changeReason)
                    : "—"
                }
              />
            </dl>
          </article>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
            <p className="font-medium text-slate-800">No future compensation change is scheduled.</p>
            <p className="mt-1">A new salary update will appear here once it is scheduled.</p>
            <Link
              href="#add-salary-change"
              className="mt-4 inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Add salary change
            </Link>
          </div>
        )}
      </section>

      <section id="add-salary-change" className="mb-8">
        <CompensationForm employeeId={employee.id} />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Salary history</h2>
        <p className="text-sm text-slate-600">
          Historical records are read-only. Corrections are added as new salary rows.
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-current">{value}</dd>
    </div>
  );
}
