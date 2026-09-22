import type { ReactNode } from "react";

export type AlertTone = "info" | "success" | "warning" | "danger";

const TONES: Record<AlertTone, { wrapper: string; icon: ReactNode }> = {
  info: {
    wrapper: "border-brand-200 bg-brand-50 text-brand-900",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
      />
    )
  },
  success: {
    wrapper: "border-emerald-200 bg-emerald-50 text-emerald-900",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    )
  },
  warning: {
    wrapper: "border-amber-200 bg-amber-50 text-amber-900",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    )
  },
  danger: {
    wrapper: "border-red-200 bg-red-50 text-red-900",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
      />
    )
  }
};

export interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
}

/**
 * Message block for form-level errors, conflicts from the API and notices.
 *
 * `role="alert"` is used for the danger tone so assistive technology announces it
 * immediately; other tones use `role="status"`. An icon distinguishes the tones
 * without relying on colour.
 */
export function Alert({ tone = "info", title, children }: AlertProps) {
  const { wrapper, icon } = TONES[tone];

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`rounded-lg border px-4 py-3 text-sm ${wrapper}`}
    >
      <div className="flex gap-3">
        <svg
          className="mt-0.5 h-4 w-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
          focusable="false"
        >
          {icon}
        </svg>

        <div className="min-w-0">
          {title ? <p className="font-semibold">{title}</p> : null}
          {children ? <div className={title ? "mt-1" : ""}>{children}</div> : null}
        </div>
      </div>
    </div>
  );
}
