import { render, screen } from "@testing-library/react";
import { EmployeeTable } from "./EmployeeTable";
import type { EmployeeListItem } from "@/types/employees";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const employees: EmployeeListItem[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    employeeCode: "EMP000001",
    name: "Aarav Sharma",
    country: "Germany",
    department: "Engineering",
    role: "Software Engineer",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    currentCompensation: {
      amount: "116173.00",
      currency: "EUR",
      payFrequency: "ANNUALLY",
      effectiveFrom: "2026-03-28",
      reportingSalary: "132014.77",
    },
  },
];

describe("EmployeeTable", () => {
  it("renders native compensation instead of reportingSalary", () => {
    render(
      <EmployeeTable
        employees={employees}
        query={{ page: 1, sortBy: "name", sortOrder: "asc" }}
      />,
    );

    expect(screen.getByRole("link", { name: /Aarav Sharma/i })).toHaveAttribute(
      "href",
      "/employees/11111111-1111-4111-8111-111111111111",
    );
    expect(screen.getAllByText("EMP000001")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Germany")[0]).toBeInTheDocument();
    expect(screen.getAllByText("EUR 116,173.00")[0]).toBeInTheDocument();
    expect(screen.queryByText("132014.77")).not.toBeInTheDocument();
    expect(screen.queryByText(/132,014/)).not.toBeInTheDocument();
  });

  it("builds sort links that reset page to 1", () => {
    render(
      <EmployeeTable
        employees={employees}
        query={{
          page: 4,
          search: "aarav",
          country: "Germany",
          sortBy: "name",
          sortOrder: "asc",
        }}
      />,
    );

    expect(screen.getByRole("link", { name: /Employee code/i })).toHaveAttribute(
      "href",
      "/employees?search=aarav&country=Germany",
    );
    expect(screen.getByRole("link", { name: /Current salary/i })).toHaveAttribute(
      "href",
      "/employees?search=aarav&country=Germany&sortBy=salary",
    );
  });
});
