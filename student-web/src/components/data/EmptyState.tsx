import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Shown when a request succeeded but there is nothing to display. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <svg
        className="mx-auto h-10 w-10 text-slate-300"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
        focusable="false"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 9.75h16.5M3.75 9.75v7.5a2.25 2.25 0 002.25 2.25h12a2.25 2.25 0 002.25-2.25v-7.5M3.75 9.75l1.5-4.5a2.25 2.25 0 012.12-1.5h9.26a2.25 2.25 0 012.12 1.5l1.5 4.5"
        />
      </svg>

      <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
