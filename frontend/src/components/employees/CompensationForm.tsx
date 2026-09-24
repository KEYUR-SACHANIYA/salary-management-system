"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Field, inputClassName, selectClassName } from "@/components/ui/Field";
import { ApiError } from "@/lib/api-client";
import {
  CHANGE_REASONS,
  PAY_FREQUENCIES,
  SUPPORTED_CURRENCIES,
  type ChangeReason,
  type Currency,
  type PayFrequency,
} from "@/lib/constants";
import { createEmployeeCompensation } from "@/lib/employees-api";
import {
  formatAnnualizedCompensation,
  formatChangeReason,
  formatPayFrequency,
} from "@/lib/formatting";

type ChangeTiming = "IMMEDIATE" | "FUTURE";

const EMPTY_FORM = {
  amount: "",
  currency: "USD" as Currency,
  payFrequency: "ANNUALLY" as PayFrequency,
  effectiveFrom: "",
  changeReason: "PROMOTION" as ChangeReason,
};

const CHANGE_REASON_HINTS: Record<ChangeReason, string> = {
  HIRE: "Initial compensation setup for a new hire.",
  ANNUAL_REVIEW: "Annual compensation adjustment based on performance and market trends.",
  PROMOTION: "Role-based compensation update tied to a promotion or increased scope.",
  MARKET_ADJUSTMENT: "Adjustment to ensure pay stays aligned with market conditions.",
  CORRECTION: "Corrects a prior salary record without altering historical data.",
  ROLE_CHANGE: "Compensation change related to a broader role or responsibility change.",
};

function getLocalDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year!, month! - 1, day!);
}

