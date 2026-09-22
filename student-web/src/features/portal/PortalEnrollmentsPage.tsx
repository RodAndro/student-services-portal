import { Alert } from "../../components/ui/Alert";
import { DEMO_STUDENT_ID } from "../../config/env";
import { StudentEnrollmentsTab } from "../students/StudentEnrollmentsTab";

/** Student portal: my enrollments (GET /students/{id}/enrollments). */
export function PortalEnrollmentsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">My enrollments</h2>
        <p className="mt-1 text-sm text-slate-600">
          The course offerings you are enrolled in, with the grade recorded so far.
        </p>
      </div>

      <Alert tone="info" title="Showing your own record only">
        <p>
          A student is refused by every list endpoint, so this page uses your own student id (from{" "}
          <span className="font-mono">VITE_DEMO_STUDENT_ID</span> = {DEMO_STUDENT_ID}).
        </p>
      </Alert>

      <StudentEnrollmentsTab studentId={DEMO_STUDENT_ID} />
    </div>
  );
}
