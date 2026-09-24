import { render, screen } from "@testing-library/react";
import { CompensationHistory } from "./CompensationHistory";
import type { CompensationHistoryItem } from "@/types/compensations";

const items: CompensationHistoryItem[] = [
  {
    id: "future",
    employeeId: "emp-1",
    amount: "130000.00",
    currency: "USD",
    payFrequency: "ANNUALLY",
    effectiveFrom: "2099-01-01",
    effectiveTo: null,
    changeReason: "PROMOTION",
    createdAt: "2026-01-01T00:00:00.000Z",
    status: "FUTURE",
  },
  {
    id: "current",
    employeeId: "emp-1",
    amount: "120000.00",
    currency: "USD",
    payFrequency: "ANNUALLY",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2098-12-31",
    changeReason: "HIRE",
    createdAt: "2026-01-01T00:00:00.000Z",
    status: "CURRENT",
  },
  {
    id: "historical",
    employeeId: "emp-1",
    amount: "90000.00",
    currency: "USD",
    payFrequency: "MONTHLY",
    effectiveFrom: "2024-01-01",
    effectiveTo: "2025-12-31",
    changeReason: "ANNUAL_REVIEW",
    createdAt: "2024-01-01T00:00:00.000Z",
    status: "HISTORICAL",
  },
];

describe("CompensationHistory", () => {
  it("renders backend status labels and native amounts", () => {
    render(<CompensationHistory items={items} />);

    expect(screen.getByText("Future")).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getByText("Historical")).toBeInTheDocument();
    expect(screen.getByText("$130,000.00")).toBeInTheDocument();
    expect(screen.getByText("$90,000.00")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
  });
});
