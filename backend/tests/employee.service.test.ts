import { EmployeeNotFoundError } from "../src/shared/errors";
import type { EmployeeRepository } from "../src/modules/employees/employee.repository";
import { EmployeeService } from "../src/modules/employees/employee.service";
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

const query: EmployeeListQuery = {
  page: 1,
  pageSize: 20,
  sortBy: "name",
  sortOrder: "asc",
  reportingCurrency: "USD",
};

const listResult: EmployeeListResult = {
  data: [{ ...employee, currentCompensation: null }],
  total: 1,
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

  async list(requested: EmployeeListQuery): Promise<EmployeeListResult> {
    if (this.listError) throw this.listError;
    this.lastListQuery = requested;
    return this.listResult;
  }
}

describe("EmployeeService", () => {
  it("returns the employee when it exists", async () => {
    const repository = new FakeEmployeeRepository();
    const service = new EmployeeService(repository);

    await expect(service.getEmployeeById(employee.id)).resolves.toEqual(employee);
  });

  it("throws EMPLOYEE_NOT_FOUND when the repository returns null", async () => {
    const repository = new FakeEmployeeRepository();
    repository.findByIdResult = null;
    const service = new EmployeeService(repository);

    await expect(service.getEmployeeById(employee.id)).rejects.toMatchObject({
      name: "EmployeeNotFoundError",
      code: "EMPLOYEE_NOT_FOUND",
      message: "Employee not found",
    });
    await expect(service.getEmployeeById(employee.id)).rejects.toBeInstanceOf(EmployeeNotFoundError);
  });

  it("passes the list query to the repository and returns its result", async () => {
    const repository = new FakeEmployeeRepository();
    const service = new EmployeeService(repository);

    await expect(service.listEmployees(query)).resolves.toBe(listResult);
    expect(repository.lastListQuery).toBe(query);
  });

  it("does not swallow repository failures", async () => {
    const repository = new FakeEmployeeRepository();
    repository.findByIdError = new Error("connection lost");
    repository.listError = new Error("connection lost");
    const service = new EmployeeService(repository);

    await expect(service.getEmployeeById(employee.id)).rejects.toThrow("connection lost");
    await expect(service.listEmployees(query)).rejects.toThrow("connection lost");
  });
});
