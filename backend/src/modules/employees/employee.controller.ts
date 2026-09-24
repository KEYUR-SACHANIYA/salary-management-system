import type { Request, Response } from "express";
import { CURRENCIES, PAY_FREQUENCIES } from "../../shared/pay-rules";
import { ValidationError } from "../../shared/errors";
import { EmployeeService } from "./employee.service";
import type { EmployeeListQuery } from "./employee.types";

const SORT_BY = ["name", "employeeCode", "salary"] as const;
const SORT_ORDER = ["asc", "desc"] as const;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  async list(req: Request, res: Response): Promise<void> {
    const query = parseEmployeeListQuery(req.query);
    const result = await this.employeeService.listEmployees(query);
    res.status(200).json({
      data: result.data,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
      },
    });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const id = parseEmployeeId(req.params.id);
    const employee = await this.employeeService.getEmployeeById(id);
    res.status(200).json(employee);
  }
}

export function parseEmployeeListQuery(query: Request["query"]): EmployeeListQuery {
  const parsed: EmployeeListQuery = {
    page: parsePositiveInteger(query.page, "page", 1),
    pageSize: parsePageSize(query.pageSize),
    sortBy: parseEnum(query.sortBy, "sortBy", SORT_BY, "name"),
    sortOrder: parseEnum(query.sortOrder, "sortOrder", SORT_ORDER, "asc"),
    reportingCurrency: parseEnum(query.reportingCurrency, "reportingCurrency", CURRENCIES, "USD"),
  };

  const search = optionalString(query.search, "search");
  if (search !== undefined) parsed.search = search;

  const country = optionalString(query.country, "country");
  if (country !== undefined) parsed.country = country;

  const department = optionalString(query.department, "department");
  if (department !== undefined) parsed.department = department;

  const currency = optionalEnum(query.currency, "currency", CURRENCIES);
  if (currency !== undefined) parsed.currency = currency;

  const payFrequency = optionalEnum(query.payFrequency, "payFrequency", PAY_FREQUENCIES);
  if (payFrequency !== undefined) parsed.payFrequency = payFrequency;

  return parsed;
}

function parseEmployeeId(id: string | undefined): string {
  if (!id || !UUID_PATTERN.test(id)) {
    throw new ValidationError("Employee id must be a valid UUID.");
  }
  return id;
}

function parsePositiveInteger(value: unknown, name: string, fallback: number): number {
  if (value === undefined) return fallback;
  const text = requireString(value, name);
  if (!/^[1-9]\d*$/.test(text)) {
    throw new ValidationError(`${name} must be a positive integer.`);
  }
  return Number(text);
}

function parsePageSize(value: unknown): number {
  const pageSize = parsePositiveInteger(value, "pageSize", 20);
  if (pageSize > 100) {
    throw new ValidationError("pageSize must not exceed 100.");
  }
  return pageSize;
}

function optionalString(value: unknown, name: string): string | undefined {
  if (value === undefined) return undefined;
  const text = requireString(value, name);
  if (text.length === 0) {
    throw new ValidationError(`${name} must not be empty.`);
  }
  return text;
}

function parseEnum<T extends string>(
  value: unknown,
  name: string,
  allowed: readonly T[],
  fallback: T,
): T {
  if (value === undefined) return fallback;
  return requireEnum(value, name, allowed);
}

function optionalEnum<T extends string>(value: unknown, name: string, allowed: readonly T[]): T | undefined {
  if (value === undefined) return undefined;
  return requireEnum(value, name, allowed);
}

function requireEnum<T extends string>(value: unknown, name: string, allowed: readonly T[]): T {
  const text = requireString(value, name);
  if (!(allowed as readonly string[]).includes(text)) {
    throw new ValidationError(`${name} is not supported.`);
  }
  return text as T;
}

function requireString(value: unknown, name: string): string {
  if (typeof value !== "string") {
    throw new ValidationError(`${name} must be a string.`);
  }
  return value;
}
