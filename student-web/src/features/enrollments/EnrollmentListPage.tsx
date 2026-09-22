import { useState } from "react";
import { enrollmentsApi, studentsApi } from "../../api";
import { useAuth } from "../../auth/useAuth";
import { ConfirmDialog } from "../../components/data/ConfirmDialog";
import { DataState } from "../../components/data/DataState";
import { FilterSelect } from "../../components/data/ListToolbar";
import { Pagination } from "../../components/data/Pagination";
import { RemoteSelect } from "../../components/data/RemoteSelect";
import { ResourceTable } from "../../components/data/ResourceTable";
import type { Column } from "../../components/data/ResourceTable";
import { useToast } from "../../components/feedback/useToast";
import { PageHeader } from "../../components/layout/PageHeader";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { statusTone } from "../../components/ui/tones";
import { Button } from "../../components/ui/Button";
import { LinkButton } from "../../components/ui/LinkButton";
import { useApiQuery } from "../../hooks/useApiQuery";
import { useListQueryState } from "../../hooks/useListQueryState";
import { courseOfferingsApi } from "../../api";
import { toApiError } from "../../lib/errors";
import type { ApiError } from "../../lib/errors";
import { formatDate, formatGrade, humanizeStatus } from "../../lib/format";
import type { Enrollment, EnrollmentListParams } from "../../types/api";

const PER_PAGE_OPTIONS = [10, 15, 25, 50];

/**
 * Enrollment list - GET /enrollments.
 *
 * The controller exposes `student_id`, `course_offering_id`, `status`, `sort`,
 * `direction`, `page` and `per_page`. There is **no `search`** parameter, so this
 * screen offers no search box: the two lookups are chosen with pickers instead.
 */
