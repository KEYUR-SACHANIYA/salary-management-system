import type { Currency } from "../../shared/pay-rules";
import type { SalaryAnalytics } from "./analytics.types";

export interface AnalyticsRepository {
  // Current compensation only: overview, country, department, and native-currency totals.
  getSalaryAnalytics(reportingCurrency: Currency): Promise<SalaryAnalytics>;
}
