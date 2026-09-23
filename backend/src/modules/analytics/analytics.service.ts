import { CURRENCIES, type Currency } from "../../shared/pay-rules";
import { ValidationError } from "../../shared/errors";
import type { AnalyticsRepository } from "./analytics.repository";
import type { SalaryAnalytics } from "./analytics.types";

export class AnalyticsService {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async getSalaryAnalytics(reportingCurrency: Currency): Promise<SalaryAnalytics> {
    if (!(CURRENCIES as readonly string[]).includes(reportingCurrency)) {
      throw new ValidationError("Currency is not supported.");
    }

    return this.analyticsRepository.getSalaryAnalytics(reportingCurrency);
  }
}
