import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { coursesApi } from "../../api";
import { unwrap } from "../../api/unwrap";
import { useAuth } from "../../auth/useAuth";
import { ConfirmDialog } from "../../components/data/ConfirmDialog";
import { DataState } from "../../components/data/DataState";
import { DescriptionItem, DescriptionList } from "../../components/data/DescriptionList";
import { useToast } from "../../components/feedback/useToast";
import { PageHeader } from "../../components/layout/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { statusTone } from "../../components/ui/tones";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { LinkButton } from "../../components/ui/LinkButton";
import { useApiQuery } from "../../hooks/useApiQuery";
import { toApiError } from "../../lib/errors";
import type { ApiError } from "../../lib/errors";
import { formatDateTime, humanizeStatus, orDash } from "../../lib/format";

export function CourseDetailPage() {
  const { id } = useParams();
  const courseId = Number(id);
  const { isRole } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const canWrite = isRole("admin", "registrar");

  const query = useApiQuery(() => coursesApi.getCourse(courseId).then(unwrap), [courseId]);

  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<ApiError | null>(null);

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError(null);

    try {
      const result = await coursesApi.deleteCourse(courseId);
      toast.show({ tone: "success", title: result.message });
      navigate("/courses", { replace: true });
    } catch (caught: unknown) {
      setDeleteError(toApiError(caught));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-4 text-sm">
        <Link
          to="/courses"
          className="rounded font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800"
        >
          ← Back to courses
        </Link>
      </p>

      <DataState
        loading={query.loading}
        error={query.error}
        data={query.data}
        onRetry={query.refetch}
        emptyTitle="Course not found"
      >
        {(course) => (
          <>
            <PageHeader
              title={course.course_title}
              description={`Course code ${course.course_code}`}
              actions={
                canWrite ? (
                  <>
                    <LinkButton to={`/courses/${course.id}/edit`}>Edit</LinkButton>
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
                  label="Course code"
                  value={<span className="font-mono">{course.course_code}</span>}
                />
                <DescriptionItem label="Units" value={course.units} />
                <DescriptionItem
                  label="Status"
                  value={
                    <Badge tone={statusTone(course.status)}>{humanizeStatus(course.status)}</Badge>
                  }
                />
                <DescriptionItem label="Description" value={orDash(course.description)} />
                <DescriptionItem label="Created" value={formatDateTime(course.created_at)} />
                <DescriptionItem label="Last updated" value={formatDateTime(course.updated_at)} />
              </DescriptionList>
            </Card>

            <ConfirmDialog
              open={confirming}
              title="Delete course"
              message={
                <>
                  <p>
                    Delete <strong>{course.course_title}</strong> ({course.course_code})? This
                    cannot be undone.
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    The API refuses to delete a course that still has course offerings.
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
