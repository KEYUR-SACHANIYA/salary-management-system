import type { Request, Response } from "express";
import { ValidationError } from "../../shared/errors";
import { CompensationService } from "./compensation.service";
import type { CreateCompensationInput } from "./compensation.types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CREATE_FIELDS = ["amount", "currency", "payFrequency", "effectiveFrom", "changeReason"] as const;

export class CompensationController {
  constructor(private readonly compensationService: CompensationService) {}

  async getHistory(req: Request, res: Response): Promise<void> {
    const employeeId = parseEmployeeId(req.params.id);
    const history = await this.compensationService.getHistory(employeeId);
    res.status(200).json({ data: history });
  }

  async addCompensation(req: Request, res: Response): Promise<void> {
    const employeeId = parseEmployeeId(req.params.id);
    const input = parseCreateCompensationBody(req.body);
    const compensation = await this.compensationService.addCompensation(employeeId, input);
    res.status(201).json({ data: compensation });
  }
}

function parseEmployeeId(id: string | undefined): string {
  if (!id || !UUID_PATTERN.test(id)) {
    throw new ValidationError("Employee id must be a valid UUID.");
  }
  return id;
}

function parseCreateCompensationBody(body: unknown): CreateCompensationInput {
  if (body === null || body === undefined || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Request body must be an object.");
  }

  const record = body as Record<string, unknown>;
  const unexpected = Object.keys(record).filter(
    (field) => !(CREATE_FIELDS as readonly string[]).includes(field),
  );
  if (unexpected.length > 0) {
    throw new ValidationError(`${unexpected[0]} is not allowed.`);
  }

  for (const field of CREATE_FIELDS) {
    if (!(field in record)) {
      throw new ValidationError(`${field} is required.`);
    }
    if (typeof record[field] !== "string") {
      throw new ValidationError(`${field} must be a string.`);
    }
  }

  return {
    amount: record.amount as string,
    currency: record.currency as CreateCompensationInput["currency"],
    payFrequency: record.payFrequency as CreateCompensationInput["payFrequency"],
    effectiveFrom: record.effectiveFrom as string,
    changeReason: record.changeReason as CreateCompensationInput["changeReason"],
  };
}
