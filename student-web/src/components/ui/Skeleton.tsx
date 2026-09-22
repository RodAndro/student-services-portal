export function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} aria-hidden="true" />;
}

/**
 * Placeholder rows shown while a list or detail is loading.
 * `role="status"` announces "Loading" once, and the shapes prevent layout jumps.
 */
export function SkeletonBlock({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading content">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="rounded-lg border border-slate-200 bg-white p-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

/** Placeholder for a definition list (detail pages). */
export function SkeletonDetails({ fields = 6 }: { fields?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2" role="status" aria-label="Loading details">
      {Array.from({ length: fields }, (_, index) => (
        <div key={index}>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-4 w-40" />
        </div>
      ))}
    </div>
  );
}
