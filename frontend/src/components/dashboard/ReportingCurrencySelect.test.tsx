import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReportingCurrencySelect } from "./ReportingCurrencySelect";

const replace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

describe("ReportingCurrencySelect", () => {
  beforeEach(() => {
    replace.mockReset();
  });

  it("updates the dashboard URL when the reporting currency changes", async () => {
    const user = userEvent.setup();
    render(<ReportingCurrencySelect value="USD" />);

    await user.selectOptions(screen.getByLabelText("Reporting currency"), "EUR");

    expect(replace).toHaveBeenCalledWith("/?reportingCurrency=EUR");
  });
});
