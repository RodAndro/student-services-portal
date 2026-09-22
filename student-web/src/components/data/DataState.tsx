import type { ReactNode } from "react";
import type { ApiError } from "../../lib/errors";
import { SkeletonBlock } from "../ui/Skeleton";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";

export interface DataStateProps<T> {
  loading: boolean;
  error: ApiError | null;
  data: T | null;
  onRetry?: () => void;
  /** True when the request succeeded but there is nothing to display. */
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  loadingFallback?: ReactNode;
  children: (data: T) => ReactNode;
}

/**
 * One place for the four states every data screen needs:
 * loading -> error -> empty -> content. No screen shows a blank area.
 */
export function DataState<T>({
  loading,
  error,
  data,
  onRetry,
  isEmpty = false,
  emptyTitle = "Nothing to show yet",
  emptyDescription,
  emptyAction,
  loadingFallback,
  children
}: DataStateProps<T>) {
  if (loading) {
    return <>{loadingFallback ?? <SkeletonBlock />}</>;
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  if (data === null || isEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  return <>{children(data)}</>;
}
