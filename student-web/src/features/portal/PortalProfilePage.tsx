import { Link } from "react-router-dom";
import { studentsApi } from "../../api";
import { unwrap } from "../../api/unwrap";
import { DataState } from "../../components/data/DataState";
import { Alert } from "../../components/ui/Alert";
import { useApiQuery } from "../../hooks/useApiQuery";
import { DEMO_STUDENT_ID } from "../../config/env";
import { StudentProfileCard } from "../students/StudentProfileCard";

/**
 * Student portal: my profile.
 *
 * The API has no "my profile" endpoint, so the id comes from VITE_DEMO_STUDENT_ID
 * (see docs/LIMITATIONS.md, W2). If it does not match the student linked to the
 * signed-in account the API answers 403, and that is explained rather than hidden.
 */
export function PortalProfilePage() {
  const query = useApiQuery(() => studentsApi.getStudent(DEMO_STUDENT_ID).then(unwrap), []);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">My profile</h2>
        <p className="mt-1 text-sm text-slate-600">
          Your own student record, read from GET /students/{DEMO_STUDENT_ID}.
        </p>
      </div>

      {query.error ? (
        <Alert tone="warning" title="This profile could not be loaded">
          <p>{query.error.message}</p>
          <p className="mt-2">
            The API has no "my profile" endpoint, so the student id comes from
            <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">
              VITE_DEMO_STUDENT_ID
            </code>
            (currently {DEMO_STUDENT_ID}). It must be the student profile linked to your account.
          </p>
        </Alert>
      ) : null}

      <DataState
        loading={query.loading}
        error={null}
        data={query.data}
        onRetry={query.refetch}
        emptyTitle="No profile data"
      >
        {(student) => <StudentProfileCard student={student} />}
      </DataState>

      <p className="text-sm">
        <Link to="/account" className="text-blue-700 underline hover:text-blue-800">
          See your account details →
        </Link>
      </p>
    </div>
  );
}
