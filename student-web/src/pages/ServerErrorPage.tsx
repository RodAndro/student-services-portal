import { ErrorPage } from "../components/layout/ErrorPage";

/**
 * Full-page fallback for unexpected failures (500 responses, render errors).
 *
 * Uses a plain anchor rather than <Link> on purpose: this component is also the
 * router's `errorElement` and the ErrorBoundary's fallback, and in those cases a
 * router context may not exist.
 */
export function ServerErrorPage({ message }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-xl">
        <ErrorPage
          code={500}
          title="Something went wrong"
          message="The application could not display this screen. Reloading usually fixes it; if it keeps happening, the details below help diagnose the problem."
          detail={message}
          action={
            <a
              href="/"
              className="inline-flex min-h-11 items-center rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            >
              Reload the application
            </a>
          }
        />
      </div>
    </div>
  );
}
