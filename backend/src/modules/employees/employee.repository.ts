import type { Employee, EmployeeListQuery, EmployeeListResult } from "./employee.types";

export interface EmployeeRepository {
  findById(id: string): Promise<Employee | null>;
  list(query: EmployeeListQuery): Promise<EmployeeListResult>;
}
