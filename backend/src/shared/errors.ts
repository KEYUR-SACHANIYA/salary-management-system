export class EmployeeNotFoundError extends Error {
  readonly code = "EMPLOYEE_NOT_FOUND" as const;

  constructor() {
    super("Employee not found");
    this.name = "EmployeeNotFoundError";
  }
}

export class ValidationError extends Error {
  readonly code = "VALIDATION_ERROR" as const;

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