export function CompensationForm({ employeeId }: { employeeId: string }) {
  const router = useRouter();
  const today = useMemo(() => getLocalDateValue(new Date()), []);
  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return getLocalDateValue(date);
  }, []);

  const [timing, setTiming] = useState<ChangeTiming>("IMMEDIATE");
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    effectiveFrom: today,
  });
  const [errors, setErrors] = useState<
    Partial<Record<"amount" | "currency" | "payFrequency" | "effectiveFrom" | "changeReason", string>>
  >({});

  const firstError = Object.values(errors).find(Boolean);
  const [serverError, setServerError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  const annualPreview = useMemo(() => {
    if (!form.amount.trim() || Number(form.amount) <= 0) {
      return null;
    }

    return `${formatAnnualizedCompensation(
      form.amount,
      form.currency,
      form.payFrequency,
    )}`;
  }, [form.amount, form.currency, form.payFrequency]);

  function validateForm(nextForm = form): boolean {
    const nextErrors: Partial<
      Record<"amount" | "currency" | "payFrequency" | "effectiveFrom" | "changeReason", string>
    > = {};
    const amount = nextForm.amount.trim();
    const effectiveDate =
      timing === "IMMEDIATE" ? nextForm.effectiveFrom || today : nextForm.effectiveFrom;

    if (!amount || !/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
      nextErrors.amount = "Salary amount must be greater than 0.";
    }

    if (!nextForm.currency) {
      nextErrors.currency = "Please select a currency.";
    }

    if (!nextForm.payFrequency) {
      nextErrors.payFrequency = "Please select a pay frequency.";
    }

    if (!effectiveDate) {
      nextErrors.effectiveFrom = "Please select an effective date.";
    } else if (timing === "FUTURE") {
      const selectedDate = parseLocalDate(effectiveDate);
      const todayDate = parseLocalDate(today);
      if (selectedDate <= todayDate) {
        nextErrors.effectiveFrom = "Future salary changes must use a future effective date.";
      }
    }

    if (!nextForm.changeReason) {
      nextErrors.changeReason = "Please select a change reason.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(undefined);
    setServerError(undefined);

    if (!validateForm()) {
      return;
    }

    const payload = {
      amount: form.amount.trim(),
      currency: form.currency,
      payFrequency: form.payFrequency,
      effectiveFrom: timing === "IMMEDIATE" ? form.effectiveFrom || today : form.effectiveFrom,
      changeReason: form.changeReason,
    };

    setPending(true);

    try {
      await createEmployeeCompensation(employeeId, payload);
      setSuccess(
        timing === "IMMEDIATE" ? "Salary change saved." : "Salary change scheduled.",
      );
      setForm({ ...EMPTY_FORM, effectiveFrom: today });
      setTiming("IMMEDIATE");
      setErrors({});
      router.refresh();
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : "Unable to save this compensation change.",
      );
    } finally {
      setPending(false);
    }
  }

  const selectedReasonText = CHANGE_REASON_HINTS[form.changeReason];

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <h2 className="text-xl font-semibold text-slate-900">Add salary change</h2>
        <p className="mt-1 text-sm text-slate-600">
          Schedule a new compensation change for this employee.
        </p>
      </div>

      {firstError ? (
        <div className="sm:col-span-2">
          <Alert tone="error">{firstError}</Alert>
        </div>
      ) : null}
      {serverError ? (
        <div className="sm:col-span-2">
          <Alert tone="error">{serverError}</Alert>
        </div>
      ) : null}
      {success ? (
        <div className="sm:col-span-2">
          <Alert tone="success">{success}</Alert>
        </div>
      ) : null}

      <div className="sm:col-span-2">
        <p className="mb-2 text-sm font-medium text-slate-700">Change type</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            aria-label="Effective immediately"
            onClick={() => {
              setTiming("IMMEDIATE");
              setForm((current) => ({ ...current, effectiveFrom: today }));
              setErrors((current) => ({ ...current, effectiveFrom: undefined }));
            }}
            className={`rounded-xl border px-3 py-3 text-left transition-colors ${
              timing === "IMMEDIATE"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
            }`}
          >
            <span className="block text-sm font-semibold">Effective immediately</span>
            <span
              className={`mt-1 block text-xs ${
                timing === "IMMEDIATE" ? "text-slate-200" : "text-slate-500"
              }`}
            >
              Applies today and replaces the current pay record.
            </span>
          </button>

          <button
            type="button"
            aria-label="Schedule for a future date"
            onClick={() => {
              setTiming("FUTURE");
              setForm((current) => ({
                ...current,
                effectiveFrom: current.effectiveFrom || tomorrow,
              }));
              setErrors((current) => ({ ...current, effectiveFrom: undefined }));
            }}
            className={`rounded-xl border px-3 py-3 text-left transition-colors ${
              timing === "FUTURE"
                ? "border-sky-700 bg-sky-50 text-sky-900"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
            }`}
          >
            <span className="block text-sm font-semibold">Schedule for a future date</span>
            <span
              className={`mt-1 block text-xs ${
                timing === "FUTURE" ? "text-sky-700" : "text-slate-500"
              }`}
            >
              Keeps the current pay in place until the selected effective date.
            </span>
          </button>
        </div>
      </div>

      <Field id="amount" label="Amount">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium text-slate-500">
            {form.currency === "USD" ? "$" : form.currency === "GBP" ? "£" : form.currency === "EUR" ? "€" : form.currency === "INR" ? "₹" : form.currency === "CAD" ? "C$" : "S$"}
          </span>
          <input
            id="amount"
            name="amount"
            inputMode="decimal"
            type="text"
            value={form.amount}
            placeholder="125000.00"
            aria-invalid={Boolean(errors.amount)}
            onChange={(event) => {
              const nextValue = event.target.value;
              setForm((current) => ({ ...current, amount: nextValue }));
              setErrors((current) => ({ ...current, amount: undefined }));
            }}
            className={`${inputClassName("pl-8")} ${errors.amount ? "border-red-300" : ""}`}
          />
        </div>
        {errors.amount ? (
          <p className="mt-1 text-xs font-medium text-red-600">{errors.amount}</p>
        ) : null}
      </Field>

      <Field id="currency" label="Currency">
        <select
          id="currency"
          name="currency"
          value={form.currency}
          aria-invalid={Boolean(errors.currency)}
          onChange={(event) => {
            const nextCurrency = event.target.value as Currency;
            setForm((current) => ({ ...current, currency: nextCurrency }));
            setErrors((current) => ({ ...current, currency: undefined }));
          }}
          className={`${selectClassName()} ${errors.currency ? "border-red-300" : ""}`}
        >
          {SUPPORTED_CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
        {errors.currency ? (
          <p className="mt-1 text-xs font-medium text-red-600">{errors.currency}</p>
        ) : null}
      </Field>

      <Field id="payFrequency" label="Pay frequency">
        <select
          id="payFrequency"
          name="payFrequency"
          value={form.payFrequency}
          aria-invalid={Boolean(errors.payFrequency)}
          onChange={(event) => {
            const nextFrequency = event.target.value as PayFrequency;
            setForm((current) => ({ ...current, payFrequency: nextFrequency }));
            setErrors((current) => ({ ...current, payFrequency: undefined }));
          }}
          className={`${selectClassName()} ${errors.payFrequency ? "border-red-300" : ""}`}
        >
          {PAY_FREQUENCIES.map((frequency) => (
            <option key={frequency} value={frequency}>
              {formatPayFrequency(frequency)}
            </option>
          ))}
        </select>
        {errors.payFrequency ? (
          <p className="mt-1 text-xs font-medium text-red-600">{errors.payFrequency}</p>
        ) : null}
      </Field>

      <Field id="changeReason" label="Change reason">
        <select
          id="changeReason"
          name="changeReason"
          value={form.changeReason}
          aria-invalid={Boolean(errors.changeReason)}
          onChange={(event) => {
            const nextReason = event.target.value as ChangeReason;
            setForm((current) => ({ ...current, changeReason: nextReason }));
            setErrors((current) => ({ ...current, changeReason: undefined }));
          }}
          className={`${selectClassName()} ${errors.changeReason ? "border-red-300" : ""}`}
        >
          {CHANGE_REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {formatChangeReason(reason)}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-slate-500">{selectedReasonText}</p>
        {errors.changeReason ? (
          <p className="mt-1 text-xs font-medium text-red-600">{errors.changeReason}</p>
        ) : null}
      </Field>

      <Field id="effectiveFrom" label="Effective from">
        <input
          id="effectiveFrom"
          name="effectiveFrom"
          type="date"
          min={timing === "FUTURE" ? tomorrow : undefined}
          value={form.effectiveFrom || today}
          aria-invalid={Boolean(errors.effectiveFrom)}
          onChange={(event) => {
            const value = event.target.value;
            setForm((current) => ({ ...current, effectiveFrom: value }));
            setErrors((current) => ({ ...current, effectiveFrom: undefined }));
          }}
          className={`${inputClassName()} ${errors.effectiveFrom ? "border-red-300" : ""}`}
        />
        <p className="mt-2 text-xs text-slate-500">
          {timing === "IMMEDIATE"
            ? "The effective date defaults to today and will be applied immediately."
            : "Choose a future date to keep the current pay in place until then."}
        </p>
        {errors.effectiveFrom ? (
          <p className="mt-1 text-xs font-medium text-red-600">{errors.effectiveFrom}</p>
        ) : null}
      </Field>

      {annualPreview ? (
        <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Annualized compensation
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">{annualPreview}</p>
        </div>
      ) : null}

      <div className="sm:col-span-2 flex items-center justify-between gap-3 pt-2">
        <p className="text-xs text-slate-500">
          Salary updates remain read-only in the history once saved.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save compensation"}
        </button>
      </div>
    </form>
  );
}
