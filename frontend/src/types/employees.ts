import type {
  Currency,
  EmployeeSortField,
  PayFrequency,
  SortOrder,
} from "@/lib/constants";

export type EmployeeCurrentCompensation = {
  amount: string;
  currency: Currency;
  payFrequency: PayFrequency;
  effectiveFrom: string;
  reportingSalary: string;
};

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

export type EmployeeListItem = Employee & {
  currentCompensation: EmployeeCurrentCompensation | null;
};

export type EmployeeListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  country?: string;
  department?: string;
  currency?: Currency;
  payFrequency?: PayFrequency;
  sortBy?: EmployeeSortField;
  sortOrder?: SortOrder;
  reportingCurrency?: Currency;
};

export type EmployeeListResponse = {
  data: EmployeeListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};
