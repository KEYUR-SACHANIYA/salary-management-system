import type { EmployeeListParams } from "@/types/employees";
import { formatIsoDate, formatMoney, formatPayFrequency } from "./formatting";
import {
  applyDirectoryUpdates,
  directoryHref,
  parseDirectorySearchParams,
} from "./employee-directory-query";

describe("formatMoney", () => {
  it("formats native compensation without using currency symbols", () => {
    expect(formatMoney("116173.00", "EUR")).toBe("EUR 116,173.00");
  });

  it("keeps two decimal places for whole amounts", () => {
    expect(formatMoney("120000", "USD")).toBe("USD 120,000.00");
  });
});

describe("formatPayFrequency", () => {
  it("returns a readable label", () => {
    expect(formatPayFrequency("ANNUALLY")).toBe("Annually");
  });
});

describe("formatIsoDate", () => {
  it("formats an ISO date", () => {
    expect(formatIsoDate("2026-03-28")).toBe("Mar 28, 2026");
  });
});

describe("employee directory query", () => {
  it("parses search, filters, sort, and pagination from URL params", () => {
    expect(
      parseDirectorySearchParams({
        page: "2",
        search: "aarav",
        country: "Germany",
        sortBy: "salary",
        sortOrder: "desc",
      }),
    ).toEqual({
      page: 2,
      pageSize: 20,
      search: "aarav",
      country: "Germany",
      department: undefined,
      currency: undefined,
      payFrequency: undefined,
      sortBy: "salary",
      sortOrder: "desc",
      reportingCurrency: "USD",
    });
  });

  it("resets page to 1 when a filter changes", () => {
    const next = applyDirectoryUpdates(
      {
        page: 4,
        pageSize: 20,
        country: "Germany",
        sortBy: "employeeCode",
        sortOrder: "asc",
      },
      { department: "Engineering" },
      { resetPage: true },
    );

    expect(next.page).toBe(1);
    expect(next.department).toBe("Engineering");
    expect(directoryHref(next)).toBe(
      "/employees?country=Germany&department=Engineering",
    );
  });

  it("resets page to 1 when sorting changes", () => {
    const next = applyDirectoryUpdates(
      { page: 3, sortBy: "employeeCode", sortOrder: "asc" },
      { sortBy: "name", sortOrder: "desc" },
      { resetPage: true },
    );

    expect(next.page).toBe(1);
    expect(directoryHref(next)).toBe(
      "/employees?sortBy=name&sortOrder=desc",
    );
  });

  it("keeps the page when only pagination changes", () => {
    const next = applyDirectoryUpdates(
      { page: 2, search: "maya" },
      { page: 3 },
      { resetPage: false },
    );

    expect(next.page).toBe(3);
    expect(directoryHref(next)).toBe("/employees?search=maya&page=3");
  });

  it("builds the default directory URL when no filters are active", () => {
    const defaults: EmployeeListParams = {
      page: 1,
      pageSize: 20,
      search: undefined,
      country: undefined,
      department: undefined,
      currency: undefined,
      payFrequency: undefined,
      sortBy: "employeeCode",
      sortOrder: "asc",
      reportingCurrency: "USD",
    };

    expect(directoryHref(defaults)).toBe("/employees");
    expect(defaults.sortBy).toBe("employeeCode");
    expect(defaults.sortOrder).toBe("asc");
  });

  it("ignores unknown country values instead of sending them to the API", () => {
    expect(parseDirectorySearchParams({ country: "Mars" }).country).toBeUndefined();
  });
});
