import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { studentsApi } from "../../api";
import { unwrap } from "../../api/unwrap";
import { ConfirmDialog } from "../../components/data/ConfirmDialog";
import { DataState } from "../../components/data/DataState";
import { useToast } from "../../components/feedback/useToast";
import { Badge } from "../../components/ui/Badge";
import { statusTone } from "../../components/ui/tones";
import { Button } from "../../components/ui/Button";
import { LinkButton } from "../../components/ui/LinkButton";
import { useApiQuery } from "../../hooks/useApiQuery";
import { toApiError } from "../../lib/errors";
import type { ApiError } from "../../lib/errors";
import { humanizeStatus } from "../../lib/format";

const TABS = [
  { to: "", label: "Profile", end: true },
  { to: "enrollments", label: "Enrollments", end: false },
  { to: "grades", label: "Grades", end: false },
  { to: "academic-record", label: "Academic Record", end: false }
];

/**
 * Student detail layout.
 *
 * Loads the student once (GET /students/{id}) and shares it with the tab routes
 * through the outlet context, so switching tabs never re-fetches the profile.
 */
export function StudentDetailPage() {
  const { id } = useParams();
  const studentId = Number(id);
  const toast = useToast();
  const navigate = useNavigate();

  const query = useApiQuery(() => studentsApi.getStudent(studentId).then(unwrap), [studentId]);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<ApiError | null>(null);

  async function runDelete() {
    setBusy(true);
    setActionError(null);

    try {
      const result = await studentsApi.deleteStudent(studentId);
      toast.show({ tone: "success", title: result.message });
      navigate("/students", { replace: true });
    } catch (caught: unknown) {
      setActionError(toApiError(caught));
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus(nextStatus: "ACTIVE" | "INACTIVE") {
    setBusy(true);
    setActionError(null);

    try {
      // There is no deactivate endpoint: status is a field, so a partial update is the
      // backend-supported way to deactivate or reactivate a student.
      const result = await studentsApi.updateStudent(studentId, { status: nextStatus });
      toast.show({ tone: "success", title: result.message });
      setConfirmStatus(false);
      query.refetch();
    } catch (caught: unknown) {
      setActionError(toApiError(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <p className="mb-3 text-sm">
        <Link to="/students" className="text-blue-700 underline hover:text-blue-800">
          ← Back to students
        </Link>
      </p>

      <DataState
        loading={query.loading}
        error={query.error}
        data={query.data}
        onRetry={query.refetch}
        emptyTitle="Student not found"
      >
        {(student) => (
          <>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-semibold text-slate-800">{student.full_name}</h2>
                  <Badge tone={statusTone(student.status)}>{humanizeStatus(student.status)}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  <span className="font-mono">{student.student_number}</span>
                  {student.program ? <> · {student.program.code}</> : null} · Year{" "}
                  {student.year_level}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <LinkButton to={`/students/${student.id}/edit`}>Edit</LinkButton>

                <Button
                  variant="secondary"
                  onClick={() => {
                    setActionError(null);
                    setConfirmStatus(true);
                  }}
                >
                  {student.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                </Button>

                <Button
                  variant="danger"
                  onClick={() => {
                    setActionError(null);
                    setConfirmDelete(true);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>

            <nav aria-label="Student sections" className="mb-5 border-b border-slate-200">
              <ul className="flex flex-wrap gap-1">
                {TABS.map((tab) => (
                  <li key={tab.label}>
                    <NavLink
                      to={tab.to}
                      end={tab.end}
                      className={({ isActive }) =>
                        `inline-block rounded-t-md px-4 py-2 text-sm font-medium ${
                          isActive
                            ? "border-b-2 border-blue-600 text-blue-700"
                            : "text-slate-600 hover:bg-slate-100"
                        }`
                      }
                    >
                      {tab.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <Outlet context={{ student, refetchStudent: query.refetch }} />

            <ConfirmDialog
              open={confirmStatus}
              title={student.status === "ACTIVE" ? "Deactivate student" : "Reactivate student"}
              message={
                student.status === "ACTIVE" ? (
                  <p>
                    Set <strong>{student.full_name}</strong> to Inactive? The record is kept and can
                    be reactivated at any time.
                  </p>
                ) : (
                  <p>
                    Set <strong>{student.full_name}</strong> back to Active?
                  </p>
                )
              }
              confirmLabel={student.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
              submitting={busy}
              error={actionError}
              onConfirm={() => toggleStatus(student.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}
              onCancel={() => {
                setConfirmStatus(false);
                setActionError(null);
              }}
            />

            <ConfirmDialog
              open={confirmDelete}
              title="Delete student"
              message={
                <>
                  <p>
                    Delete <strong>{student.full_name}</strong> ({student.student_number})? This
                    cannot be undone.
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    The API refuses to delete a student who still has enrollments - deactivate
                    instead to keep the record.
                  </p>
                </>
              }
              submitting={busy}
              error={actionError}
              onConfirm={runDelete}
              onCancel={() => {
                setConfirmDelete(false);
                setActionError(null);
              }}
            />
          </>
        )}
      </DataState>
    </div>
  );
}
