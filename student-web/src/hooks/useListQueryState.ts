import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { clampPerPage, PER_PAGE_DEFAULT } from "../lib/query";
import type { SortDirection } from "../types/api";

export interface ListQueryState {
  search: string;
  sort: string;
  direction: SortDirection;
  page: number;
  perPage: number;
  /** Current value of a filter (empty string when unset). */
  filter(key: string): string;
  /** True when anything differs from the defaults. */
  hasFilters: boolean;
  setSearch(value: string): void;
  setFilter(key: string, value: string): void;
  setPage(value: number): void;
  setPerPage(value: number): void;
  /** Clicking a sortable column: same field flips direction, a new field starts ascending. */
  toggleSort(field: string): void;
  clearAll(): void;
}

export interface UseListQueryStateOptions {
  defaultSort: string;
  defaultDirection?: SortDirection;
  /** Filter keys this endpoint supports; used for `hasFilters` and clearing. */
  filterKeys?: readonly string[];
}

/**
 * Keeps list state (search, sort, direction, page, per-page and filters) in the URL.
 *
 * Why the URL: the view survives a refresh, it is shareable, and the browser's
 * back/forward buttons work. Every change drops back to page 1 except changing
 * the page itself, so you never land on an empty page 7 of a 2-result search.
 */
export function useListQueryState({
  defaultSort,
  defaultDirection = "asc",
  filterKeys = []
}: UseListQueryStateOptions): ListQueryState {
  const [params, setParams] = useSearchParams();

  const search = params.get("search") ?? "";
  const sort = params.get("sort") ?? defaultSort;

  const rawDirection = params.get("direction");
  const direction: SortDirection =
    rawDirection === "asc" || rawDirection === "desc" ? rawDirection : defaultDirection;

  const rawPage = Number(params.get("page"));
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.trunc(rawPage) : 1;

  const rawPerPage = Number(params.get("per_page"));
  const perPage =
    Number.isFinite(rawPerPage) && rawPerPage > 0 ? clampPerPage(rawPerPage) : PER_PAGE_DEFAULT;

  const update = useCallback(
    (mutate: (next: URLSearchParams) => void, keepPage = false) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          mutate(next);

          if (!keepPage) {
            next.delete("page");
          }

          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  const setSearch = useCallback(
    (value: string) =>
      update((next) => (value ? next.set("search", value) : next.delete("search"))),
    [update]
  );

  const setFilter = useCallback(
    (key: string, value: string) =>
      update((next) => (value ? next.set(key, value) : next.delete(key))),
    [update]
  );

  const setPage = useCallback(
    (value: number) => update((next) => next.set("page", String(Math.max(1, value))), true),
    [update]
  );

  const setPerPage = useCallback(
    (value: number) => update((next) => next.set("per_page", String(clampPerPage(value)))),
    [update]
  );

  const toggleSort = useCallback(
    (field: string) =>
      update((next) => {
        const isSame = (next.get("sort") ?? defaultSort) === field;
        const currentDirection =
          next.get("direction") === "asc" || next.get("direction") === "desc"
            ? (next.get("direction") as SortDirection)
            : defaultDirection;

        next.set("sort", field);
        next.set("direction", isSame && currentDirection === "asc" ? "desc" : "asc");
      }),
    [update, defaultSort, defaultDirection]
  );

  const clearAll = useCallback(
    () => setParams(new URLSearchParams(), { replace: true }),
    [setParams]
  );

  const filter = useCallback((key: string) => params.get(key) ?? "", [params]);

  const hasFilters = useMemo(() => {
    if (search.length > 0) {
      return true;
    }

    if (sort !== defaultSort || direction !== defaultDirection) {
      return true;
    }

    return filterKeys.some((key) => (params.get(key) ?? "").length > 0);
  }, [search, sort, direction, defaultSort, defaultDirection, filterKeys, params]);

  return {
    search,
    sort,
    direction,
    page,
    perPage,
    filter,
    hasFilters,
    setSearch,
    setFilter,
    setPage,
    setPerPage,
    toggleSort,
    clearAll
  };
}
