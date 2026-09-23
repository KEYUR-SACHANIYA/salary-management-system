import type { ChangeReason, CompensationStatus, Currency, PayFrequency } from "../../shared/pay-rules";

export type Compensation = {
  id: string;
  employeeId: string;
  amount: string;
  currency: Currency;
  payFrequency: PayFrequency;
  effectiveFrom: string;
  effectiveTo: string | null;
  changeReason: ChangeReason | null;
  createdAt: string;
};

export type CompensationHistoryItem = Compensation & {
  status: CompensationStatus;
};

export type CreateCompensationInput = {
  amount: string;
  currency: Currency;
  payFrequency: PayFrequency;
  effectiveFrom: string;
  changeReason: ChangeReason;
};
