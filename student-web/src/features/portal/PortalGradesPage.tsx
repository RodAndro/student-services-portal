import { Alert } from "../../components/ui/Alert";
import { DEMO_STUDENT_ID } from "../../config/env";
import { StudentGradesTab } from "../students/StudentGradesTab";

/** Student portal: my grades (GET /students/{id}/grades). */
export function PortalGradesPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">My grades</h2>
        <p className="mt-1 text-sm text-slate-600">
          Midterm and final grades for your enrollments, with the remarks the API computed.
        </p>
      </div>

      <Alert tone="info" title="Showing your own record only">
        <p>
          A student may only read their own grades, so this page uses your own student id (from{" "}
          <span className="font-mono">VITE_DEMO_STUDENT_ID</span> = {DEMO_STUDENT_ID}).
        </p>
      </Alert>

      <StudentGradesTab studentId={DEMO_STUDENT_ID} />
    </div>
  );
}
