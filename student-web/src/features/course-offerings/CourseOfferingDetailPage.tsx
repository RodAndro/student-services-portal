import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { courseOfferingsApi } from "../../api";
import { unwrap } from "../../api/unwrap";
import { useAuth } from "../../auth/useAuth";
import { ConfirmDialog } from "../../components/data/ConfirmDialog";
import { DataState } from "../../components/data/DataState";
import { DescriptionItem, DescriptionList } from "../../components/data/DescriptionList";
import { Pagination } from "../../components/data/Pagination";
import { ResourceTable } from "../../components/data/ResourceTable";
import type { Column } from "../../components/data/ResourceTable";
import { useToast } from "../../components/feedback/useToast";
import { PageHeader } from "../../components/layout/PageHeader";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { statusTone } from "../../components/ui/tones";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { LinkButton } from "../../components/ui/LinkButton";
import { useApiQuery } from "../../hooks/useApiQuery";
import { toApiError } from "../../lib/errors";
import type { ApiError } from "../../lib/errors";
import { formatDate, formatDateTime, humanizeStatus, orDash } from "../../lib/format";
import type { Enrollment } from "../../types/api";

const PER_PAGE = 15;

/**
 * Course offering detail: the offering itself plus its class list.
 *
 * Class list endpoint: GET /course-offerings/{id}/students (page/per_page only).
 * It eager-loads `student.program` but not the grade, so the list links to the grade
 * form, which knows how to detect an existing grade for the enrollment.
 */
export function CourseOfferingDetailPage() {
  const { id } = useParams();
  const offeringId = Number(id);
  const { isRole } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const canWrite = isRole("admin", "registrar");
  /** Instructors may record grades for their own offerings (EnrollmentPolicy::grade). */
  const canGrade = canWrite || isRole("instructor");

  const [classPage, setClassPage] = useState(1);

  const offeringQuery = useApiQuery(
    () => courseOfferingsApi.getCourseOffering(offeringId).then(unwrap),
    [offeringId]
  );
  const studentsQuery = useApiQuery(
    () => courseOfferingsApi.listCourseOfferingStudents(offeringId, classPage, PER_PAGE),
    [offeringId, classPage]
  );

  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<ApiError | null>(null);

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError(null);

    try {
      const result = await courseOfferingsApi.deleteCourseOffering(offeringId);
      toast.show({ tone: "success", title: result.message });
      navigate("/course-offerings", { replace: true });
    } catch (caught: unknown) {
      setDeleteError(toApiError(caught));
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<Enrollment>[] = [
    {
      key: "student",
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
      key: "program",
      header: "Program",
      render: (row) => row.student?.program?.code ?? "—"
    },
    {
      key: "enrollment_date",
      header: "Enrolled",
      render: (row) => formatDate(row.enrollment_date)
    },
    {
      key: "status",
      header: "Enrollment status",
      render: (row) => <Badge tone={statusTone(row.status)}>{humanizeStatus(row.status)}</Badge>
    }
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <p className="mb-4 text-sm">
        <Link
          to="/course-offerings"
          className="rounded font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800"
        >
          ← Back to course offerings
        </Link>
      </p>

      <DataState
        loading={offeringQuery.loading}
        error={offeringQuery.error}
        data={offeringQuery.data}
        onRetry={offeringQuery.refetch}
        emptyTitle="Course offering not found"
      >
        {(offering) => (
          <>
            <PageHeader
              title={`${offering.course?.course_code ?? `Course #${offering.course_id}`} · ${offering.section}`}
              description={
                offering.course ? offering.course.course_title : "Course offering details."
              }
              actions={
                canWrite ? (
                  <>
                    <LinkButton to={`/course-offerings/${offering.id}/edit`}>Edit</LinkButton>
                    <Button
                      variant="danger"
                      onClick={() => {
                        setDeleteError(null);
                        setConfirming(true);
                      }}
                    >
                      Delete
                    </Button>
                  </>
                ) : null
              }
            />

            <Card title="Details">
              <DescriptionList>
                <DescriptionItem
                  label="Academic term"
                  value={
                    offering.academic_term
                      ? `${offering.academic_term.academic_year} · Semester ${offering.academic_term.semester}`
                      : `#${offering.academic_term_id}`
                  }
                />
                <DescriptionItem
                  label="Instructor"
                  value={
                    offering.instructor
                      ? `${offering.instructor.name} (${offering.instructor.email})`
                      : `#${offering.instructor_id}`
                  }
                />
                <DescriptionItem label="Section" value={offering.section} />
                <DescriptionItem label="Schedule" value={offering.schedule} />
                <DescriptionItem label="Room" value={orDash(offering.room)} />
                <DescriptionItem
                  label="Capacity"
                  value={`${offering.enrollments_count ?? 0} enrolled / ${offering.capacity} places`}
                />
                <DescriptionItem
                  label="Status"
                  value={
                    <Badge tone={statusTone(offering.status)}>
                      {humanizeStatus(offering.status)}
                    </Badge>
                  }
                />
                <DescriptionItem label="Created" value={formatDateTime(offering.created_at)} />
              </DescriptionList>
            </Card>

            <div className="mt-5">
              <Card
                title="Class list"
                description="Students enrolled in this offering (GET /course-offerings/{id}/students)."
              >
                {canGrade ? (
                  <p className="mb-3 text-xs text-slate-500">
                    Use <strong>Record grade</strong> to open the grade form for a student. If a
                    grade already exists, the form tells you and links to the edit screen.
                  </p>
                ) : null}

                <DataState
                  loading={studentsQuery.loading}
                  error={studentsQuery.error}
                  data={studentsQuery.data}
                  onRetry={studentsQuery.refetch}
                  isEmpty={studentsQuery.data?.meta.total === 0}
                  emptyTitle="Nobody is enrolled yet"
                  emptyDescription="Enroll students from the Enrollments screen."
                  emptyAction={
                    canWrite ? (
                      <LinkButton
                        to={`/enrollments/new?course_offering_id=${offering.id}`}
                        variant="primary"
                      >
                        Enroll a student
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
                        caption="Students enrolled in this offering"
                        actions={
                          canGrade
                            ? (row) => (
                                <LinkButton
                                  to={`/grades/new?enrollment_id=${row.id}`}
                                  ariaLabel={`Record a grade for ${row.student?.full_name ?? "this student"}`}
                                >
                                  Record grade
                                </LinkButton>
                              )
                            : undefined
                        }
                      />

                      <Pagination
                        meta={page.meta}
                        onPageChange={setClassPage}
                        disabled={studentsQuery.loading}
                      />
                    </div>
                  )}
                </DataState>
              </Card>
            </div>

            {canGrade && !canWrite ? (
              <div className="mt-4">
                <Alert tone="info" title="Instructor access">
                  <p>
                    You can record and update grades for the students in this offering. Creating or
                    editing the offering itself is restricted to the administrator and registrar.
                  </p>
                </Alert>
              </div>
            ) : null}

            <ConfirmDialog
              open={confirming}
              title="Delete course offering"
              message={
                <>
                  <p>Delete this offering? This cannot be undone.</p>
                  <p className="mt-2 text-xs text-slate-500">
                    The API refuses to delete an offering that still has enrollments.
                  </p>
                </>
              }
              submitting={deleting}
              error={deleteError}
              onConfirm={confirmDelete}
              onCancel={() => {
                setConfirming(false);
                setDeleteError(null);
              }}
            />
          </>
        )}
      </DataState>
    </div>
  );
}
