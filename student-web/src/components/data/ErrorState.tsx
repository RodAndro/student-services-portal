import { errorTitle } from "../../lib/errors";
import type { ApiError } from "../../lib/errors";
import { Button } from "../ui/Button";

export interface ErrorStateProps {
  error: ApiError;
  onRetry?: () => void;
}

/**
 * Shows the API's own message plus a retry action, and never hides the reason.
 * The heading comes from the status code so the kind of failure is obvious at a
 * glance; the status number is also written out, not only colour-coded.
 */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center">
      <svg
        className="mx-auto h-9 w-9 text-red-500"
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
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>

      <p className="mt-3 text-sm font-semibold text-red-900">{errorTitle(error.status)}</p>
      <p className="mx-auto mt-1 max-w-lg text-sm text-red-800">{error.message}</p>

      {error.fieldErrors ? (
        <ul className="mx-auto mt-3 max-w-lg list-inside list-disc space-y-0.5 text-left text-xs text-red-800">
          {Object.entries(error.fieldErrors).map(([field, messages]) => (
            <li key={field}>
              <span className="font-medium">{field}</span>: {messages.join(" ")}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-3 text-xs text-red-700">
        {error.status === 0
          ? "The request never reached the server."
          : `HTTP status ${error.status}`}
      </p>

      {onRetry ? (
        <div className="mt-5 flex justify-center">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  );
}
