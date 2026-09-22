import type { ReactNode } from "react";

export interface CardProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Drop the inner padding (used when the card holds a table edge to edge). */
  flush?: boolean;
}

/**
 * The one panel style used across the app: white surface, 1px border, subtle shadow
 * and consistent padding, with an optional header row for a title and actions.
 */
export function Card({
  title,
  description,
  actions,
  children,
  className = "",
  flush = false
}: CardProps) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {title || actions ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-slate-50/60 px-5 py-3.5">
          <div className="min-w-0">
            {title ? <h3 className="text-sm font-semibold text-slate-800">{title}</h3> : null}
            {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}

      <div className={flush ? "" : "px-5 py-4"}>{children}</div>
    </section>
  );
}
