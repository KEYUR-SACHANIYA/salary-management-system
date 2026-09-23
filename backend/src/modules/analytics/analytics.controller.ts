import type { Request, Response } from "express";
import { CURRENCIES, type Currency } from "../../shared/pay-rules";
import { ValidationError } from "../../shared/errors";
import { AnalyticsService } from "./analytics.service";

export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  async getSalaryAnalytics(req: Request, res: Response): Promise<void> {
    const reportingCurrency = parseReportingCurrency(req.query.reportingCurrency);
    const analytics = await this.analyticsService.getSalaryAnalytics(reportingCurrency);
    res.status(200).json({ data: analytics });
  }
}

function parseReportingCurrency(value: unknown): Currency {
  if (value === undefined) return "USD";
  if (typeof value !== "string" || !(CURRENCIES as readonly string[]).includes(value)) {
    throw new ValidationError("Currency is not supported.");
  }
  return value as Currency;
}
