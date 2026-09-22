import { Spinner } from "../ui/Spinner";

export interface StatCardProps {
  label: string;
  /** A figure from the API - a count, or a short value such as a program code. */
  value: number | string | null;
  loading?: boolean;
  /** Explanation shown when the figure cannot be read. */
  errorMessage?: string | null;
  hint?: string;
}

/**
 * One figure on the dashboard. The number always comes from the API's pagination
 * metadata - nothing here is estimated or hard-coded.
 */
export function StatCard({
  label,
  value,
  loading = false,
  errorMessage = null,
  hint
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>

      {loading ? (
        <div className="mt-2 flex h-8 items-center" role="status" aria-label={`Loading ${label}`}>
          <Spinner className="h-4 w-4 text-slate-400" />
        </div>
      ) : errorMessage ? (
        <p className="mt-2 text-xs font-medium text-red-700">{errorMessage}</p>
      ) : (
        <p className="mt-2 text-2xl font-semibold tabular text-slate-800">{value ?? "—"}</p>
      )}

      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
