import { apiClient } from "./api-client";
import type {
  CreateCompensationInput,
  CompensationListResponse,
  CreateCompensationResponse,
} from "@/types/compensations";
import type {
  Employee,
  EmployeeListParams,
  EmployeeListResponse,
} from "@/types/employees";

function buildQueryString(params: EmployeeListParams = {}) {
  const searchParams = new URLSearchParams();

  const entries: Array<[string, string | number | undefined]> = [
    ["page", params.page],
    ["pageSize", params.pageSize],
    ["search", params.search],
    ["country", params.country],
    ["department", params.department],
    ["currency", params.currency],
    ["payFrequency", params.payFrequency],
    ["sortBy", params.sortBy],
    ["sortOrder", params.sortOrder],
    ["reportingCurrency", params.reportingCurrency],
  ];

  for (const [key, value] of entries) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

export function getEmployees(params?: EmployeeListParams) {
  return apiClient<EmployeeListResponse>(
    `/api/v1/employees${buildQueryString(params)}`,
  );
}

export function getEmployee(id: string) {
  return apiClient<Employee>(`/api/v1/employees/${encodeURIComponent(id)}`);
}

export function getEmployeeCompensations(id: string) {
  return apiClient<CompensationListResponse>(
    `/api/v1/employees/${encodeURIComponent(id)}/compensations`,
  );
}

export function createEmployeeCompensation(
  id: string,
  input: CreateCompensationInput,
) {
  return apiClient<CreateCompensationResponse>(
    `/api/v1/employees/${encodeURIComponent(id)}/compensations`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}
