import { LoadingIndicator } from "../ui/Spinner";

/** Full-screen loading state, used while a stored token is being verified. */
export function FullPageLoader({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <LoadingIndicator label={message} />
      </div>
    </div>
  );
}