export function EnrollmentListPage() {
  const toast = useToast();
  const { isRole } = useAuth();
  const canWrite = isRole("admin", "registrar");
  const isInstructor = isRole("instructor");

  const query = useListQueryState({
    defaultSort: "id",
    defaultDirection: "desc",
    filterKeys: ["student_id", "course_offering_id", "status"]
  });
  const studentId = query.filter("student_id");
  const offeringId = query.filter("course_offering_id");
  const status = query.filter("status");

  const list = useApiQuery(
    () =>
      enrollmentsApi.listEnrollments({
        student_id: studentId ? Number(studentId) : undefined,
        course_offering_id: offeringId ? Number(offeringId) : undefined,
        status: (status || undefined) as EnrollmentListParams["status"],
        sort: query.sort,
        direction: query.direction,
        page: query.page,
        per_page: query.perPage
      }),
    [studentId, offeringId, status, query.sort, query.direction, query.page, query.perPage]
  );

  const [pendingDelete, setPendingDelete] = useState<Enrollment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<ApiError | null>(null);

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      const result = await enrollmentsApi.deleteEnrollment(pendingDelete.id);
      toast.show({ tone: "success", title: result.message });
      setPendingDelete(null);
      list.refetch();
    } catch (caught: unknown) {
      setDeleteError(toApiError(caught));
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<Enrollment>[] = [
    {
      key: "student_id",
      header: "Student",
      render: (row) =>
        row.student ? (
          <div>
            <p className="font-medium text-slate-800">{row.student.full_name}</p>
            <p className="font-mono text-xs text-slate-500">{row.student.student_number}</p>
          </div>
        ) : (
          <span className="font-mono text-xs text-slate-500">Student #{row.student_id}</span>
        )
    },
    {
      key: "course_offering_id",
      header: "Course offering",
      render: (row) => {
        const offering = row.course_offering;
        return offering ? (
          <div>
            <p className="font-medium text-slate-800">
              {offering.course ? offering.course.course_code : `Course #${offering.course_id}`} ·{" "}
              {offering.section}
            </p>
            <p className="text-xs text-slate-500">
              {offering.academic_term
                ? `${offering.academic_term.academic_year} · Sem ${offering.academic_term.semester}`
                : "—"}
            </p>
          </div>
        ) : (
          <span className="font-mono text-xs text-slate-500">
            Offering #{row.course_offering_id}
          </span>
        );
      }
    },
    {
      key: "enrollment_date",
      header: "Enrolled",
      sortable: true,
      render: (row) => formatDate(row.enrollment_date)
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => <Badge tone={statusTone(row.status)}>{humanizeStatus(row.status)}</Badge>
    },
    {
      key: "grade",
      header: "Grade",
      render: (row) =>
        row.grade ? (
          <div>
            <p>{formatGrade(row.grade.final_grade)}</p>
            <p className="text-xs text-slate-500">{row.grade.remarks}</p>
          </div>
        ) : (
          <span className="text-slate-400">No grade yet</span>
        )
    }
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Enrollments"
        description="Which student is enrolled in which course offering."
        actions={
          canWrite ? (
            <LinkButton to="/enrollments/new" variant="primary">
              New enrollment
            </LinkButton>
          ) : null
        }
      />

      {isInstructor ? (
        <div className="mb-4">
          <Alert tone="info" title="Showing enrollments in your offerings">
            <p>The API scopes an instructor to their own course offerings.</p>
          </Alert>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <RemoteSelect
          id="enrollment-student-filter"
          label="Student"
          value={studentId}
          onChange={(value) => query.setFilter("student_id", value)}
          placeholder="All students"
          searchPlaceholder="Search by name or number…"
          loadOptions={(search) =>
            studentsApi.listStudents({ search: search || undefined, per_page: 20 }).then((page) =>
              page.data.map((student) => ({
                value: String(student.id),
                label: `${student.student_number} — ${student.full_name}`
              }))
            )
          }
        />

        <RemoteSelect
          id="enrollment-offering-filter"
          label="Course offering"
          value={offeringId}
          onChange={(value) => query.setFilter("course_offering_id", value)}
          placeholder="All course offerings"
          searchPlaceholder="Search section, schedule or room…"
          loadOptions={(search) =>
            courseOfferingsApi
              .listCourseOfferings({ search: search || undefined, per_page: 20 })
              .then((page) =>
                page.data.map((offering) => ({
                  value: String(offering.id),
                  label: `${offering.course?.course_code ?? `Course #${offering.course_id}`} · ${offering.section} · ${offering.schedule}`
                }))
              )
          }
        />

        <FilterSelect
          id="enrollment-status-filter"
          label="Status"
          value={status}
          onChange={(value) => query.setFilter("status", value)}
          options={[
            { value: "ENROLLED", label: "Enrolled" },
            { value: "DROPPED", label: "Dropped" },
            { value: "COMPLETED", label: "Completed" }
          ]}
          placeholder="All statuses"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-32">
          <label htmlFor="enrollment-per-page" className="block text-xs font-medium text-slate-600">
            Per page
          </label>
          <select
            id="enrollment-per-page"
            value={query.perPage}
            onChange={(event) => query.setPerPage(Number(event.target.value))}
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {PER_PAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {query.hasFilters ? (
          <Button variant="ghost" size="sm" onClick={query.clearAll}>
            Clear filters
          </Button>
        ) : null}
      </div>

      <div className="mt-5">
        <DataState
          loading={list.loading}
          error={list.error}
          data={list.data}
          onRetry={list.refetch}
          isEmpty={list.data?.meta.total === 0}
          emptyTitle={query.hasFilters ? "No enrollments match your filters" : "No enrollments yet"}
          emptyDescription={
            query.hasFilters
              ? "Try another student or offering, or clear the filters."
              : "Enroll a student into a course offering to get started."
          }
          emptyAction={
            query.hasFilters ? (
              <Button variant="secondary" size="sm" onClick={query.clearAll}>
                Clear filters
              </Button>
            ) : canWrite ? (
              <LinkButton to="/enrollments/new" variant="primary">
                Create the first enrollment
              </LinkButton>
            ) : null
          }
        >
          {(page) => (
            <div className="space-y-3">
              <ResourceTable
                columns={columns}
                rows={page.data}
                rowKey={(row) => row.id}
                sort={query.sort}
                direction={query.direction}
                onSortChange={query.toggleSort}
                actions={(row) => (
                  <>
                    <LinkButton to={`/students/${row.student_id}`}>Student</LinkButton>
                    {canWrite ? (
                      <>
                        <LinkButton to={`/enrollments/${row.id}/edit`}>Edit</LinkButton>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setDeleteError(null);
                            setPendingDelete(row);
                          }}
                        >
                          Delete
                        </Button>
                      </>
                    ) : null}
                  </>
                )}
              />

              <Pagination meta={page.meta} onPageChange={query.setPage} disabled={list.loading} />
            </div>
          )}
        </DataState>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete enrollment"
        message={
          <p>
            Remove <strong>{pendingDelete?.student?.full_name ?? "this student"}</strong> from{" "}
            <strong>{pendingDelete?.course_offering?.section ?? "this offering"}</strong>? This
            cannot be undone. Set the status to Dropped instead if the record should be kept.
          </p>
        }
        submitting={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => {
          setPendingDelete(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
