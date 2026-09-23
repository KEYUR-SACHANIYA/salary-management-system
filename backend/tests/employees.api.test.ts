import request from "supertest";
import { createApp } from "../src/app";
import { EmployeeController } from "../src/modules/employees/employee.controller";
import { createEmployeeRouter } from "../src/modules/employees/employee.routes";
import { EmployeeService } from "../src/modules/employees/employee.service";
import type { EmployeeRepository } from "../src/modules/employees/employee.repository";
import type { Employee, EmployeeListQuery, EmployeeListResult } from "../src/modules/employees/employee.types";

const employee: Employee = {
  id: "11111111-1111-4111-8111-111111111111",
  employeeCode: "EMP000001",
  name: "Maya Patel",
  country: "India",
  department: "Engineering",
  role: "Software Engineer",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const listResult: EmployeeListResult = {
  data: [
    {
      ...employee,
      currentCompensation: {
        amount: "120000.00",
        currency: "USD",
        payFrequency: "ANNUALLY",
        effectiveFrom: "2026-01-01",
        reportingSalary: "120000.00",
      },
    },
  ],
  total: 10000,
};

class FakeEmployeeRepository implements EmployeeRepository {
  findByIdResult: Employee | null = employee;
  listResult: EmployeeListResult = listResult;
  lastListQuery: EmployeeListQuery | undefined;
  findByIdError: Error | undefined;
  listError: Error | undefined;

  async findById(id: string): Promise<Employee | null> {
    if (this.findByIdError) throw this.findByIdError;
    if (id !== employee.id) return null;
    return this.findByIdResult;
  }

  async list(query: EmployeeListQuery): Promise<EmployeeListResult> {
    if (this.listError) throw this.listError;
    this.lastListQuery = query;
    return this.listResult;
  }
}

function appWith(repository: FakeEmployeeRepository) {
  const controller = new EmployeeController(new EmployeeService(repository));
  return createApp({ employeeRouter: createEmployeeRouter(controller) });
}

describe("Employee HTTP API", () => {
  it("returns 200 and default pagination for GET /api/v1/employees", async () => {
    const repository = new FakeEmployeeRepository();
    const response = await request(appWith(repository)).get("/api/v1/employees");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: listResult.data,
      pagination: { page: 1, pageSize: 20, total: 10000 },
    });
    expect(repository.lastListQuery).toEqual({
      page: 1,
      pageSize: 20,
      sortBy: "name",
      sortOrder: "asc",
      reportingCurrency: "USD",
    });
  });

  it("parses page and pageSize as numbers", async () => {
    const repository = new FakeEmployeeRepository();
    await request(appWith(repository)).get("/api/v1/employees?page=2&pageSize=50");

    expect(repository.lastListQuery?.page).toBe(2);
    expect(repository.lastListQuery?.pageSize).toBe(50);
  });

  it("accepts search, country, department, currency, payFrequency, sort, and reportingCurrency", async () => {
    const repository = new FakeEmployeeRepository();
    await request(appWith(repository)).get(
      "/api/v1/employees?search=Maya&country=India&department=Engineering&currency=INR&payFrequency=MONTHLY&sortBy=salary&sortOrder=desc&reportingCurrency=GBP",
    );

    expect(repository.lastListQuery).toEqual({
      page: 1,
      pageSize: 20,
      search: "Maya",
      country: "India",
      department: "Engineering",
      currency: "INR",
      payFrequency: "MONTHLY",
      sortBy: "salary",
      sortOrder: "desc",
      reportingCurrency: "GBP",
    });
  });

  it.each([
    ["page=0", "page"],
    ["page=-1", "page"],
    ["page=1.5", "page"],
    ["page=abc", "page"],
    ["pageSize=0", "pageSize"],
    ["pageSize=101", "pageSize"],
    ["sortBy=email", "sortBy"],
    ["sortOrder=up", "sortOrder"],
    ["currency=JPY", "currency"],
    ["payFrequency=DAILY", "payFrequency"],
    ["reportingCurrency=JPY", "reportingCurrency"],
  ])("rejects %s with 400 VALIDATION_ERROR", async (query) => {
    const response = await request(appWith(new FakeEmployeeRepository())).get(`/api/v1/employees?${query}`);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.message).toEqual(expect.any(String));
  });

  it("returns 200 for an existing employee", async () => {
    const response = await request(appWith(new FakeEmployeeRepository())).get(
      `/api/v1/employees/${employee.id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual(employee);
  });

  it("returns 404 EMPLOYEE_NOT_FOUND for a missing employee", async () => {
    const response = await request(appWith(new FakeEmployeeRepository())).get(
      "/api/v1/employees/00000000-0000-4000-8000-000000000000",
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: "EMPLOYEE_NOT_FOUND", message: "Employee not found" },
    });
  });

  it("maps unexpected errors to INTERNAL_SERVER_ERROR without internal details", async () => {
    const repository = new FakeEmployeeRepository();
    repository.listError = new Error("password=super-secret connection lost");
    const response = await request(appWith(repository)).get("/api/v1/employees");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" },
    });
    expect(JSON.stringify(response.body)).not.toContain("super-secret");
  });
});
