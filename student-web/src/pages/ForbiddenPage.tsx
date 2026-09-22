import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { ErrorPage } from "../components/layout/ErrorPage";

/**
 * Shown when the signed-in user reaches a page their role may not use.
 * The backend always enforces this too - the UI is only a convenience.
 */
export function ForbiddenPage() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";

  return (
    <ErrorPage
      code={403}
      title="You do not have access to this page"
      message={
        isStudent
          ? "Student accounts can only read their own profile, enrollments, grades and academic record."
          : "Your role is not allowed to view this resource. If you believe this is a mistake, contact the administrator."
      }
      action={
        <>
          <Link
            to={isStudent ? "/portal" : "/"}
            className="inline-flex min-h-11 items-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            {isStudent ? "Go to my profile" : "Back to the dashboard"}
          </Link>

          <Link
            to="/account"
            className="inline-flex min-h-11 items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            My account
          </Link>
        </>
      }
    />
  );
}
