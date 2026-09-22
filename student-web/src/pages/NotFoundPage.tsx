import { Link } from "react-router-dom";
import { ErrorPage } from "../components/layout/ErrorPage";

/** Rendered when the router cannot match the URL. */
export function NotFoundPage() {
  return (
    <ErrorPage
      code={404}
      title="Page not found"
      message="The address you opened does not exist in this application. Check the link, or return to the dashboard."
      action={
        <Link
          to="/"
          className="inline-flex min-h-11 items-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          Back to the dashboard
        </Link>
      }
    />
  );
}
