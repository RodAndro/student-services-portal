import type { ReactNode } from "react";

export interface DescriptionListProps {
  children: ReactNode;
  /** Two columns from `sm` up; one column on phones. */
  columns?: 1 | 2;
  className?: string;
}

/**
 * Shared definition list for detail pages. One implementation means every record's
 * details have identical spacing, label styling and breakpoint behaviour.
 */
export function DescriptionList({ children, columns = 2, className = "" }: DescriptionListProps) {
  const grid = columns === 2 ? "sm:grid-cols-2" : "";

  return <dl className={`grid gap-4 ${grid} ${className}`}>{children}</dl>;
}

export interface DescriptionItemProps {
  label: string;
  value: ReactNode;
}

export function DescriptionItem({ label, value }: DescriptionItemProps) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-slate-800">{value}</dd>
    </div>
  );
}
