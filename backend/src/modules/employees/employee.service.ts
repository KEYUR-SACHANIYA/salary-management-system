import { EmployeeNotFoundError } from "../../shared/errors";
import type { EmployeeRepository } from "./employee.repository";
import type { Employee, EmployeeListQuery, EmployeeListResult } from "./employee.types";

export class EmployeeService {
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async getEmployeeById(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new EmployeeNotFoundError();
    }
    return employee;
  }

  async listEmployees(query: EmployeeListQuery): Promise<EmployeeListResult> {
    return this.employeeRepository.list(query);
  }
}
