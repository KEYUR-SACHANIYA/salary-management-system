import type { Currency, PayFrequency } from "../../shared/pay-rules";

export type Employee = {
  id: string;
  employeeCode: string;
  name: string;
  country: string;
  department: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeCurrentCompensation = {
  amount: string;
  currency: Currency;
  payFrequency: PayFrequency;
  effectiveFrom: string;
  reportingSalary: string;
};

export type EmployeeListItem = Employee & {
  currentCompensation: EmployeeCurrentCompensation | null;
};

export type EmployeeListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  country?: string;
  department?: string;
  currency?: Currency;
  payFrequency?: PayFrequency;
  sortBy: "name" | "employeeCode" | "salary";
  sortOrder: "asc" | "desc";
  reportingCurrency: Currency;
};

export type EmployeeListResult = {
  data: EmployeeListItem[];
  total: number;
};
