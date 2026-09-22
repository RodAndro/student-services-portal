import { useCallback, useState } from "react";
import type { FieldErrors } from "../validation/validators";

export interface FormState<T extends object> {
  values: T;
  errors: FieldErrors;
  setField<K extends keyof T & string>(key: K, value: T[K]): void;
  setErrors(errors: FieldErrors): void;
  /** Merges a 422 response's `errors` object into the field errors. */
  applyServerErrors(fieldErrors?: Record<string, string[]>): void;
  /** Replaces the values (used when an entity finishes loading in edit mode). */
  reset(next: T): void;
  clearError(key: string): void;
}

/**
 * Minimal form state: values, per-field errors, and a helper to merge the
 * server's 422 payload. Client rules and server rules then surface through the
 * exact same error display.
 */
export function useFormState<T extends object>(initial: T): FormState<T> {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});

  const setField = useCallback(<K extends keyof T & string>(key: K, value: T[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!(key in current)) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  const applyServerErrors = useCallback((fieldErrors?: Record<string, string[]>) => {
    if (!fieldErrors) {
      return;
    }

    const flattened: FieldErrors = {};
    for (const [field, messages] of Object.entries(fieldErrors)) {
      flattened[field] = messages.join(" ");
    }
    setErrors(flattened);
  }, []);

  const reset = useCallback((next: T) => {
    setValues(next);
    setErrors({});
  }, []);

  const clearError = useCallback((key: string) => {
    setErrors((current) => {
      if (!(key in current)) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  return { values, errors, setField, setErrors, applyServerErrors, reset, clearError };
}
