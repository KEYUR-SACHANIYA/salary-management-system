import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api-client";
import { CompensationForm } from "./CompensationForm";

const createEmployeeCompensation = jest.fn();
const refresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

jest.mock("@/lib/employees-api", () => ({
  createEmployeeCompensation: (...args: unknown[]) =>
    createEmployeeCompensation(...args),
}));

describe("CompensationForm", () => {
  beforeEach(() => {
    createEmployeeCompensation.mockReset();
    refresh.mockReset();
  });

  it("validates required amount before calling the API", async () => {
    const user = userEvent.setup();
    render(<CompensationForm employeeId="11111111-1111-4111-8111-111111111111" />);

    await user.click(screen.getByRole("button", { name: "Save compensation" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/amount greater than zero/i);
    expect(createEmployeeCompensation).not.toHaveBeenCalled();
  });

  it("submits the backend contract and shows success feedback", async () => {
    const user = userEvent.setup();
    createEmployeeCompensation.mockResolvedValue({
      data: { id: "comp-1" },
    });

    render(<CompensationForm employeeId="11111111-1111-4111-8111-111111111111" />);

    await user.type(screen.getByLabelText("Amount"), "125000.00");
    await user.selectOptions(screen.getByLabelText("Currency"), "EUR");
    await user.selectOptions(screen.getByLabelText("Pay frequency"), "Monthly");
    await user.type(screen.getByLabelText("Effective from"), "2026-10-01");
    await user.selectOptions(screen.getByLabelText("Change reason"), "Promotion");
    await user.click(screen.getByRole("button", { name: "Save compensation" }));

    expect(createEmployeeCompensation).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
      {
        amount: "125000.00",
        currency: "EUR",
        payFrequency: "MONTHLY",
        effectiveFrom: "2026-10-01",
        changeReason: "PROMOTION",
      },
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Compensation change saved.",
    );
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByLabelText("Amount")).toHaveValue("");
  });

  it("shows backend validation errors", async () => {
    const user = userEvent.setup();
    createEmployeeCompensation.mockRejectedValue(
      new ApiError("Compensation effective date cannot be in the past", 400, "VALIDATION_ERROR"),
    );

    render(<CompensationForm employeeId="11111111-1111-4111-8111-111111111111" />);

    await user.type(screen.getByLabelText("Amount"), "1000.00");
    await user.type(screen.getByLabelText("Effective from"), "2026-10-01");
    await user.click(screen.getByRole("button", { name: "Save compensation" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Compensation effective date cannot be in the past",
    );
  });
});
