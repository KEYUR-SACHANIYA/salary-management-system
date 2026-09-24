import { apiClient } from "./api-client";
import type { Currency } from "./constants";
import type { SalaryAnalyticsResponse } from "@/types/analytics";

export function getSalaryAnalytics(reportingCurrency: Currency) {
  const query = new URLSearchParams({ reportingCurrency });
  return apiClient<SalaryAnalyticsResponse>(
    `/api/v1/analytics/salary?${query.toString()}`,
  );
}
