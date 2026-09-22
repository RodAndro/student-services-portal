/**
 * Small validation primitives.
 *
 * These mirror the backend's Form Request rules so the user sees problems before
 * a round trip. The server is still authoritative: a 422 always wins and is
 * always displayed.
 *
 * Uniqueness (`unique:programs,code`) cannot be checked on the client - the
 * frontend does not know the other rows - so that rule is left entirely to the API.
 */

export type FieldErrors = Record<string, string>;

export function requiredText(value: string | null | undefined, label: string): string | undefined {
  return value && value.trim().length > 0 ? undefined : `${label} is required.`;
}

export function maxText(value: string, max: number, label: string): string | undefined {
  return value.length <= max ? undefined : `${label} may not be longer than ${max} characters.`;
}

export function integerRange(
  value: number | null,
  min: number,
  max: number,
  label: string
): string | undefined {
  if (value === null || !Number.isFinite(value)) {
    return `${label} is required.`;
  }

  if (!Number.isInteger(value)) {
    return `${label} must be a whole number.`;
  }

  return value >= min && value <= max ? undefined : `${label} must be between ${min} and ${max}.`;
}

export function oneOf(
  value: string,
  allowed: readonly string[],
  label: string
): string | undefined {
  return allowed.includes(value) ? undefined : `${label} must be one of: ${allowed.join(", ")}.`;
}

/** True for a `YYYY-MM-DD` string that is a real date. */
export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function requiredDate(value: string, label: string): string | undefined {
  if (!value) {
    return `${label} is required.`;
  }

  return isIsoDate(value) ? undefined : `${label} must be a valid date.`;
}

/** Mirrors Laravel's `after:start_date`. */
export function dateAfter(
  end: string,
  start: string,
  label: string,
  startLabel: string
): string | undefined {
  if (!isIsoDate(end) || !isIsoDate(start)) {
    return undefined;
  }

  return end > start ? undefined : `${label} must be after ${startLabel}.`;
}
