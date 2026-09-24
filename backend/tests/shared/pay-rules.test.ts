import {
  annualize,
  calculateReportingSalary,
  convertCurrency,
  getCompensationStatus,
  validateCompensation,
} from "../../src/shared/pay-rules";

const TODAY = "2026-09-24";

describe("annualize", () => {
  it("returns an annual salary unchanged", () => {
    expect(annualize("100000.00", "ANNUALLY")).toBe("100000.00");
  });

  it("multiplies a monthly salary by 12", () => {
    expect(annualize("10000.00", "MONTHLY")).toBe("120000.00");
  });

  it("multiplies a weekly salary by 52", () => {
    expect(annualize("1000.00", "WEEKLY")).toBe("52000.00");
  });

  it("multiplies an hourly salary by 40 hours and 52 weeks", () => {
    expect(annualize("25.00", "HOURLY")).toBe("52000.00");
  });

  it("keeps two decimal places when annualizing a fractional monthly salary", () => {
    expect(annualize("12345.67", "MONTHLY")).toBe("148148.04");
  });
});

describe("convertCurrency", () => {
  it("leaves a USD amount unchanged when converting to USD", () => {
    expect(convertCurrency("100000.00", "USD", "USD")).toBe("100000.00");
  });

  it("converts INR to USD using the fixed 2026-09-23 rates", () => {
    expect(convertCurrency("100000.00", "INR", "USD")).toBe("1044.71");
  });

  it("converts USD to INR using the fixed 2026-09-23 rates", () => {
    expect(convertCurrency("1000.00", "USD", "INR")).toBe("95720.00");
  });

  it("converts INR to GBP without going through a stored USD amount", () => {
    expect(convertCurrency("100000.00", "INR", "GBP")).toBe("783.54");
  });

  it("rounds a converted amount to two decimals using half-up", () => {
    expect(convertCurrency("1.00", "EUR", "USD")).toBe("1.14");
  });
});

describe("calculateReportingSalary", () => {
  it("annualizes a monthly INR salary before converting to USD", () => {
    expect(
      calculateReportingSalary(
        { amount: "10000.00", currency: "INR", payFrequency: "MONTHLY" },
        "USD",
      ),
    ).toBe("1253.66");
  });

  it("annualizes an hourly USD salary before converting to SGD", () => {
    expect(
      calculateReportingSalary(
        { amount: "25.00", currency: "USD", payFrequency: "HOURLY" },
        "SGD",
      ),
    ).toBe("66560.00");
  });
});

describe("getCompensationStatus", () => {
  it("treats an open row that has already started as current", () => {
    expect(
      getCompensationStatus({ effectiveFrom: "2026-01-01", effectiveTo: null }, TODAY),
    ).toBe("CURRENT");
  });

  it("treats a row whose dates cover today as current", () => {
    expect(
      getCompensationStatus(
        { effectiveFrom: "2026-01-01", effectiveTo: "2026-12-31" },
        TODAY,
      ),
    ).toBe("CURRENT");
  });

  it("treats a row that starts after today as future", () => {
    expect(
      getCompensationStatus({ effectiveFrom: "2026-10-01", effectiveTo: null }, TODAY),
    ).toBe("FUTURE");
  });

  it("treats a row that ended before today as historical", () => {
    expect(
      getCompensationStatus(
        { effectiveFrom: "2025-01-01", effectiveTo: "2026-09-23" },
        TODAY,
      ),
    ).toBe("HISTORICAL");
  });

  it("treats a row that starts today as current", () => {
    expect(
      getCompensationStatus({ effectiveFrom: TODAY, effectiveTo: null }, TODAY),
    ).toBe("CURRENT");
  });

  it("treats a row that ends today as current", () => {
    expect(
      getCompensationStatus(
        { effectiveFrom: "2026-01-01", effectiveTo: TODAY },
        TODAY,
      ),
    ).toBe("CURRENT");
  });
});

describe("validateCompensation", () => {
  const valid = {
    amount: "120000.00",
    currency: "USD",
    payFrequency: "ANNUALLY",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    changeReason: "HIRE",
  };

  it("accepts a complete valid compensation", () => {
    expect(validateCompensation(valid)).toEqual({ valid: true });
  });

  it("accepts a null end date and a null change reason", () => {
    expect(
      validateCompensation({
        ...valid,
        effectiveTo: null,
        changeReason: null,
      }),
    ).toEqual({ valid: true });
  });

  it("accepts empty optional end date and change reason", () => {
    expect(
      validateCompensation({
        ...valid,
        effectiveTo: "",
        changeReason: "",
      }),
    ).toEqual({ valid: true });
  });

  it("rejects a zero amount", () => {
    expect(validateCompensation({ ...valid, amount: "0" }).valid).toBe(false);
  });

  it("rejects a negative amount", () => {
    expect(validateCompensation({ ...valid, amount: "-10.00" }).valid).toBe(false);
  });

  it("rejects a malformed amount", () => {
    expect(validateCompensation({ ...valid, amount: "10.999" }).valid).toBe(false);
  });

  it("rejects an unsupported currency", () => {
    expect(validateCompensation({ ...valid, currency: "JPY" }).valid).toBe(false);
  });

  it("rejects an unsupported pay frequency", () => {
    expect(validateCompensation({ ...valid, payFrequency: "DAILY" }).valid).toBe(false);
  });

  it("rejects an invalid start date", () => {
    expect(validateCompensation({ ...valid, effectiveFrom: "2026-13-01" }).valid).toBe(false);
  });

  it("rejects an invalid end date", () => {
    expect(validateCompensation({ ...valid, effectiveTo: "not-a-date" }).valid).toBe(false);
  });

  it("rejects an end date before the start date", () => {
    expect(
      validateCompensation({
        ...valid,
        effectiveFrom: "2026-02-01",
        effectiveTo: "2026-01-01",
      }).valid,
    ).toBe(false);
  });

  it("rejects an unsupported change reason", () => {
    expect(validateCompensation({ ...valid, changeReason: "BONUS" }).valid).toBe(false);
  });

  it("returns every validation error together", () => {
    const result = validateCompensation({
      amount: "0",
      currency: "JPY",
      payFrequency: "DAILY",
      effectiveFrom: "2026-02-01",
      effectiveTo: "2026-01-01",
      changeReason: "BONUS",
    });

    expect(result.valid).toBe(false);
    if (result.valid) return;
    expect(result.errors).toEqual([
      "Amount must be greater than zero.",
      "Currency is not supported.",
      "Pay frequency is not supported.",
      "Effective to cannot be before effective from.",
      "Change reason is not supported.",
    ]);
  });
});
