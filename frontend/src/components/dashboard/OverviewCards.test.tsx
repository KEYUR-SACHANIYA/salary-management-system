import { render, screen } from "@testing-library/react";
import { BreakdownTable } from "./BreakdownTable";
import { OverviewCards } from "./OverviewCards";

describe("dashboard analytics rendering", () => {
  it("renders overview amounts in the reporting currency", () => {
    render(
      <OverviewCards
        reportingCurrency="USD"
        overview={{
          employeeCount: 10000,
          totalAnnualCompensation: "1127698534.40",
          averageAnnualCompensation: "112769.85",
          medianAnnualCompensation: "104934.88",
          lowestAnnualCompensation: "6429.31",
          highestAnnualCompensation: "312414.96",
        }}
      />,
    );

    expect(screen.getByText("10,000")).toBeInTheDocument();
    expect(screen.getByText("USD 1,127,698,534.40")).toBeInTheDocument();
    expect(screen.getByText("USD 112,769.85")).toBeInTheDocument();
  });

  it("renders native-currency totals in the original currency", () => {
    render(
      <BreakdownTable
        title="By native currency"
        caption="Annualized totals in each original currency"
        labelHeader="Currency"
        showAverage={false}
        rows={[
          {
            label: "INR",
            employeeCount: 1667,
            totalAnnualCompensation: "5293755156.55",
            currency: "INR",
          },
        ]}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Currency" })).toBeInTheDocument();
    expect(screen.getByText("INR 5,293,755,156.55")).toBeInTheDocument();
    expect(screen.queryByText("Average")).not.toBeInTheDocument();
  });
});
