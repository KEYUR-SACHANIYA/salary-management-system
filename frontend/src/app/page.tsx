import { AverageMedianComparison } from "@/components/dashboard/AverageMedianComparison";
import { BreakdownTable } from "@/components/dashboard/BreakdownTable";
import { CompensationRange } from "@/components/dashboard/CompensationRange";
import { CountryCompensationChart } from "@/components/dashboard/CountryCompensationChart";
import { DepartmentCompensationChart } from "@/components/dashboard/DepartmentCompensationChart";
import { FxRates } from "@/components/dashboard/FxRates";
import { NativeCurrencyDistribution } from "@/components/dashboard/NativeCurrencyDistribution";
import { OverviewCards, ViewEmployeesLink } from "@/components/dashboard/OverviewCards";
import { ReportingCurrencySelect } from "@/components/dashboard/ReportingCurrencySelect";
import { Alert } from "@/components/ui/Alert";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { getSalaryAnalytics } from "@/lib/analytics-api";
import { ApiError } from "@/lib/api-client";
import { parseReportingCurrencyParam } from "@/lib/employee-directory-query";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const reportingCurrency = parseReportingCurrencyParam(
    resolved.reportingCurrency,
  );

  let analytics: Awaited<ReturnType<typeof getSalaryAnalytics>>["data"] | undefined;
  let errorMessage: string | undefined;

  try {
    const response = await getSalaryAnalytics(reportingCurrency);
    analytics = response.data;
  } catch (error) {
    errorMessage =
      error instanceof ApiError
        ? error.message
        : "Unable to load salary analytics.";
  }

  return (
    <PageContainer>
      <PageHeader
        title="Salary Overview"
        description="Current compensation only. Annualized values are shown in the selected reporting currency, while native-currency totals remain in each employee's original currency."
        actions={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-end">
            <div className="w-full min-w-[180px] sm:w-[220px]">
              <ReportingCurrencySelect value={reportingCurrency} />
            </div>
            <ViewEmployeesLink />
          </div>
        }
      />

      {errorMessage ? (
        <Alert tone="error" title="Could not load dashboard">
          {errorMessage}
        </Alert>
      ) : null}

      {analytics ? (
        <div className="space-y-6">
          <OverviewCards
            overview={analytics.overview}
            reportingCurrency={analytics.reportingCurrency}
          />

          <div className="grid gap-6 xl:grid-cols-[0.34fr_0.66fr]">
            <CompensationRange
              overview={analytics.overview}
              reportingCurrency={analytics.reportingCurrency}
            />
            <DepartmentCompensationChart
              rows={analytics.byDepartment}
              reportingCurrency={analytics.reportingCurrency}
            />
          </div>

          <div className="mt-6">
            <CountryCompensationChart
              rows={analytics.byCountry}
              reportingCurrency={analytics.reportingCurrency}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <AverageMedianComparison
              overview={analytics.overview}
              reportingCurrency={analytics.reportingCurrency}
            />
            <NativeCurrencyDistribution rows={analytics.byNativeCurrency} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <BreakdownTable
              title="Native Currency Breakdown"
              caption="Annualized totals in each original currency"
              labelHeader="Currency"
              showAverage={false}
              description="Annualized compensation shown in each employee's original currency. Values are not converted."
              rows={analytics.byNativeCurrency.map((row) => ({
                label: row.currency,
                employeeCount: row.employeeCount,
                totalAnnualCompensation: row.totalAnnualCompensation,
                currency: row.currency,
              }))}
            />
            <FxRates />
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
}
