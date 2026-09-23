import request from "supertest";
import { createApp } from "../src/app";
import { AnalyticsController } from "../src/modules/analytics/analytics.controller";
import { createAnalyticsRouter } from "../src/modules/analytics/analytics.routes";
import { AnalyticsService } from "../src/modules/analytics/analytics.service";
import type { AnalyticsRepository } from "../src/modules/analytics/analytics.repository";
import type { SalaryAnalytics } from "../src/modules/analytics/analytics.types";
import { CURRENCIES, type Currency } from "../src/shared/pay-rules";

const fixture: SalaryAnalytics = {
  reportingCurrency: "USD",
  overview: {
    employeeCount: 10000,
    totalAnnualCompensation: "1127698534.40",
    averageAnnualCompensation: "112769.85",
    medianAnnualCompensation: "104934.88",
    lowestAnnualCompensation: "6429.31",
    highestAnnualCompensation: "312414.96",
  },
  byCountry: [
    {
      country: "India",
      employeeCount: 1667,
      totalAnnualCompensation: "500000.00",
      averageAnnualCompensation: "300.00",
    },
  ],
  byDepartment: [
    {
      department: "Engineering",
      employeeCount: 2000,
      totalAnnualCompensation: "400000.00",
      averageAnnualCompensation: "200.00",
    },
  ],
  byNativeCurrency: [
    { currency: "INR", employeeCount: 1667, totalAnnualCompensation: "5293755156.55" },
  ],
};

class FakeAnalyticsRepository implements AnalyticsRepository {
  result: SalaryAnalytics = fixture;
  error: Error | undefined;
  calls: Currency[] = [];

  async getSalaryAnalytics(reportingCurrency: Currency): Promise<SalaryAnalytics> {
    if (this.error) throw this.error;
    this.calls.push(reportingCurrency);
    return this.result;
  }
}

function appWith(repository: FakeAnalyticsRepository) {
  const controller = new AnalyticsController(new AnalyticsService(repository));
  return createApp({ analyticsRouter: createAnalyticsRouter(controller) });
}

describe("Analytics HTTP API", () => {
  it("defaults reportingCurrency to USD when the query is omitted", async () => {
    const repository = new FakeAnalyticsRepository();
    const response = await request(appWith(repository)).get("/api/v1/analytics/salary");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: fixture });
    expect(repository.calls).toEqual(["USD"]);
  });

  it.each([...CURRENCIES])("returns 200 for reportingCurrency=%s", async (currency) => {
    const repository = new FakeAnalyticsRepository();
    repository.result = { ...fixture, reportingCurrency: currency };
    const response = await request(appWith(repository)).get(
      `/api/v1/analytics/salary?reportingCurrency=${currency}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: repository.result });
    expect(repository.calls).toEqual([currency]);
  });

  it.each(["JPY", "ABC", ""])("returns 400 VALIDATION_ERROR for reportingCurrency=%s", async (currency) => {
    const repository = new FakeAnalyticsRepository();
    const response = await request(appWith(repository)).get(
      `/api/v1/analytics/salary?reportingCurrency=${currency}`,
    );

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: { code: "VALIDATION_ERROR", message: "Currency is not supported." },
    });
    expect(repository.calls).toEqual([]);
  });

  it("maps unexpected errors to INTERNAL_SERVER_ERROR without internal details", async () => {
    const repository = new FakeAnalyticsRepository();
    repository.error = new Error("password=super-secret connection lost");
    const response = await request(appWith(repository)).get("/api/v1/analytics/salary");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" },
    });
    expect(JSON.stringify(response.body)).not.toContain("super-secret");
  });

  it("returns the service result in a data envelope without mutation", async () => {
    const repository = new FakeAnalyticsRepository();
    const response = await request(appWith(repository)).get("/api/v1/analytics/salary?reportingCurrency=INR");

    expect(Object.keys(response.body)).toEqual(["data"]);
    expect(response.body.data).toEqual(fixture);
    expect(repository.calls).toEqual(["INR"]);
  });
});
