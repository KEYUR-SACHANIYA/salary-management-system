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
import { formatChangeReason, formatPayFrequency } from "@/lib/formatting";

const EMPTY_FORM = {
  amount: "",
  currency: "USD" as Currency,
  payFrequency: "ANNUALLY" as PayFrequency,
  effectiveFrom: "",
  changeReason: "PROMOTION" as ChangeReason,
};

export function CompensationForm({ employeeId }: { employeeId: string }) {
  const router = useRouter();
  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [serverError, setServerError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(undefined);
    setServerError(undefined);

    const amount = form.amount.trim();
    if (!/^\d+(\.\d{1,2})?$/.test(amount) || amount === "0" || amount === "0.0" || amount === "0.00") {
      setFieldError("Enter an amount greater than zero with up to two decimal places.");
      return;
    }
    if (!form.effectiveFrom) {
      setFieldError("Effective from is required.");
      return;
    }

    setFieldError(undefined);
    setPending(true);

    try {
      await createEmployeeCompensation(employeeId, {
        amount,
        currency: form.currency,
        payFrequency: form.payFrequency,
        effectiveFrom: form.effectiveFrom,
        changeReason: form.changeReason,
      });
      setSuccess("Compensation change saved.");
      setForm({ ...EMPTY_FORM, effectiveFrom: "" });
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

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
    >
      <h2 className="sm:col-span-2 text-base font-semibold text-slate-900">
        Add compensation
      </h2>
      <p className="sm:col-span-2 text-sm text-slate-600">
        Past records stay in history. Effective dates cannot be in the past.
      </p>

      {fieldError ? (
        <div className="sm:col-span-2">
          <Alert tone="error">{fieldError}</Alert>
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

      <Field id="amount" label="Amount">
        <input
          id="amount"
          name="amount"
          inputMode="decimal"
          required
          value={form.amount}
          onChange={(event) =>
            setForm((current) => ({ ...current, amount: event.target.value }))
          }
          className={inputClassName()}
        />
      </Field>

      <Field id="currency" label="Currency">
        <select
          id="currency"
          name="currency"
          value={form.currency}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              currency: event.target.value as Currency,
            }))
          }
          className={selectClassName()}
        >
          {SUPPORTED_CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
      </Field>

      <Field id="payFrequency" label="Pay frequency">
        <select
          id="payFrequency"
          name="payFrequency"
          value={form.payFrequency}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              payFrequency: event.target.value as PayFrequency,
            }))
          }
          className={selectClassName()}
        >
          {PAY_FREQUENCIES.map((frequency) => (
            <option key={frequency} value={frequency}>
              {formatPayFrequency(frequency)}
            </option>
          ))}
        </select>
      </Field>

      <Field id="effectiveFrom" label="Effective from">
        <input
          id="effectiveFrom"
          name="effectiveFrom"
          type="date"
          required
          min={minDate}
          value={form.effectiveFrom}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              effectiveFrom: event.target.value,
            }))
          }
          className={inputClassName()}
        />
      </Field>

      <Field id="changeReason" label="Change reason">
        <select
          id="changeReason"
          name="changeReason"
          value={form.changeReason}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              changeReason: event.target.value as ChangeReason,
            }))
          }
          className={selectClassName()}
        >
          {CHANGE_REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {formatChangeReason(reason)}
            </option>
          ))}
        </select>
      </Field>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save compensation"}
        </button>
      </div>
    </form>
  );
}
