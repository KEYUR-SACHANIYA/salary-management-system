import type { Currency } from "../../shared/pay-rules";

export type SalaryOverview = {
  employeeCount: number;
  totalAnnualCompensation: string;
  averageAnnualCompensation: string;
  medianAnnualCompensation: string;
  lowestAnnualCompensation: string;
  highestAnnualCompensation: string;
};

export type CountrySalaryBreakdown = {
  country: string;
  employeeCount: number;
  totalAnnualCompensation: string;
  averageAnnualCompensation: string;
};

export type DepartmentSalaryBreakdown = {
  department: string;
  employeeCount: number;
  totalAnnualCompensation: string;
  averageAnnualCompensation: string;
};

export type NativeCurrencySalaryBreakdown = {
  currency: Currency;
  employeeCount: number;
  totalAnnualCompensation: string;
};

export type SalaryAnalytics = {
  reportingCurrency: Currency;
  overview: SalaryOverview;
  byCountry: CountrySalaryBreakdown[];
  byDepartment: DepartmentSalaryBreakdown[];
  byNativeCurrency: NativeCurrencySalaryBreakdown[];
};
