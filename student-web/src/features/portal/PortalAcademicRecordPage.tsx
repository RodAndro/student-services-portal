import { Alert } from "../../components/ui/Alert";
import { DEMO_STUDENT_ID } from "../../config/env";
import { StudentAcademicRecordTab } from "../students/StudentAcademicRecordTab";

/** Student portal: my academic record (GET /students/{id}/academic-record). */
export function PortalAcademicRecordPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">My academic record</h2>
        <p className="mt-1 text-sm text-slate-600">
          Your courses and grades, grouped by academic term.
        </p>
      </div>

      <Alert tone="info" title="Showing your own record only">
        <p>
          Your own academic record (from <span className="font-mono">VITE_DEMO_STUDENT_ID</span> ={" "}
          {DEMO_STUDENT_ID}). The API refuses a student access to any other student's record.
        </p>
      </Alert>

      <StudentAcademicRecordTab studentId={DEMO_STUDENT_ID} />
    </div>
  );
}
