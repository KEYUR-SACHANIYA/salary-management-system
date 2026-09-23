export class EmployeeNotFoundError extends Error {
  readonly code = "EMPLOYEE_NOT_FOUND" as const;

  constructor() {
    super("Employee not found");
    this.name = "EmployeeNotFoundError";
  }
}
