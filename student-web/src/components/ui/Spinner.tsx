export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );
}

/** Spinner plus a label - the label is what makes it announceable to a screen reader. */
export function LoadingIndicator({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3">
      <Spinner className="h-5 w-5 text-brand-600" />
      <span className="text-sm text-slate-600">{label}</span>
    </div>
  );
}
