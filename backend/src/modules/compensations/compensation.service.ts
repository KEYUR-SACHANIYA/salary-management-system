import { ValidationError } from "../../shared/errors";
import { getCompensationStatus, validateCompensation } from "../../shared/pay-rules";
import type { CompensationRepository } from "./compensation.repository";
import type { Compensation, CompensationHistoryItem, CreateCompensationInput } from "./compensation.types";

export class CompensationService {
  constructor(private readonly compensationRepository: CompensationRepository) {}

  async getHistory(employeeId: string): Promise<CompensationHistoryItem[]> {
    const history = await this.compensationRepository.getHistory(employeeId);
    const today = todayUtcDate();

    return history.map((compensation) => ({
      ...compensation,
      status: getCompensationStatus(compensation, today),
    }));
  }

  async addCompensation(employeeId: string, input: CreateCompensationInput): Promise<Compensation> {
    const validation = validateCompensation(input);
    if (!validation.valid) {
      throw new ValidationError(validation.errors.join(" "));
    }

    const today = todayUtcDate();
    if (input.effectiveFrom < today) {
      throw new ValidationError("Compensation effective date cannot be in the past");
    }

    return this.compensationRepository.addCompensation(employeeId, input);
  }
}

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}
