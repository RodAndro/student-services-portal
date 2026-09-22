import type { PaginationMeta } from "../../types/api";
import { Button } from "../ui/Button";

export interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

/**
 * Renders the `meta` object every collection endpoint returns:
 * current_page, per_page, total, last_page, from, to.
 * The range text is inside an aria-live region so it is announced after paging.
 */
export function Pagination({ meta, onPageChange, disabled = false }: PaginationProps) {
  if (meta.total === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
    >
      <p aria-live="polite" className="text-slate-600">
        Showing <span className="font-medium tabular text-slate-800">{meta.from ?? 0}</span>–
        <span className="font-medium tabular text-slate-800">{meta.to ?? 0}</span> of{" "}
        <span className="font-medium tabular text-slate-800">{meta.total}</span>
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled || meta.current_page <= 1}
          onClick={() => onPageChange(meta.current_page - 1)}
        >
          Previous
        </Button>

        <span className="px-1 text-slate-600">
          Page <span className="font-medium tabular text-slate-800">{meta.current_page}</span> of{" "}
          <span className="font-medium tabular text-slate-800">{meta.last_page}</span>
        </span>

        <Button
          variant="secondary"
          size="sm"
          disabled={disabled || meta.current_page >= meta.last_page}
          onClick={() => onPageChange(meta.current_page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
