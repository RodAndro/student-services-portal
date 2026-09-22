import { useCallback, useEffect, useRef, useState } from "react";
import { toApiError } from "../lib/errors";
import type { ApiError } from "../lib/errors";

export interface ApiQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  /** Re-run the request (used by the Retry button on error states). */
  refetch: () => void;
}

interface QueryState<T> {
  /** The request key this state belongs to, so results can be matched to requests. */
  key: string;
  data: T | null;
  error: ApiError | null;
}

/**
 * Minimal data-fetching hook: loading / data / error / refetch.
 *
 * Deliberately small - the app has one screen per resource, so a global cache
 * library would add concepts without buying anything.
 *
 * `deps` works like a `useEffect` dependency list and must contain only
 * serialisable values (ids, page numbers, search text). `loading` is derived
 * from whether the state belongs to the current request key rather than being
 * set inside the effect, which avoids a cascading render.
 */
export function useApiQuery<T>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[] = []
): ApiQueryResult<T> {
  const [reloadToken, setReloadToken] = useState(0);
  const requestKey = JSON.stringify([...deps, reloadToken]);

  const [state, setState] = useState<QueryState<T>>({ key: "", data: null, error: null });

  // Keep the latest fetcher without making it a dependency (callers usually pass
  // an inline arrow function).
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let cancelled = false;

    fetcherRef
      .current()
      .then((result) => {
        if (!cancelled) {
          setState({ key: requestKey, data: result, error: null });
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setState({ key: requestKey, data: null, error: toApiError(caught) });
        }
      });

    // Ignore the response if the key changed (or the component unmounted) while
    // the request was in flight.
    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  const loading = state.key !== requestKey;

  const refetch = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return {
    data: loading ? null : state.data,
    loading,
    error: loading ? null : state.error,
    refetch
  };
}
