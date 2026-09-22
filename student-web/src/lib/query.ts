/**
 * Query-string helpers.
 *
 * The backend only understands a fixed set of parameters per endpoint (one
 * partial `search`, exact-match filters, a `sort` column from an allow-list,
 * `direction`, `page`, `per_page`). `buildQuery` drops anything empty and - when
 * an allow-list is supplied - anything the endpoint does not support, so the UI
 * can never send a meaningless parameter.
 */

/** Values a query parameter may hold. `null`/`undefined`/"" are dropped. */
export type QueryValue = string | number | null | undefined;

export function buildQuery(
  source: object,
  allowedKeys?: readonly string[]
): Record<string, string | number> {
  const result: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(source) as [string, QueryValue][]) {
    if (allowedKeys && !allowedKeys.includes(key)) {
      continue;
    }

    if (value === undefined || value === null) {
      continue;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        continue;
      }
      result[key] = trimmed;
      continue;
    }

    result[key] = value;
  }

  return result;
}

/** Page numbers and per-page values are clamped the same way the backend clamps them. */
export const PER_PAGE_DEFAULT = 15;
export const PER_PAGE_MAX = 100;

export function clampPerPage(value: number): number {
  if (!Number.isFinite(value)) {
    return PER_PAGE_DEFAULT;
  }

  return Math.min(PER_PAGE_MAX, Math.max(1, Math.trunc(value)));
}
