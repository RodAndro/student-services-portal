import type { ReactNode } from "react";
import type { SortDirection } from "../../types/api";

export interface Column<T> {
  /** Column key; also the sort field name when `sortable` is set. */
  key: string;
  header: string;
  sortable?: boolean;
  /** Right-align (used for counts such as units and capacity). */
  align?: "left" | "right";
  render(row: T): ReactNode;
}

export interface ResourceTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey(row: T): string | number;
  /** Describes the table for screen readers, e.g. "Students". */
  caption?: string;
  sort?: string;
  direction?: SortDirection;
  onSortChange?(field: string): void;
  /** Row actions (view / edit / delete). */
  actions?(row: T): ReactNode;
}

/**
 * One table component for every list screen.
 *
 * - `lg+`: a real `<table>` with a sticky header, sortable column buttons and
 *   `aria-sort`, so the sortable state is announced.
 * - below `lg`: each row becomes a labelled card with the same fields, which is what
 *   makes the lists usable on a phone or a narrow tablet.
 */
export function ResourceTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  sort,
  direction,
  onSortChange,
  actions
}: ResourceTableProps<T>) {
  function headerContent(column: Column<T>): ReactNode {
    if (!column.sortable || !onSortChange) {
      return <span>{column.header}</span>;
    }

    const isActive = sort === column.key;

    return (
      <button
        type="button"
        onClick={() => onSortChange(column.key)}
        className={`inline-flex items-center gap-1 rounded font-semibold transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ${
          isActive ? "text-brand-700" : "text-slate-600"
        }`}
      >
        {column.header}
        <span aria-hidden="true" className={isActive ? "" : "text-slate-400"}>
          {isActive && direction === "desc" ? "▼" : "▲"}
        </span>
        <span className="sr-only">
          {isActive
            ? `sorted ${direction === "desc" ? "descending" : "ascending"}, activate to change`
            : "activate to sort"}
        </span>
      </button>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white lg:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          {caption ? <caption className="sr-only">{caption}</caption> : null}

          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    sort === column.key
                      ? direction === "desc"
                        ? "descending"
                        : "ascending"
                      : "none"
                  }
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${
                    column.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {headerContent(column)}
                </th>
              ))}

              {actions ? (
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={rowKey(row)} className="transition-colors hover:bg-slate-50/80">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 align-top text-slate-700 ${
                      column.align === "right" ? "text-right tabular" : ""
                    }`}
                  >
                    {column.render(row)}
                  </td>
                ))}

                {actions ? (
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">{actions(row)}</div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 lg:hidden">
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <dl className="space-y-2">
              {columns.map((column) => (
                <div key={column.key} className="flex items-start justify-between gap-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {column.header}
                  </dt>
                  <dd className="text-right text-sm text-slate-800">{column.render(row)}</dd>
                </div>
              ))}
            </dl>

            {actions ? (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                {actions(row)}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
