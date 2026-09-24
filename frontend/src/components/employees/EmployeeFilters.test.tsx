import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmployeeFilters } from "./EmployeeFilters";

const replace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

describe("EmployeeFilters", () => {
  beforeEach(() => {
    replace.mockReset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("writes filters into the URL and resets page", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(
      <EmployeeFilters
        searchParams={{ page: "3", search: "aarav", country: "Germany" }}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Department"), "Engineering");

    expect(replace).toHaveBeenCalledWith(
      "/employees?search=aarav&country=Germany&department=Engineering",
    );
  });

  it("debounces search updates by 300ms", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<EmployeeFilters searchParams={{ page: "2" }} />);

    await user.type(screen.getByLabelText("Search"), "maya");
    expect(replace).not.toHaveBeenCalled();

    jest.advanceTimersByTime(299);
    expect(replace).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(replace).toHaveBeenCalledWith("/employees?search=maya");
  });
});
