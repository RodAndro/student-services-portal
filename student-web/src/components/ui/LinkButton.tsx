import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export interface LinkButtonProps {
  to: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
  /** Extra context for screen readers when the visible label is generic ("View"). */
  ariaLabel?: string;
}

/**
 * A router link styled as a button so navigation actions look like actions.
 * Rendered as an <a>, so keyboard and screen-reader behaviour is correct.
 */
export function LinkButton({
  to,
  children,
  variant = "secondary",
  size = "sm",
  ariaLabel
}: LinkButtonProps) {
  const styles =
    variant === "primary"
      ? "bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:ring-brand-600"
      : "border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:ring-slate-400";

  const sizing = size === "sm" ? "min-h-10 px-3 text-[13px]" : "min-h-11 px-4 text-sm";

  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${styles} ${sizing}`}
    >
      {children}
    </Link>
  );
}
