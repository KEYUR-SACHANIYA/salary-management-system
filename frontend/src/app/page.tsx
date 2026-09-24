import { BreakdownTable } from "@/components/dashboard/BreakdownTable";
import { FxRates } from "@/components/dashboard/FxRates";
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
        title="Salary dashboard"
        description="Current compensation only. Totals, averages, and ranges are annualized in the selected reporting currency. Native-currency totals stay in the original currency."
        actions={<ViewEmployeesLink />}
      />

      <div className="mb-6 max-w-xs">
        <ReportingCurrencySelect value={reportingCurrency} />
      </div>

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
          <BreakdownTable
            title="By country"
            caption="Annualized compensation by country"
            labelHeader="Country"
            rows={analytics.byCountry.map((row) => ({
              label: row.country,
              employeeCount: row.employeeCount,
              totalAnnualCompensation: row.totalAnnualCompensation,
              averageAnnualCompensation: row.averageAnnualCompensation,
              currency: analytics.reportingCurrency,
            }))}
          />
          <BreakdownTable
            title="By department"
            caption="Annualized compensation by department"
            labelHeader="Department"
            rows={analytics.byDepartment.map((row) => ({
              label: row.department,
              employeeCount: row.employeeCount,
              totalAnnualCompensation: row.totalAnnualCompensation,
              averageAnnualCompensation: row.averageAnnualCompensation,
              currency: analytics.reportingCurrency,
            }))}
          />
          <BreakdownTable
            title="By native currency"
            caption="Annualized totals in each original currency"
            labelHeader="Currency"
            showAverage={false}
            rows={analytics.byNativeCurrency.map((row) => ({
              label: row.currency,
              employeeCount: row.employeeCount,
              totalAnnualCompensation: row.totalAnnualCompensation,
              currency: row.currency,
            }))}
          />
          <FxRates />
        </div>
      ) : null}
    </PageContainer>
  );
}
