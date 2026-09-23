import type { Compensation, CreateCompensationInput } from "./compensation.types";

export interface CompensationRepository {
  getHistory(employeeId: string): Promise<Compensation[]>;

  // Persists the salary change in one transaction: close the previous period if needed, then insert the new open row.
  addCompensation(employeeId: string, input: CreateCompensationInput): Promise<Compensation>;
}
