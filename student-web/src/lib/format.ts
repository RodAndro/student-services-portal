/**
 * Small display formatters. Keeping them here means dates, statuses and grades
 * are rendered the same way everywhere.
 */

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  year: "numeric",
  month: "short",
  day: "numeric"
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

/** "2026-08-10" -> "Aug 10, 2026". */
export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : dateFormatter.format(parsed);
}

/** ISO-8601 timestamp -> "Aug 10, 2026, 09:15". */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : dateTimeFormatter.format(parsed);
}

/** "IN PROGRESS" / "PARTIALLY_PAID" -> "In Progress". */
export function humanizeStatus(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => (part.length > 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
}

/** Nullable grade -> "88" or an em dash. */
export function formatGrade(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : String(value);
}

/** Show the unrendered value during development if something is missing. */
export function orDash(value: string | null | undefined): string {
  return value && value.length > 0 ? value : "—";
}
