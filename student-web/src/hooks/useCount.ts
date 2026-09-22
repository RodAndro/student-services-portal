import { useApiQuery } from "./useApiQuery";
import type { PaginationMeta } from "../types/api";
import type { ApiError } from "../lib/errors";

export interface CountResult {
  total: number | null;
  loading: boolean;
  error: ApiError | null;
}

/**
 * Reads `meta.total` from a paginated endpoint with `per_page=1`.
 *
 * Why: the API has no statistics or count endpoint, so a dashboard figure has to be
 * taken from the pagination metadata of the collection it describes. One row is
 * requested because only the metadata is needed.
 */
export function useCount(
  fetcher: () => Promise<{ meta: PaginationMeta }>,
  deps: readonly unknown[] = []
): CountResult {
  const query = useApiQuery(fetcher, deps);

  return {
    total: query.data?.meta.total ?? null,
    loading: query.loading,
    error: query.error
  };
}
