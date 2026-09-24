import { AnalyticsService } from "../../src/modules/analytics/analytics.service";
import type { AnalyticsRepository } from "../../src/modules/analytics/analytics.repository";
import type { SalaryAnalytics } from "../../src/modules/analytics/analytics.types";
import { CURRENCIES, type Currency } from "../../src/shared/pay-rules";
import { ValidationError } from "../../src/shared/errors";

const fixture: SalaryAnalytics = {
  reportingCurrency: "USD",
  overview: {
    employeeCount: 3,
    totalAnnualCompensation: "175000.00",
    averageAnnualCompensation: "58333.33",
    medianAnnualCompensation: "50000.00",
    lowestAnnualCompensation: "25000.00",
    highestAnnualCompensation: "100000.00",
  },
  byCountry: [
    {
      country: "United States",
      employeeCount: 3,
      totalAnnualCompensation: "175000.00",
      averageAnnualCompensation: "58333.33",
    },
  ],
  byDepartment: [
    {
      department: "Engineering",
      employeeCount: 3,
      totalAnnualCompensation: "175000.00",
      averageAnnualCompensation: "58333.33",
    },
  ],
  byNativeCurrency: [
    {
      currency: "USD",
      employeeCount: 3,
      totalAnnualCompensation: "175000.00",
    },
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

describe("AnalyticsService", () => {
  it.each([...CURRENCIES])("accepts reporting currency %s and returns the repository result", async (currency) => {
    const repository = new FakeAnalyticsRepository();
    const service = new AnalyticsService(repository);

    await expect(service.getSalaryAnalytics(currency)).resolves.toBe(repository.result);
    expect(repository.calls).toEqual([currency]);
  });

  it("throws ValidationError for an invalid reporting currency", async () => {
    const repository = new FakeAnalyticsRepository();
    const service = new AnalyticsService(repository);

    await expect(service.getSalaryAnalytics("JPY" as Currency)).rejects.toMatchObject({
      name: "ValidationError",
      message: "Currency is not supported.",
    });
    await expect(service.getSalaryAnalytics("JPY" as Currency)).rejects.toBeInstanceOf(ValidationError);
  });

  it("does not call the repository when the reporting currency is invalid", async () => {
    const repository = new FakeAnalyticsRepository();
    const service = new AnalyticsService(repository);

    await expect(service.getSalaryAnalytics("JPY" as Currency)).rejects.toBeInstanceOf(ValidationError);
    expect(repository.calls).toEqual([]);
  });

  it("returns the repository result unchanged", async () => {
    const repository = new FakeAnalyticsRepository();
    repository.result = { ...fixture, reportingCurrency: "INR" };
    const service = new AnalyticsService(repository);

    const result = await service.getSalaryAnalytics("INR");
    expect(result).toBe(repository.result);
    expect(result.byCountry).toBe(repository.result.byCountry);
    expect(result.byDepartment).toBe(repository.result.byDepartment);
    expect(result.byNativeCurrency).toBe(repository.result.byNativeCurrency);
  });

  it("propagates repository errors", async () => {
    const repository = new FakeAnalyticsRepository();
    repository.error = new Error("connection lost");
    const service = new AnalyticsService(repository);

    await expect(service.getSalaryAnalytics("USD")).rejects.toThrow("connection lost");
  });
});
