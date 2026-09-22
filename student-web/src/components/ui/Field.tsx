import type { ReactNode } from "react";

export interface FieldProps {
  /** Must match the control's id - this is what labels the control. */
  htmlFor: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}

/**
 * A form field: label, control, optional hint, optional error.
 *
 * The hint and the error each get an id derived from the control, and the control
 * receives `aria-describedby` from its own component when `invalid` is set - so a
 * screen reader reads the message together with the input.
 */
export function Field({ htmlFor, label, required = false, hint, error, children }: FieldProps) {
  const hintId = `${htmlFor}-hint`;
  const errorId = `${htmlFor}-error`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
        {label}
        {required ? (
          <span className="ml-1 text-red-600" title="Required">
            *<span className="sr-only"> (required)</span>
          </span>
        ) : null}
      </label>

      {children}

      {hint && !error ? (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
