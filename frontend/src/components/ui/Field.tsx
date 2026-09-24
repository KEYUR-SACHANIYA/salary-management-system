import type { ReactNode } from "react";

const FIELD_CLASS =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm";

export function Field({
  id,
  label,
  children,
  hint,
}: {
  id: string;
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function selectClassName(extra?: string) {
  return extra ? `${FIELD_CLASS} ${extra}` : FIELD_CLASS;
}

export function inputClassName(extra?: string) {
  return extra ? `${FIELD_CLASS} ${extra}` : FIELD_CLASS;
}
